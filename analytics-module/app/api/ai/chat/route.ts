import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getOllamaClient } from '@/lib/ai/ollama'
import { getGroqClient } from '@/lib/ai/groq'
import { getHuggingFaceClient } from '@/lib/ai/huggingface'
import { semanticCache } from '@/lib/ai/semantic-cache'
import { prisma } from '@payaid/db'
import { analyzePromptContext, formatClarifyingQuestions } from '@/lib/ai/context-analyzer'
import { z } from 'zod'
import { mediumPriorityQueue } from '@/lib/queue/bull'

const chatSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    module: z.enum(['crm', 'accounting', 'inventory', 'marketing', 'hr', 'general']).optional(),
    tenantId: z.string().optional(),
  }).optional(),
})

// POST /api/ai/chat - Chat with AI assistant
export async function POST(request: NextRequest) {
  try {
    // Check Analytics/AI Studio module license
    let tenantId: string
    let userId: string
    try {
      const result = await requireModuleAccess(request, 'analytics')
      tenantId = result.tenantId
      userId = result.userId
    } catch {
      // Fallback to ai-studio if analytics not available
      try {
        const result = await requireModuleAccess(request, 'ai-studio')
        tenantId = result.tenantId
        userId = result.userId
      } catch {
        return NextResponse.json(
          { error: 'Analytics or AI Studio module license required' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const validated = chatSchema.parse(body)

    // Check if query is personal/non-business and reject it
    const personalKeywords = [
      'girlfriend', 'boyfriend', 'wife', 'husband', 'dating', 'love', 'relationship',
      'family', 'personal', 'life', 'marriage', 'divorce', 'breakup', 'romance',
      'sex', 'intimate', 'private', 'personal problem', 'personal issue'
    ]
    
    const lowerMessage = validated.message.toLowerCase()
    const isPersonalQuery = personalKeywords.some(keyword => lowerMessage.includes(keyword))
    
    if (isPersonalQuery) {
      return NextResponse.json({
        message: "I'm a business assistant and can only help with business-related questions. How can I assist you with your business today?",
        service: 'filtered',
        cached: false,
      })
    }

    // Get business context (simplified - full implementation would be in helper function)
    let businessContext = ''
    try {
      // Get recent contacts, deals, invoices for context
      const [contacts, deals, invoices] = await Promise.all([
        prisma.contact.findMany({
          where: { tenantId },
          take: 10,
          select: { id: true, name: true, email: true, company: true },
        }),
        prisma.deal.findMany({
          where: { tenantId },
          take: 10,
          select: { id: true, name: true, value: true, stage: true },
        }),
        prisma.invoice.findMany({
          where: { tenantId },
          take: 10,
          select: { id: true, invoiceNumber: true, total: true, status: true },
        }),
      ])

      businessContext = `Recent Contacts: ${contacts.map(c => c.name).join(', ')}\nRecent Deals: ${deals.map(d => d.name).join(', ')}\nRecent Invoices: ${invoices.map(i => i.invoiceNumber).join(', ')}`
    } catch (contextError) {
      console.error('Error getting business context:', contextError)
      businessContext = 'Business context unavailable.'
    }

    // Try to get AI response - use Groq first (fastest), then Ollama
    let response = ''
    let usedService = 'groq'
    
    try {
      const groq = getGroqClient()
      const groqResponse = await groq.chat([
        {
          role: 'system',
          content: `You are a helpful business assistant for PayAid. Help with business-related questions only. Context: ${businessContext}`,
        },
        {
          role: 'user',
          content: validated.message,
        },
      ])
      response = groqResponse.message || 'I apologize, but I could not generate a response.'
    } catch (groqError) {
      // Fallback to Ollama
      try {
        const ollama = getOllamaClient()
        const ollamaResponse = await ollama.chat([
          {
            role: 'system',
            content: `You are a helpful business assistant. Context: ${businessContext}`,
          },
          {
            role: 'user',
            content: validated.message,
          },
        ])
        response = ollamaResponse.message || 'I apologize, but I could not generate a response.'
        usedService = 'ollama'
      } catch (ollamaError) {
        // Last resort - simple response
        response = 'I apologize, but AI services are currently unavailable. Please try again later.'
        usedService = 'fallback'
      }
    }

    // Log usage (async)
    mediumPriorityQueue.add('log-ai-usage', {
      userId,
      tenantId,
      service: usedService,
      prompt: validated.message.substring(0, 200),
      responseLength: response.length,
    })

    return NextResponse.json({
      message: response,
      service: usedService,
      cached: false,
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('AI chat error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


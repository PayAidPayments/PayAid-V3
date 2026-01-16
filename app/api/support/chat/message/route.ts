import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { getAdaptivePrompt } from '@/lib/ai/learning'

const chatMessageSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
})

// POST /api/support/chat/message - AI-assisted support chat
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = chatMessageSchema.parse(body)

    // Get adaptive prompt based on feedback history
    const adaptivePrompt = await getAdaptivePrompt(tenantId, validated.message)

    // Analyze message to determine if AI can resolve, route, or book
    const messageLower = validated.message.toLowerCase()
    
    // Simple intent detection - in production, use NLP/AI
    let actions: {
      resolved?: boolean
      routed?: boolean
      booked?: boolean
      confidence?: number
    } = {}

    // Check if it's a common question that can be auto-resolved
    const commonQuestions = [
      'how to', 'how do i', 'where is', 'what is', 'can i', 'is it possible',
      'password', 'login', 'forgot', 'reset', 'account', 'billing', 'invoice',
      'payment', 'refund', 'cancel', 'subscription'
    ]

    const canAutoResolve = commonQuestions.some(q => messageLower.includes(q))
    
    if (canAutoResolve) {
      // AI can resolve this
      actions.resolved = true
      actions.confidence = 0.85
    } else if (messageLower.includes('meeting') || messageLower.includes('schedule') || messageLower.includes('book')) {
      // AI can book a meeting
      actions.booked = true
      actions.confidence = 0.80
    } else if (messageLower.includes('escalate') || messageLower.includes('agent') || messageLower.includes('human')) {
      // Route to human agent
      actions.routed = true
      actions.confidence = 0.90
    }

    // Generate AI response
    // In production, use actual AI/LLM with knowledge base
    let response = ''
    
    if (actions.resolved) {
      response = `I can help you with that! Based on your question, here's the solution:\n\n${getSolutionForQuestion(validated.message)}\n\nIf this resolves your issue, you're all set! If you need further assistance, feel free to ask.`
    } else if (actions.booked) {
      response = `I'd be happy to schedule a meeting for you. Let me check available slots and book a time that works for you. Would you prefer a call or video meeting?`
    } else if (actions.routed) {
      response = `I understand you'd like to speak with a human agent. I'm routing your request to our support team. They'll be with you shortly.`
    } else {
      response = `Thank you for contacting support. I'm here to help. Could you provide more details about your issue so I can assist you better?\n\n${adaptivePrompt ? `\nNote: ${adaptivePrompt}` : ''}`
    }

    return NextResponse.json({
      response,
      actions,
      message: 'AI support response generated',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Chat message error:', error)
    return NextResponse.json(
      { error: 'Failed to process message', message: error?.message },
      { status: 500 }
    )
  }
}

// Helper to get solution for common questions
function getSolutionForQuestion(question: string): string {
  const lower = question.toLowerCase()
  
  if (lower.includes('password') || lower.includes('login') || lower.includes('forgot')) {
    return 'To reset your password, go to Settings > Security > Reset Password. You\'ll receive an email with reset instructions.'
  }
  if (lower.includes('invoice') || lower.includes('billing')) {
    return 'You can view and download invoices from the Invoices section. Go to Finance > Invoices to access all your invoices.'
  }
  if (lower.includes('payment')) {
    return 'Payments can be made via UPI, Credit Card, or Net Banking. Go to the invoice and click "Pay Now" to proceed.'
  }
  if (lower.includes('cancel') || lower.includes('subscription')) {
    return 'To cancel your subscription, go to Settings > Billing > Cancel Subscription. Your access will continue until the end of your billing period.'
  }
  
  return 'I found relevant information in our knowledge base. Please check the Help Center for detailed guides, or I can provide more specific assistance if you share more details.'
}

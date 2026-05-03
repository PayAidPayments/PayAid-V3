import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { getGroqClient } from '@/lib/ai/groq'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['email', 'whatsapp']),
  contactId: z.string().optional(),
  tenantId: z.string().optional(),
  intent: z.string().min(1, 'Intent is required'),
  context: z.object({
    contactName: z.string().optional(),
    company: z.string().optional(),
    recentActivity: z.string().optional(),
  }).optional(),
})

/**
 * POST /api/ai/generate-message
 * Generate a short outreach message (email or WhatsApp) from intent and contact context.
 */
export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { type, intent, context } = schema.parse(body)
    const contactName = context?.contactName || 'the contact'
    const company = context?.company || 'their company'

    const groq = getGroqClient()
    const systemPrompt =
      type === 'email'
        ? `You are a concise sales assistant. Write a single short professional email (2-4 sentences) to ${contactName}${company ? ` at ${company}` : ''}. Be friendly and direct. Output only the email body, no subject line.`
        : `You are a concise sales assistant. Write a single short WhatsApp message (1-3 sentences) to ${contactName}${company ? ` at ${company}` : ''}. Be friendly and direct. No greetings like "Hi" at the start if the message is very short. Output only the message body.`
    const userPrompt = `Intent: ${intent}\n\nGenerate the ${type} message now.`

    const message = await groq.generateCompletion(userPrompt, systemPrompt)

    return NextResponse.json({
      message: (message || '').trim(),
      content: (message || '').trim(),
      type,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Generate message error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getSendGridClient } from '@/lib/email/sendgrid'
import { emailTemplates, renderTemplate } from '@/lib/email/templates'
import { z } from 'zod'
import { mediumPriorityQueue } from '@/lib/queue/bull'

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  template: z.enum(['welcome', 'invoice', 'orderConfirmation']).optional(),
  templateVariables: z.record(z.string()).optional(),
  attachments: z.array(z.object({
    content: z.string(),
    filename: z.string(),
    type: z.string().optional(),
  })).optional(),
})

// POST /api/email/send - Send an email
export async function POST(request: NextRequest) {
  try {
    // Check CRM module license (email is part of customer communication/CRM)
    await requireModuleAccess(request, 'communication')

    const body = await request.json()
    const validated = sendEmailSchema.parse(body)

    const sendGrid = getSendGridClient()

    let html = validated.html
    let text = validated.text

    // Use template if provided
    if (validated.template && emailTemplates[validated.template]) {
      const template = emailTemplates[validated.template]
      html = renderTemplate(template.html, validated.templateVariables || {})
      // Templates may not have text property, use empty string as fallback
      if ('text' in template && typeof template.text === 'string' && template.text) {
        text = renderTemplate(template.text, validated.templateVariables || {})
      } else {
        text = text || ''
      }
    }

    // Send email asynchronously
    await mediumPriorityQueue.add('send-email', {
      to: validated.to,
      from: sendGrid['fromEmail'],
      subject: validated.subject,
      html,
      text,
      attachments: validated.attachments,
      tracking: {
        opens: true,
        clicks: true,
      },
    })

    return NextResponse.json({ success: true, message: 'Email queued for sending' })
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

    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}


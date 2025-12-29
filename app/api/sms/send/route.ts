import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { getExotelClient } from '@/lib/marketing/exotel'
import { getTwilioClient } from '@/lib/marketing/twilio'

const sendSMSSchema = z.object({
  to: z.string().min(10),
  message: z.string().min(1).max(1600), // SMS character limit
  templateId: z.string().optional(),
  templateVariables: z.record(z.string()).optional(),
  provider: z.enum(['twilio', 'exotel']).default('exotel'),
  campaignId: z.string().optional(),
  contactId: z.string().optional(),
})

// POST /api/sms/send - Send SMS
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const body = await request.json()
    const validated = sendSMSSchema.parse(body)

    // Check if phone number is opted out
    const normalizedPhone = validated.to.replace(/\D/g, '')
    const optOut = await prisma.sMSOptOut.findUnique({
      where: {
        tenantId_phoneNumber: {
          tenantId,
          phoneNumber: normalizedPhone,
        },
      },
    })

    if (optOut?.isSuppressed) {
      return NextResponse.json(
        { error: 'Phone number is opted out' },
        { status: 400 }
      )
    }

    // Get template if provided
    let message = validated.message
    if (validated.templateId) {
      const template = await prisma.sMSTemplate.findUnique({
        where: {
          id: validated.templateId,
          tenantId,
        },
      })

      if (!template) {
        return NextResponse.json(
          { error: 'SMS template not found' },
          { status: 404 }
        )
      }

      // Replace template variables
      message = template.content
      if (validated.templateVariables) {
        Object.entries(validated.templateVariables).forEach(([key, value]) => {
          message = message.replace(new RegExp(`{{${key}}}`, 'g'), value)
        })
      }
    }

    // Send SMS via provider
    let messageId: string | null = null
    let providerStatus: string | null = null
    let error: string | null = null

    try {
      if (validated.provider === 'twilio') {
        const twilio = getTwilioClient()
        const result = await twilio.sendSMS(validated.to, message)
        messageId = result.messageId || null
        providerStatus = result.status || null
      } else {
        // Exotel
        const exotel = getExotelClient()
        const result = await exotel.sendSMS(validated.to, message)
        messageId = result.messageId || null
        providerStatus = result.status || null
      }
    } catch (err: any) {
      error = err.message || 'Failed to send SMS'
      providerStatus = 'failed'
    }

    // Create delivery report (use fallback messageId if provider didn't return one)
    const reportMessageId = messageId || `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const report = await prisma.sMSDeliveryReport.create({
      data: {
        tenantId,
        phoneNumber: normalizedPhone,
        message,
        messageId: reportMessageId,
        status: providerStatus === 'sent' || providerStatus === 'queued' ? 'SENT' : providerStatus === 'delivered' ? 'DELIVERED' : 'FAILED',
        provider: validated.provider,
        providerStatus,
        providerError: error,
        sentAt: providerStatus === 'sent' || providerStatus === 'queued' ? new Date() : null,
        campaignId: validated.campaignId || undefined,
        contactId: validated.contactId || undefined,
      },
    })

    if (error) {
      return NextResponse.json(
        { error, report },
        { status: 500 }
      )
    }

    return NextResponse.json({ report, success: true }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Send SMS error:', error)
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    )
  }
}


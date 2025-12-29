import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * SMS Delivery Report Webhook Handler
 * Supports Twilio and Exotel webhooks
 * 
 * POST /api/sms/delivery-reports/webhook
 */

// Twilio webhook handler
async function handleTwilioWebhook(body: any, tenantId: string | null) {
  const {
    MessageSid,
    MessageStatus,
    To,
    From,
    ErrorCode,
    ErrorMessage,
  } = body

  if (!MessageSid || !To) {
    return null
  }

  // Map Twilio status to our status
  let status = 'PENDING'
  if (MessageStatus === 'delivered') status = 'DELIVERED'
  else if (MessageStatus === 'failed' || MessageStatus === 'undelivered') status = 'FAILED'
  else if (MessageStatus === 'sent') status = 'SENT'

  // Find or create delivery report
  // Note: If report doesn't exist, we'll need to create it with the messageId
  const report = await prisma.sMSDeliveryReport.upsert({
    where: {
      tenantId_messageId: {
        tenantId: tenantId || 'unknown',
        messageId: MessageSid,
      },
    },
    update: {
      status,
      providerStatus: MessageStatus,
      providerError: ErrorMessage || undefined,
      sentAt: status === 'SENT' || status === 'DELIVERED' ? new Date() : undefined,
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
      failedAt: status === 'FAILED' ? new Date() : undefined,
    },
    create: {
      tenantId: tenantId || 'unknown',
      phoneNumber: To,
      message: '', // Message content not in webhook
      messageId: MessageSid,
      status,
      provider: 'twilio',
      providerStatus: MessageStatus,
      providerError: ErrorMessage || undefined,
      sentAt: status === 'SENT' || status === 'DELIVERED' ? new Date() : undefined,
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
      failedAt: status === 'FAILED' ? new Date() : undefined,
    },
  })

  return report
}

// Exotel webhook handler
async function handleExotelWebhook(body: any, tenantId: string | null) {
  const {
    CallSid,
    Status,
    To,
    From,
    ErrorCode,
    ErrorMessage,
  } = body

  // Exotel uses CallSid for SMS too
  if (!CallSid || !To) {
    return null
  }

  let status = 'PENDING'
  if (Status === 'completed') status = 'DELIVERED'
  else if (Status === 'failed') status = 'FAILED'
  else if (Status === 'queued' || Status === 'ringing') status = 'SENT'

  const report = await prisma.sMSDeliveryReport.upsert({
    where: {
      tenantId_messageId: {
        tenantId: tenantId || 'unknown',
        messageId: CallSid,
      },
    },
    update: {
      status,
      providerStatus: Status,
      providerError: ErrorMessage || undefined,
      sentAt: status === 'SENT' || status === 'DELIVERED' ? new Date() : undefined,
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
      failedAt: status === 'FAILED' ? new Date() : undefined,
    },
    create: {
      tenantId: tenantId || 'unknown',
      phoneNumber: To,
      message: '',
      messageId: CallSid,
      status,
      provider: 'exotel',
      providerStatus: Status,
      providerError: ErrorMessage || undefined,
      sentAt: status === 'SENT' || status === 'DELIVERED' ? new Date() : undefined,
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
      failedAt: status === 'FAILED' ? new Date() : undefined,
    },
  })

  return report
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const provider = request.nextUrl.searchParams.get('provider') || 'twilio'
    const tenantId = request.nextUrl.searchParams.get('tenantId') || null

    let report = null

    if (provider === 'twilio') {
      report = await handleTwilioWebhook(body, tenantId)
    } else if (provider === 'exotel') {
      report = await handleExotelWebhook(body, tenantId)
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('SMS delivery report webhook error:', error)
    // Always return 200 to prevent provider from retrying
    return NextResponse.json({ success: false, error: 'Processing failed' }, { status: 200 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'SMS delivery report webhook endpoint' })
}


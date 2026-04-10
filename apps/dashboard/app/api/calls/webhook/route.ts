import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { captureIntegrationError, enforceIntegrationRateLimit } from '@/lib/integrations/security'
import twilio from 'twilio'
import { decrypt } from '@/lib/encryption'

function normalizeHeaderValue(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function toRecord(values: FormData) {
  const record: Record<string, string> = {}
  for (const [key, value] of values.entries()) {
    if (typeof value === 'string') record[key] = value
  }
  return record
}

// POST /api/calls/webhook - Twilio webhook for call events
export async function POST(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:calls:webhook',
    limit: 180,
    windowMs: 60_000,
  })
  if (limited) return limited

  let tenantIdForError: string | null = null

  try {
    const formData = await request.formData()
    const callSid = normalizeHeaderValue(formData.get('CallSid')) || ''
    const callStatus = normalizeHeaderValue(formData.get('CallStatus')) || ''
    const from = normalizeHeaderValue(formData.get('From')) || ''
    const to = normalizeHeaderValue(formData.get('To')) || ''
    const direction = normalizeHeaderValue(formData.get('Direction')) || ''
    const accountSid = normalizeHeaderValue(formData.get('AccountSid')) || ''
    const twilioSignature = request.headers.get('x-twilio-signature')

    const telephonySettings = accountSid
      ? await (prisma as any).tenantTelephonySettings.findFirst({
          where: { accountSid, provider: 'twilio' },
          select: { tenantId: true, authTokenEnc: true },
        })
      : null

    let signatureValid: boolean | null = null
    if (telephonySettings?.authTokenEnc && twilioSignature) {
      try {
        const authToken = decrypt(telephonySettings.authTokenEnc)
        signatureValid = twilio.validateRequest(authToken, twilioSignature, request.url, toRecord(formData))
      } catch {
        signatureValid = false
      }
    }

    // Find or create call record
    let call = await prisma.aICall.findUnique({
      where: { twilioCallSid: callSid },
    })

    if (!call) {
      // Extract tenant ID from phone number or other method
      // For now, we'll need to determine tenant from phone number mapping
      // This is a simplified version - in production, map phone numbers to tenants
      const tenantId = telephonySettings?.tenantId || 'default' // fallback for legacy data
      tenantIdForError = tenantId

      call = await prisma.aICall.create({
        data: {
          phoneNumber: direction === 'inbound' ? from : to,
          direction: direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
          status: mapTwilioStatus(callStatus),
          twilioCallSid: callSid,
          twilioAccountSid: accountSid,
          handledByAI: true,
          tenantId,
        },
      })
    } else {
      tenantIdForError = call.tenantId
      // Update call status
      await prisma.aICall.update({
        where: { id: call.id },
        data: {
          status: mapTwilioStatus(callStatus),
          answeredAt: callStatus === 'in-progress' ? new Date() : call.answeredAt,
          endedAt: callStatus === 'completed' ? new Date() : call.endedAt,
        },
      })
    }

    // Update telephony webhook verification status for this tenant/provider.
    const tenantIdForWebhook = call?.tenantId || telephonySettings?.tenantId

    if (tenantIdForWebhook) {
      await (prisma as any).tenantTelephonySettings
        .updateMany({
          where: { tenantId: tenantIdForWebhook, provider: 'twilio' },
          data: {
            lastWebhookAt: new Date(),
            lastWebhookProvider: 'twilio',
            lastWebhookCallSid: callSid || null,
            lastWebhookSignatureValid: signatureValid,
          },
        })
        .catch(() => undefined)
    }

    if (signatureValid === false) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 })
    }

    // Handle call based on status
    if (callStatus === 'ringing' || callStatus === 'in-progress') {
      // Return TwiML for AI handling
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, this is an AI assistant. How can I help you today?</Say>
  <Gather input="speech" action="/api/calls/process-speech" method="POST" speechTimeout="auto">
    <Say>Please speak your question or request.</Say>
  </Gather>
</Response>`,
        {
          headers: {
            'Content-Type': 'text/xml',
          },
        }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    await captureIntegrationError({
      scope: 'calls_webhook_ingest',
      tenantId: tenantIdForError,
      error,
      context: {
        path: '/api/calls/webhook',
      },
    })
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

function mapTwilioStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'ringing': 'RINGING',
    'in-progress': 'ANSWERED',
    'completed': 'COMPLETED',
    'busy': 'BUSY',
    'no-answer': 'NO_ANSWER',
    'failed': 'FAILED',
    'canceled': 'FAILED',
  }
  return statusMap[status.toLowerCase()] || 'RINGING'
}

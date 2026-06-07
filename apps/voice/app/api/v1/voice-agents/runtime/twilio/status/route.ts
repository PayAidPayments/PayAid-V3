/**
 * POST /api/v1/voice-agents/runtime/twilio/status
 * Twilio outbound call status callback — updates VoiceAgentCall + campaign contact.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { applyTwilioCallStatusUpdate } from '@/lib/voice-agent/campaign-call-completion'
import { verifyTwilioSignature } from '@/lib/twilio-utils'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid')?.toString()
    const callStatus = formData.get('CallStatus')?.toString()
    const callDuration = formData.get('CallDuration')?.toString()

    if (!callSid || !callStatus) {
      return new NextResponse('OK', { status: 200 })
    }

    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
    if (authToken && process.env.NODE_ENV === 'production') {
      const signature = request.headers.get('x-twilio-signature') || ''
      const params = new URLSearchParams()
      const sortedKeys = [...formData.keys()].sort()
      for (const key of sortedKeys) {
        const value = formData.get(key)
        if (value != null) params.append(key, String(value))
      }
      const valid = verifyTwilioSignature(request.url, params, signature, authToken)
      if (!valid) {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }

    const result = await applyTwilioCallStatusUpdate(prisma, {
      callSid,
      callStatus,
      callDuration,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[twilio/status] POST', error)
    return new NextResponse('Error', { status: 500 })
  }
}

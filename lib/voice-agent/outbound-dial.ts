/**
 * Outbound PSTN dial — Twilio when configured, stub queue otherwise (Phase 2 dialer foundation).
 */

import { randomBytes } from 'node:crypto'
import { normalizePhone } from '@/lib/voice-agent/browser-live/transcript-routing'

export type OutboundDialMode = 'stub' | 'twilio'

export type PlaceOutboundCallInput = {
  tenantId: string
  agentId: string
  toPhone: string
  fromPhone?: string | null
  campaignContactId?: string
}

export type PlaceOutboundCallResult = {
  dialMode: OutboundDialMode
  callSid: string
  to: string
  from: string | null
  status: 'queued' | 'ringing'
}

function toE164(phone: string): string {
  const digits = normalizePhone(phone)
  if (!digits) return phone
  if (phone.trim().startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  if (digits.length > 10) return `+${digits}`
  return phone
}

function stubCallSid(): string {
  return `CA_STUB_${randomBytes(12).toString('hex')}`
}

function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.VOICE_OUTBOUND_TWIML_URL?.trim(),
  )
}

export function resolveOutboundDialMode(): OutboundDialMode {
  return twilioConfigured() ? 'twilio' : 'stub'
}

export async function placeOutboundVoiceCall(
  input: PlaceOutboundCallInput,
): Promise<PlaceOutboundCallResult> {
  const to = toE164(input.toPhone)
  const from = input.fromPhone ? toE164(input.fromPhone) : null

  if (!twilioConfigured()) {
    return {
      dialMode: 'stub',
      callSid: stubCallSid(),
      to,
      from,
      status: 'queued',
    }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN!.trim()
  const twimlUrl = process.env.VOICE_OUTBOUND_TWIML_URL!.trim()
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  const body = new URLSearchParams({
    To: to,
    Url: twimlUrl,
  })
  if (from) body.set('From', from)
  const base = process.env.PAYAID_BRIDGE_BASE_URL || process.env.VOICE_BASE_URL || ''
  if (base) {
    body.set('StatusCallbackEvent', 'initiated ringing answered completed')
    body.set(
      'StatusCallback',
      `${base.replace(/\/$/, '')}/api/v1/voice-agents/runtime/twilio/status`,
    )
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  })

  const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string }
  if (!res.ok || !data.sid) {
    throw new Error(data.message || `Twilio outbound dial failed (${res.status})`)
  }

  return {
    dialMode: 'twilio',
    callSid: data.sid,
    to,
    from,
    status: 'ringing',
  }
}

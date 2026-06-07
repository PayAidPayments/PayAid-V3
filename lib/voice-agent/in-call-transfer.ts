/**
 * In-call PSTN/Twilio transfer — conference bridge to supervisor during active session/call.
 */

import { randomBytes } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { normalizePhone } from '@/lib/voice-agent/browser-live/transcript-routing'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'
import { buildEscalationHandoffPayload } from '@/lib/voice-agent/escalation-handoff'
import { extractObjectionTags } from '@/lib/voice-agent/browser-live/post-call-intelligence'

export type InCallTransferMode = 'stub' | 'twilio'

export type InCallTransferResult = {
  mode: InCallTransferMode
  conferenceName: string
  supervisorCallSid?: string
  customerRedirected?: boolean
  supervisorPhone: string
}

function toE164(phone: string): string {
  const digits = normalizePhone(phone)
  if (!digits) return phone
  if (phone.trim().startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  return `+${digits}`
}

function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim(),
  )
}

function resolveSupervisorPhone(override?: string | null): string | null {
  const raw = (override || process.env.VOICE_SUPERVISOR_PHONE || '').trim()
  if (!raw) return null
  return toE164(raw)
}

function conferenceTwimlUrl(conferenceName: string): string | null {
  const base = (process.env.PAYAID_BRIDGE_BASE_URL || process.env.VOICE_BASE_URL || '').replace(
    /\/$/,
    '',
  )
  if (!base) return null
  const params = new URLSearchParams({ conference: conferenceName, role: 'supervisor' })
  return `${base}/api/v1/voice-agents/twilio/transfer-conference?${params.toString()}`
}

function readMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

export function userRequestsEscalation(userText: string): boolean {
  const tags = extractObjectionTags([{ role: 'user', content: userText, timestamp: '' }])
  return tags.includes('escalation_request')
}

export async function initiateInCallTransfer(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    sessionId?: string
    callId?: string
    callSid?: string | null
    callerPhone?: string | null
    supervisorPhone?: string
    summary?: string
    fromPhone?: string | null
  },
): Promise<InCallTransferResult | null> {
  const supervisorPhone = resolveSupervisorPhone(input.supervisorPhone)
  if (!supervisorPhone) return null

  const conferenceName = `payaid_${input.sessionId || input.callSid || randomBytes(6).toString('hex')}`
  const handoff = buildEscalationHandoffPayload({
    tenantId: input.tenantId,
    agentId: input.agentId,
    sessionId: input.sessionId,
    callId: input.callId,
    callerPhone: input.callerPhone,
    summary: input.summary,
    objectionTags: ['escalation_request'],
  })

  if (input.sessionId) {
    const session = await prisma.voiceDemoSession.findFirst({
      where: { id: input.sessionId, tenantId: input.tenantId },
      select: { metadataJson: true },
    })
    if (session) {
      const prior = readMeta(session.metadataJson)
      await prisma.voiceDemoSession.update({
        where: { id: input.sessionId },
        data: {
          metadataJson: {
            ...prior,
            inCallTransfer: {
              conferenceName,
              supervisorPhone,
              requestedAt: new Date().toISOString(),
              handoff,
            },
          },
        },
      })
    }
  }

  if (!twilioConfigured()) {
    await emitVoiceEvent('escalation.transfer.requested', {
      tenantId: input.tenantId,
      agentId: input.agentId,
      sessionId: input.sessionId,
      callId: input.callId,
      meta: { mode: 'stub', conferenceName, supervisorPhone },
    })
    return { mode: 'stub', conferenceName, supervisorPhone }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN!.trim()
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const from = input.fromPhone ? toE164(input.fromPhone) : null
  const twimlUrl = conferenceTwimlUrl(conferenceName)
  if (!twimlUrl || !from) {
    await emitVoiceEvent('escalation.transfer.requested', {
      tenantId: input.tenantId,
      agentId: input.agentId,
      sessionId: input.sessionId,
      callId: input.callId,
      meta: { mode: 'stub', reason: 'missing_twiml_or_from', conferenceName, supervisorPhone },
    })
    return { mode: 'stub', conferenceName, supervisorPhone }
  }

  let customerRedirected = false
  if (input.callSid) {
    const redirectUrl = `${twimlUrl}&role=customer`
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${input.callSid}.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ Url: redirectUrl, Method: 'POST' }).toString(),
        signal: AbortSignal.timeout(15_000),
      },
    )
    customerRedirected = res.ok
  }

  const supervisorBody = new URLSearchParams({
    To: supervisorPhone,
    From: from,
    Url: twimlUrl,
  })
  const supervisorRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: supervisorBody.toString(),
      signal: AbortSignal.timeout(15_000),
    },
  )
  const supervisorData = (await supervisorRes.json().catch(() => ({}))) as { sid?: string }
  if (!supervisorRes.ok || !supervisorData.sid) {
    throw new Error('Twilio supervisor dial failed for in-call transfer')
  }

  await emitVoiceEvent('escalation.transfer.requested', {
    tenantId: input.tenantId,
    agentId: input.agentId,
    sessionId: input.sessionId,
    callId: input.callId,
    meta: {
      mode: 'twilio',
      conferenceName,
      supervisorPhone,
      supervisorCallSid: supervisorData.sid,
      customerRedirected,
    },
  })

  return {
    mode: 'twilio',
    conferenceName,
    supervisorPhone,
    supervisorCallSid: supervisorData.sid,
    customerRedirected,
  }
}

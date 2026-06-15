/**
 * Durable voice events for telephony paths (Twilio / Bolna / campaign dialer).
 */
import type { PrismaClient } from '@prisma/client'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'
import type { VoiceEventName, VoiceEventPayload } from '@/lib/voice-agent/events/voice-event-taxonomy'
import {
  recordTelephonyRuntimeComplianceCloseout,
  recordTelephonyRuntimeComplianceStart,
} from '@/lib/voice-agent/runtime-compliance'
import { syncVoiceCallToCrm } from '@/lib/voice-agent/crm-sync'

type TelephonyEventPayload = Omit<VoiceEventPayload, 'at'>

export async function emitTelephonyVoiceEvent(
  prisma: PrismaClient,
  event: VoiceEventName,
  payload: TelephonyEventPayload,
): Promise<void> {
  await emitVoiceEvent(event, payload, { prisma })
}

export async function onTelephonyCallStarted(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    callId: string
    callSid?: string
    inbound?: boolean
    channel?: 'telephony' | 'campaign'
    phone?: string | null
    campaignId?: string
  },
): Promise<void> {
  const channel = input.channel ?? 'telephony'
  await recordTelephonyRuntimeComplianceStart(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    callId: input.callId,
    channel,
    inbound: input.inbound,
    phone: input.phone,
    campaignId: input.campaignId,
  })
  await emitTelephonyVoiceEvent(prisma, 'call.started', {
    tenantId: input.tenantId,
    agentId: input.agentId,
    callId: input.callId,
    meta: {
      channel,
      inbound: input.inbound !== false,
      callSid: input.callSid,
      campaignId: input.campaignId,
    },
  })
}

function countTranscriptTurns(transcript: string | null | undefined): number {
  if (!transcript?.trim()) return 0
  try {
    const parsed = JSON.parse(transcript) as unknown
    if (Array.isArray(parsed)) return parsed.length
  } catch {
    // inline transcript
  }
  return transcript.includes('\n') ? transcript.split('\n').filter(Boolean).length : 1
}

export async function onTelephonyCallCompleted(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId: string
    callId: string
    callSid?: string
    channel?: 'telephony' | 'campaign'
    status?: string
    transcript?: string | null
    recordingUrl?: string | null
    syncCrm?: boolean
  },
): Promise<void> {
  const channel = input.channel ?? 'telephony'
  const transcriptTurnCount = countTranscriptTurns(input.transcript)

  await recordTelephonyRuntimeComplianceCloseout(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    callId: input.callId,
    channel,
    hasRecording: Boolean(input.recordingUrl?.trim()),
    transcriptTurnCount,
  })

  await emitTelephonyVoiceEvent(prisma, 'call.completed', {
    tenantId: input.tenantId,
    agentId: input.agentId,
    callId: input.callId,
    meta: {
      channel,
      callSid: input.callSid,
      status: input.status ?? 'completed',
      transcriptTurnCount,
    },
  })

  if (input.syncCrm !== false && input.callSid) {
    try {
      await syncVoiceCallToCrm(input.callSid)
    } catch (error) {
      console.warn('[telephony-voice-events] CRM sync failed', error)
    }
  }
}

export async function emitTelephonyTranscriptPartial(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId?: string
    callId: string
    text: string
    final?: boolean
    role?: string
  },
): Promise<void> {
  const text = input.text.trim()
  if (!text) return
  await emitTelephonyVoiceEvent(prisma, 'transcript.partial', {
    tenantId: input.tenantId,
    agentId: input.agentId,
    callId: input.callId,
    meta: {
      textPreview: text.slice(0, 500),
      final: input.final === true,
      role: input.role,
      channel: 'telephony',
    },
  })
}

/**
 * Missed inbound call → callback queue (blueprint §Trigger sources).
 */

import type { PrismaClient } from '@prisma/client'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'
import { enqueueVoiceCampaignContact } from '@/lib/voice-agent/triggers/campaign-queue'

const MISSED_CALL_CAMPAIGN = 'Missed call callbacks'

export type MissedCallTriggerInput = {
  tenantId: string
  agentId: string
  phone: string
  name?: string | null
  missedCallSid?: string | null
  from?: string | null
  to?: string | null
  metadata?: Record<string, unknown>
}

export async function enqueueMissedCallCallback(prisma: PrismaClient, input: MissedCallTriggerInput) {
  const queued = await enqueueVoiceCampaignContact(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    phone: input.phone,
    name: input.name,
    campaignName: MISSED_CALL_CAMPAIGN,
    campaignType: 'lead_nurturing',
    script: 'Missed-call callback — apologize for missed connection and resume conversation.',
    triggerSource: 'missed_call',
    contactMetadata: {
      triggerKind: 'missed_call',
      missedCallSid: input.missedCallSid || undefined,
      from: input.from || undefined,
      to: input.to || undefined,
      ...(input.metadata || {}),
    },
  })

  await emitVoiceEvent('missed_call.callback', {
    tenantId: input.tenantId,
    agentId: input.agentId,
    callId: input.missedCallSid || undefined,
    meta: {
      ...queued,
      from: input.from,
      to: input.to,
    },
  })

  return queued
}

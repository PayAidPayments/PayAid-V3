/**
 * Live escalation transfer — queues supervisor callback via campaign dialer (Phase 2.4).
 */

import type { PrismaClient } from '@prisma/client'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'
import type { EscalationHandoffPayload } from '@/lib/voice-agent/escalation-handoff'
import { enqueueVoiceCampaignContact } from '@/lib/voice-agent/triggers/campaign-queue'
import { pickupNextCampaignContact } from '@/lib/voice-agent/campaign-dialer'

const ESCALATION_CAMPAIGN_NAME = 'Escalation callbacks'

function readMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

export type EscalationTransferResult = {
  sessionId: string
  campaignId: string
  campaignContactId: string
  phone: string
  dial?: Awaited<ReturnType<typeof pickupNextCampaignContact>>
}

export async function requestEscalationTransfer(
  prisma: PrismaClient,
  input: {
    tenantId: string
    sessionId: string
    requestedByUserId?: string
    autoDial?: boolean
  },
): Promise<EscalationTransferResult | null> {
  const session = await prisma.voiceDemoSession.findFirst({
    where: { id: input.sessionId, tenantId: input.tenantId },
    select: {
      id: true,
      voiceAgentId: true,
      metadataJson: true,
    },
  })
  if (!session) return null

  const meta = readMeta(session.metadataJson)
  const postCall = meta.postCall as { escalationHandoff?: EscalationHandoffPayload } | undefined
  const handoff = postCall?.escalationHandoff
  if (!handoff?.callerPhone) return null

  const queued = await enqueueVoiceCampaignContact(prisma, {
    tenantId: input.tenantId,
    agentId: session.voiceAgentId,
    phone: handoff.callerPhone,
    name: null,
    campaignName: ESCALATION_CAMPAIGN_NAME,
    campaignType: 'lead_nurturing',
    script: 'Supervisor callback — human handoff requested during voice session.',
    triggerSource: 'escalation_callback',
    contactMetadata: {
      triggerKind: 'escalation_transfer',
      sessionId: session.id,
      summary: handoff.summary,
      sentiment: handoff.sentiment,
      objectionTags: handoff.objectionTags,
      requestedByUserId: input.requestedByUserId,
    },
  })

  await prisma.voiceDemoSession.update({
    where: { id: session.id },
    data: {
      metadataJson: {
        ...meta,
        transferRequested: true,
        transferRequestedAt: new Date().toISOString(),
        transferRequestedByUserId: input.requestedByUserId,
        transferCampaignContactId: queued.campaignContactId,
      },
    },
  })

  await emitVoiceEvent('escalation.transfer.requested', {
    tenantId: input.tenantId,
    agentId: session.voiceAgentId,
    sessionId: session.id,
    meta: {
      campaignId: queued.campaignId,
      campaignContactId: queued.campaignContactId,
      phone: queued.phone,
    },
  })

  let campaign = await prisma.voiceAgentCampaign.findUnique({
    where: { id: queued.campaignId },
    select: { status: true },
  })
  if (campaign && campaign.status === 'draft') {
    await prisma.voiceAgentCampaign.update({
      where: { id: queued.campaignId },
      data: { status: 'running', startedAt: new Date() },
    })
  }

  const shouldDial =
    input.autoDial === true || process.env.VOICE_AUTO_DIAL_ESCALATIONS === '1'
  let dial: Awaited<ReturnType<typeof pickupNextCampaignContact>> | undefined
  if (shouldDial) {
    dial = await pickupNextCampaignContact(prisma, {
      tenantId: input.tenantId,
      campaignId: queued.campaignId,
    })
  }

  return {
    sessionId: session.id,
    campaignId: queued.campaignId,
    campaignContactId: queued.campaignContactId,
    phone: queued.phone,
    dial,
  }
}

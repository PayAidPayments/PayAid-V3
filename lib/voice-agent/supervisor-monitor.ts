/**
 * Supervisor monitor feed — events, escalations, trigger queue (Phase 2.4).
 */

import type { PrismaClient } from '@prisma/client'
import type { PersistedVoiceEventRecord } from '@/lib/voice-agent/events/persist-voice-event'
import type { EscalationHandoffPayload } from '@/lib/voice-agent/escalation-handoff'
import { aggregateDemoSessionAnalytics } from '@/lib/voice-agent/demo-session-analytics'

export type SupervisorEscalationRow = {
  sessionId: string
  agentId: string
  agentName?: string
  endedAt?: string
  acknowledged: boolean
  transferRequested: boolean
  handoff: EscalationHandoffPayload
}

export type SupervisorTriggerRow = {
  campaignContactId: string
  campaignId: string
  campaignName: string
  agentId: string
  phone: string
  name?: string | null
  triggerKind?: string
  triggeredAt?: string
}

export type SupervisorMonitorFeed = {
  recentEvents: PersistedVoiceEventRecord[]
  escalations: SupervisorEscalationRow[]
  pendingTriggers: SupervisorTriggerRow[]
  analytics: Awaited<ReturnType<typeof aggregateDemoSessionAnalytics>>
}

function readMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

export async function loadSupervisorMonitorFeed(
  prisma: PrismaClient,
  input: { tenantId: string; agentId?: string; eventLimit?: number },
): Promise<SupervisorMonitorFeed> {
  const sessions = await prisma.voiceDemoSession.findMany({
    where: {
      tenantId: input.tenantId,
      ...(input.agentId ? { voiceAgentId: input.agentId } : {}),
    },
    select: {
      id: true,
      voiceAgentId: true,
      endedAt: true,
      metadataJson: true,
      agent: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const recentEvents: PersistedVoiceEventRecord[] = []
  const escalations: SupervisorEscalationRow[] = []

  for (const session of sessions) {
    const meta = readMeta(session.metadataJson)
    const events = Array.isArray(meta.voiceEvents)
      ? (meta.voiceEvents as PersistedVoiceEventRecord[])
      : []
    recentEvents.push(...events)

    const postCall = meta.postCall as { escalationHandoff?: EscalationHandoffPayload } | undefined
    if (postCall?.escalationHandoff) {
      escalations.push({
        sessionId: session.id,
        agentId: session.voiceAgentId,
        agentName: session.agent?.name,
        endedAt: session.endedAt?.toISOString(),
        acknowledged: meta.escalationAcknowledged === true,
        transferRequested: meta.transferRequested === true,
        handoff: postCall.escalationHandoff,
      })
    }
  }

  recentEvents.sort((a, b) => (a.at < b.at ? 1 : -1))
  const trimmedEvents = recentEvents.slice(0, input.eventLimit ?? 50)

  const pendingContacts = await prisma.voiceAgentCampaignContact.findMany({
    where: {
      status: 'pending',
      campaign: {
        tenantId: input.tenantId,
        ...(input.agentId ? { agentId: input.agentId } : {}),
      },
    },
    include: {
      campaign: { select: { id: true, name: true, agentId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const pendingTriggers: SupervisorTriggerRow[] = pendingContacts.map((c) => {
    const m = readMeta(c.metadata)
    return {
      campaignContactId: c.id,
      campaignId: c.campaign.id,
      campaignName: c.campaign.name,
      agentId: c.campaign.agentId,
      phone: c.phone,
      name: c.name,
      triggerKind: typeof m.triggerKind === 'string' ? m.triggerKind : undefined,
      triggeredAt: typeof m.triggeredAt === 'string' ? m.triggeredAt : undefined,
    }
  })

  const analytics = await aggregateDemoSessionAnalytics(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    limit: 100,
  })

  return {
    recentEvents: trimmedEvents,
    escalations: escalations.filter((e) => !e.acknowledged),
    pendingTriggers,
    analytics,
  }
}

export async function acknowledgeEscalation(
  prisma: PrismaClient,
  input: { tenantId: string; sessionId: string; acknowledgedByUserId?: string },
): Promise<boolean> {
  const session = await prisma.voiceDemoSession.findFirst({
    where: { id: input.sessionId, tenantId: input.tenantId },
    select: { metadataJson: true },
  })
  if (!session) return false

  const prior = readMeta(session.metadataJson)
  await prisma.voiceDemoSession.update({
    where: { id: input.sessionId },
    data: {
      metadataJson: {
        ...prior,
        escalationAcknowledged: true,
        escalationAcknowledgedAt: new Date().toISOString(),
        escalationAcknowledgedByUserId: input.acknowledgedByUserId,
      },
    },
  })
  return true
}

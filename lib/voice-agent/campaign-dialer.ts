/**
 * Sequential campaign dialer — picks pending contacts on running campaigns (Phase 2.3 pickup).
 */

import type { PrismaClient } from '@prisma/client'
import { checkDndStatus, normalizePhoneForDnd } from '@/lib/dnd'
import { placeOutboundVoiceCall } from '@/lib/voice-agent/outbound-dial'
import { isWithinBusinessHours, parseBusinessHours } from '@/lib/voice-agent/campaign-schema'

export type CampaignPickupResult =
  | {
      status: 'dialed'
      campaignId: string
      campaignContactId: string
      callId: string
      callSid: string
      phone: string
      dialMode: 'stub' | 'twilio'
    }
  | { status: 'pace_limited'; campaignId: string }
  | { status: 'no_pending'; campaignId: string }
  | { status: 'campaign_not_running'; campaignId: string }
  | { status: 'dnd_skipped'; campaignId: string; campaignContactId: string }
  | { status: 'agent_unavailable'; campaignId: string; reason: string }
  | { status: 'outside_business_hours'; campaignId: string }

async function maybeCompleteCampaign(
  prisma: PrismaClient,
  campaignId: string,
): Promise<void> {
  const remaining = await prisma.voiceAgentCampaignContact.count({
    where: {
      campaignId,
      status: { in: ['pending', 'calling'] },
    },
  })
  if (remaining === 0) {
    await prisma.voiceAgentCampaign.update({
      where: { id: campaignId },
      data: { status: 'completed', completedAt: new Date() },
    })
  }
}

export async function pickupNextCampaignContact(
  prisma: PrismaClient,
  input: { tenantId: string; campaignId: string },
): Promise<CampaignPickupResult> {
  const campaign = await prisma.voiceAgentCampaign.findFirst({
    where: { id: input.campaignId, tenantId: input.tenantId },
    include: { agent: true },
  })
  if (!campaign) {
    return { status: 'campaign_not_running', campaignId: input.campaignId }
  }
  if (campaign.status !== 'running') {
    return { status: 'campaign_not_running', campaignId: campaign.id }
  }
  if (!campaign.agent || campaign.agent.status !== 'active') {
    return {
      status: 'agent_unavailable',
      campaignId: campaign.id,
      reason: 'agent_inactive',
    }
  }
  if (!campaign.agent.outboundEnabled) {
    return {
      status: 'agent_unavailable',
      campaignId: campaign.id,
      reason: 'outbound_disabled',
    }
  }

  const businessHours = parseBusinessHours(campaign.businessHoursJson)
  if (!isWithinBusinessHours(businessHours)) {
    return { status: 'outside_business_hours', campaignId: campaign.id }
  }

  const oneMinuteAgo = new Date(Date.now() - 60_000)
  const recentAttempts = await prisma.voiceAgentCampaignContact.count({
    where: {
      campaignId: campaign.id,
      attemptedAt: { gte: oneMinuteAgo },
    },
  })
  if (recentAttempts >= campaign.paceCallsPerMin) {
    return { status: 'pace_limited', campaignId: campaign.id }
  }

  const contact = await prisma.voiceAgentCampaignContact.findFirst({
    where: { campaignId: campaign.id, status: 'pending' },
    orderBy: { createdAt: 'asc' },
  })
  if (!contact) {
    await maybeCompleteCampaign(prisma, campaign.id)
    return { status: 'no_pending', campaignId: campaign.id }
  }

  if (campaign.autoRemoveDnd) {
    const isDnd = await checkDndStatus(contact.phone)
    if (isDnd) {
      await prisma.voiceAgentCampaignContact.update({
        where: { id: contact.id },
        data: { status: 'dnd_skipped', completedAt: new Date() },
      })
      await maybeCompleteCampaign(prisma, campaign.id)
      return {
        status: 'dnd_skipped',
        campaignId: campaign.id,
        campaignContactId: contact.id,
      }
    }
  }

  const dial = await placeOutboundVoiceCall({
    tenantId: input.tenantId,
    agentId: campaign.agentId,
    toPhone: contact.phone,
    fromPhone: campaign.agent.phoneNumber,
    campaignContactId: contact.id,
  })

  const call = await prisma.voiceAgentCall.create({
    data: {
      tenantId: input.tenantId,
      agentId: campaign.agentId,
      callSid: dial.callSid,
      from: dial.from,
      to: dial.to,
      phone: normalizePhoneForDnd(contact.phone),
      inbound: false,
      customerName: contact.name,
      status: dial.status,
      startTime: new Date(),
      runtime: campaign.agent.voiceRuntime || 'native',
      dndChecked: campaign.autoRemoveDnd,
      dndStatus: campaign.autoRemoveDnd ? 'checked' : null,
    },
  })

  await prisma.voiceAgentCampaignContact.update({
    where: { id: contact.id },
    data: {
      status: 'calling',
      callId: call.id,
      attemptedAt: new Date(),
      metadata: {
        ...(typeof contact.metadata === 'object' && contact.metadata && !Array.isArray(contact.metadata)
          ? (contact.metadata as Record<string, unknown>)
          : {}),
        dialMode: dial.dialMode,
        dialedAt: new Date().toISOString(),
      },
    },
  })

  const { onTelephonyCallStarted } = await import('@/lib/voice-agent/events/telephony-voice-events')
  await onTelephonyCallStarted(prisma, {
    tenantId: input.tenantId,
    agentId: campaign.agentId,
    callId: call.id,
    callSid: dial.callSid,
    inbound: false,
    channel: 'campaign',
    phone: contact.phone,
    campaignId: campaign.id,
  })

  return {
    status: 'dialed',
    campaignId: campaign.id,
    campaignContactId: contact.id,
    callId: call.id,
    callSid: dial.callSid,
    phone: contact.phone,
    dialMode: dial.dialMode,
  }
}

export async function tickRunningCampaigns(
  prisma: PrismaClient,
  input: { tenantId: string; campaignId?: string; maxTicks?: number },
): Promise<CampaignPickupResult[]> {
  const maxTicks = input.maxTicks ?? 3
  const campaigns = input.campaignId
    ? await prisma.voiceAgentCampaign.findMany({
        where: { id: input.campaignId, tenantId: input.tenantId, status: 'running' },
        select: { id: true },
      })
    : await prisma.voiceAgentCampaign.findMany({
        where: { tenantId: input.tenantId, status: 'running' },
        select: { id: true },
        orderBy: { startedAt: 'asc' },
      })

  const results: CampaignPickupResult[] = []
  for (const c of campaigns) {
    if (results.length >= maxTicks) break
    const result = await pickupNextCampaignContact(prisma, {
      tenantId: input.tenantId,
      campaignId: c.id,
    })
    results.push(result)
    if (result.status !== 'dialed') continue
  }
  return results
}

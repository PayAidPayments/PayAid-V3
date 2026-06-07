/**
 * Marketing platform leads (Facebook / LinkedIn) → lead.triggered.call queue.
 */

import type { PrismaClient } from '@prisma/client'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'
import { enqueueVoiceCampaignContact } from '@/lib/voice-agent/triggers/campaign-queue'

export const MARKETING_LEAD_SOURCES = ['facebook_lead', 'linkedin_lead'] as const
export type MarketingLeadSource = (typeof MARKETING_LEAD_SOURCES)[number]

const CAMPAIGN_BY_SOURCE: Record<MarketingLeadSource, string> = {
  facebook_lead: 'Facebook lead ads',
  linkedin_lead: 'LinkedIn lead forms',
}

export type MarketingLeadTriggerInput = {
  tenantId: string
  agentId: string
  phone: string
  source: MarketingLeadSource
  name?: string | null
  email?: string | null
  platformLeadId?: string | null
  campaignName?: string | null
  metadata?: Record<string, unknown>
}

export async function enqueueMarketingLeadCall(prisma: PrismaClient, input: MarketingLeadTriggerInput) {
  const queued = await enqueueVoiceCampaignContact(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    phone: input.phone,
    name: input.name,
    campaignName: CAMPAIGN_BY_SOURCE[input.source],
    campaignType: 'lead_nurturing',
    script: `Outbound for ${input.source.replace('_', ' ')} — qualify and book next step.`,
    contactMetadata: {
      triggerKind: 'marketing_lead',
      source: input.source,
      email: input.email || undefined,
      platformLeadId: input.platformLeadId || undefined,
      adCampaignName: input.campaignName || undefined,
      ...(input.metadata || {}),
    },
  })

  await emitVoiceEvent('lead.triggered.call', {
    tenantId: input.tenantId,
    agentId: input.agentId,
    meta: {
      ...queued,
      source: input.source,
      platformLeadId: input.platformLeadId,
      triggerKind: 'marketing_lead',
    },
  })

  return { ...queued, source: input.source }
}

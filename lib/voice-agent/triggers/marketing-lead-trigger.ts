/**
 * Marketing platform leads (Facebook / LinkedIn) → lead.triggered.call queue.
 */

import type { PrismaClient } from '@prisma/client'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'
import { enqueueVoiceCampaignContact } from '@/lib/voice-agent/triggers/campaign-queue'
import { qualifiesAsMarketingHotLead } from '@/lib/voice-agent/bundles/post-call-bundles'

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
  hotLeadScore?: number | null
  metadata?: Record<string, unknown>
}

export async function enqueueMarketingLeadCall(prisma: PrismaClient, input: MarketingLeadTriggerInput) {
  if (!qualifiesAsMarketingHotLead(input.hotLeadScore)) {
    return {
      status: 'skipped' as const,
      reason: 'below_hot_lead_threshold',
      hotLeadScore: input.hotLeadScore ?? null,
    }
  }
  const queued = await enqueueVoiceCampaignContact(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    phone: input.phone,
    name: input.name,
    campaignName: CAMPAIGN_BY_SOURCE[input.source],
    campaignType: 'lead_nurturing',
    script: `Outbound for ${input.source.replace('_', ' ')} — qualify and book next step.`,
    triggerSource: 'marketing_lead',
    contactMetadata: {
      triggerKind: 'marketing_lead',
      source: input.source,
      email: input.email || undefined,
      platformLeadId: input.platformLeadId || undefined,
      adCampaignName: input.campaignName || undefined,
      hotLeadScore: input.hotLeadScore ?? undefined,
      hotLead: true,
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

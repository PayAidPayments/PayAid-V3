/**
 * Shared outbound voice trigger queue — campaign + contact row.
 */

import type { PrismaClient } from '@prisma/client'
import { normalizePhone } from '@/lib/voice-agent/browser-live/transcript-routing'
import type { VoiceCampaignTriggerSource } from '@/lib/voice-agent/campaign-schema'

export type CampaignQueueInput = {
  tenantId: string
  agentId: string
  phone: string
  name?: string | null
  campaignName: string
  campaignType: 'reminder' | 'lead_nurturing' | 'survey' | 'collections'
  script?: string
  triggerSource?: VoiceCampaignTriggerSource
  contactMetadata: Record<string, unknown>
}

export type CampaignQueueResult = {
  campaignId: string
  campaignContactId: string
  phone: string
  status: 'queued'
}

export async function enqueueVoiceCampaignContact(
  prisma: PrismaClient,
  input: CampaignQueueInput,
): Promise<CampaignQueueResult> {
  const phone = normalizePhone(input.phone)
  if (phone.length < 10) {
    throw new Error('Valid phone required (10+ digits)')
  }

  const agent = await prisma.voiceAgent.findFirst({
    where: { id: input.agentId, tenantId: input.tenantId, status: 'active' },
    select: { id: true },
  })
  if (!agent) throw new Error('Voice agent not found or inactive')

  const triggerSource = input.triggerSource ?? 'manual'

  let campaign = await prisma.voiceAgentCampaign.findFirst({
    where: {
      tenantId: input.tenantId,
      agentId: input.agentId,
      campaignType: input.campaignType,
      name: input.campaignName,
      triggerSource,
    },
  })

  if (!campaign) {
    campaign = await prisma.voiceAgentCampaign.create({
      data: {
        tenantId: input.tenantId,
        agentId: input.agentId,
        name: input.campaignName,
        campaignType: input.campaignType,
        status: 'draft',
        triggerSource,
        script: input.script || `Auto-triggered: ${input.campaignName}`,
      },
    })
  }

  const contact = await prisma.voiceAgentCampaignContact.create({
    data: {
      campaignId: campaign.id,
      phone,
      name: input.name?.trim() || null,
      status: 'pending',
      metadata: {
        triggeredAt: new Date().toISOString(),
        ...input.contactMetadata,
      },
    },
  })

  return {
    campaignId: campaign.id,
    campaignContactId: contact.id,
    phone,
    status: 'queued',
  }
}

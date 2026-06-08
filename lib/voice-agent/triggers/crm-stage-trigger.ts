/**
 * CRM stage change → outbound voice trigger (blueprint: new lead, renewal due, invoice overdue).
 */

import type { PrismaClient } from '@prisma/client'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'
import { enqueueVoiceCampaignContact } from '@/lib/voice-agent/triggers/campaign-queue'

export const CRM_STAGE_TRIGGERS = ['new_lead', 'renewal_due', 'invoice_overdue'] as const
export type CrmStageTrigger = (typeof CRM_STAGE_TRIGGERS)[number]

const CAMPAIGN_BY_STAGE: Record<
  CrmStageTrigger,
  { name: string; type: 'lead_nurturing' | 'reminder' | 'collections'; script: string }
> = {
  new_lead: {
    name: 'CRM: new lead',
    type: 'lead_nurturing',
    script: 'Welcome new lead — qualify interest and schedule next step.',
  },
  renewal_due: {
    name: 'CRM: renewal due',
    type: 'reminder',
    script: 'Renewal reminder — confirm renewal date and answer questions.',
  },
  invoice_overdue: {
    name: 'CRM: invoice overdue',
    type: 'collections',
    script: 'Invoice overdue follow-up — confirm payment plan or promise-to-pay.',
  },
}

export type CrmStageTriggerInput = {
  tenantId: string
  agentId: string
  phone: string
  stageTrigger: CrmStageTrigger
  name?: string | null
  contactId?: string | null
  dealId?: string | null
  invoiceId?: string | null
  metadata?: Record<string, unknown>
}

export async function enqueueCrmStageCall(prisma: PrismaClient, input: CrmStageTriggerInput) {
  const cfg = CAMPAIGN_BY_STAGE[input.stageTrigger]
  const queued = await enqueueVoiceCampaignContact(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    phone: input.phone,
    name: input.name,
    campaignName: cfg.name,
    campaignType: cfg.type,
    script: cfg.script,
    triggerSource: 'crm_stage',
    contactMetadata: {
      triggerKind: 'crm_stage',
      stageTrigger: input.stageTrigger,
      contactId: input.contactId || undefined,
      dealId: input.dealId || undefined,
      invoiceId: input.invoiceId || undefined,
      ...(input.metadata || {}),
    },
  })

  await emitVoiceEvent('crm.stage.triggered', {
    tenantId: input.tenantId,
    agentId: input.agentId,
    meta: {
      ...queued,
      stageTrigger: input.stageTrigger,
      contactId: input.contactId,
      dealId: input.dealId,
    },
  })

  return { ...queued, stageTrigger: input.stageTrigger }
}

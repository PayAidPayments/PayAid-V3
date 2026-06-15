/**

 * Website / form lead → outbound voice trigger (blueprint: lead.triggered.call).

 */



import type { PrismaClient } from '@prisma/client'

import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'

import { enqueueVoiceCampaignContact } from '@/lib/voice-agent/triggers/campaign-queue'



const WEBSITE_TRIGGER_CAMPAIGN_NAME = 'Website lead triggers'



export type WebsiteLeadTriggerInput = {

  tenantId: string

  agentId: string

  phone: string

  name?: string | null

  email?: string | null

  source?: string

  formId?: string

  metadata?: Record<string, unknown>

}



export type WebsiteLeadTriggerResult = {

  campaignId: string

  campaignContactId: string

  phone: string

  status: 'queued'

}



export async function enqueueWebsiteLeadCall(

  prisma: PrismaClient,

  input: WebsiteLeadTriggerInput,

): Promise<WebsiteLeadTriggerResult> {

  const queued = await enqueueVoiceCampaignContact(prisma, {

    tenantId: input.tenantId,

    agentId: input.agentId,

    phone: input.phone,

    name: input.name,

    campaignName: WEBSITE_TRIGGER_CAMPAIGN_NAME,

    campaignType: 'lead_nurturing',

    script: 'Callback for website lead — qualify interest and next step.',

    triggerSource: 'website_lead',

    contactMetadata: {

      triggerKind: 'website_form',

      source: input.source || 'website_form',

      email: input.email || undefined,

      formId: input.formId || undefined,

      ...(input.metadata || {}),

    },

  })



  await emitVoiceEvent('lead.triggered.call', {

    tenantId: input.tenantId,

    agentId: input.agentId,

    meta: {

      ...queued,

      name: input.name,

      source: input.source || 'website_form',

      formId: input.formId,

      triggerKind: 'website_form',

    },

  })



  return queued

}



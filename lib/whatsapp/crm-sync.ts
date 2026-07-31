/**
 * WhatsApp ↔ CRM sync.
 * - CRM contacts → broadcast list; send via lib/whatsapp/baileys or Meta Cloud API.
 * - Inbound webhook → resolve contact → append to activity feed; optional reply.
 *
 * P1-D4: inbound messages now flow through channelOutcomeToInbound so every
 * WhatsApp-initiated contact enters the unified capture → enrich → qualify pipeline.
 */

// P1-D4: channel backlink
import { channelOutcomeToInbound } from '@/lib/crm/channel-backlinks'

export interface CrmContactForBroadcast {
  id: string
  phone?: string | null
  tenantId: string
}

/**
 * Resolve CRM contacts by tenant (and optional segment) for WhatsApp broadcast.
 */
export async function getContactsForBroadcast(
  _tenantId: string,
  _options?: { segmentId?: string; limit?: number }
): Promise<CrmContactForBroadcast[]> {
  // TODO: inject prisma, filter by tenant + segment, return id, phone, tenantId
  return []
}

/**
 * After sending a broadcast, log to each contact's activity (type: whatsapp_broadcast).
 */
export async function logBroadcastToContacts(
  _tenantId: string,
  _contactIds: string[],
  _messagePreview: string
): Promise<void> {
  // TODO: prisma.activity.createMany or loop create
}

export type WhatsAppInboundPayload = {
  tenantId: string
  /** E.164 or local number of the sender */
  fromPhone: string
  /** Display name from WhatsApp profile, if available */
  profileName?: string | null
  /** Message ID from the provider */
  messageId?: string
  /** Campaign ID if this reply is from a broadcast */
  campaignId?: string
  /** Body text — used for metadata only; not stored as a contact field */
  body?: string
}

/**
 * P1-D4: Handle an inbound WhatsApp message.
 * Ensures the sender exists as a Contact in the unified pipeline.
 * Safe to call from webhook handlers — never throws.
 */
export async function handleWhatsAppInbound(
  payload: WhatsAppInboundPayload
): Promise<{ contactId: string | null; created: boolean }> {
  const result = await channelOutcomeToInbound({
    tenantId: payload.tenantId,
    channel: 'whatsapp_inbound',
    phone: payload.fromPhone,
    name: payload.profileName ?? undefined,
    channelRef: payload.messageId,
    campaignId: payload.campaignId,
    metadata: { body: payload.body?.slice(0, 300) },
    touchLastContactedAt: true,
    skipPilotArtifacts: false,
  })

  if (result.ok === false) {
    console.warn('[whatsapp/crm-sync] handleWhatsAppInbound backlink failed:', result.reason)
    return { contactId: null, created: false }
  }

  return { contactId: result.contactId, created: result.created }
}

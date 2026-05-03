/**
 * Phase 11: WhatsApp ↔ CRM sync.
 * - CRM contacts → broadcast list; send via lib/whatsapp/baileys or Meta Cloud API.
 * - Inbound webhook → resolve contact → append to activity feed; optional reply.
 */

export interface CrmContactForBroadcast {
  id: string
  phone?: string | null
  tenantId: string
}

/**
 * Resolve CRM contacts by tenant (and optional segment) for WhatsApp broadcast.
 * Implement with prisma.contact.findMany({ where: { tenantId, phone: { not: null } } }).
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

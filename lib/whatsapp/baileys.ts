/**
 * Phase 11: WhatsApp Business (Baileys) – CRM sync, broadcasts.
 * Optional: npm i @whiskeysockets/baileys. Use with Bull queue for outbound.
 *
 * - Session: store in Redis or Supabase (auth state).
 * - Inbound: webhook → parse message → CRM contact lookup → Bull job.
 * - Outbound: Bull job → send template/broadcast → log to CRM activity.
 */

export const WHATSAPP_BAILEYS_ENABLED = !!(
  process.env.WHATSAPP_BAILEYS_SESSION_PATH || process.env.WHATSAPP_BAILEYS_USE_REDIS
)

export interface WhatsAppOutboundPayload {
  to: string // E.164
  template?: string
  text?: string
  tenantId: string
  contactId?: string
}

/**
 * Queue outbound WhatsApp (implement with Bull + Baileys sendMessage).
 * Called from CRM broadcast or automation.
 */
export async function queueWhatsAppOutbound(payload: WhatsAppOutboundPayload): Promise<{ queued: boolean }> {
  if (!WHATSAPP_BAILEYS_ENABLED) return { queued: false }
  // TODO: add to Bull queue 'whatsapp-outbound', worker calls Baileys sendMessage
  return { queued: false }
}

/**
 * Sync inbound message to CRM contact activity (implement in webhook handler).
 */
export async function syncInboundToCrm(tenantId: string, phone: string, text: string, direction: 'in' | 'out'): Promise<void> {
  // TODO: find contact by phone, create Activity (type: whatsapp), link to contact
  void tenantId
  void phone
  void text
  void direction
}

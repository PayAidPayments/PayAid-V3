/** Preview stub — no bull import. */
export const whatsappOutboundQueue = {
  add: async () => null,
  process: () => undefined,
  close: async () => undefined,
  on: () => whatsappOutboundQueue,
}

export type WhatsAppOutboundJobData = {
  to: string
  template?: string
  text?: string
  tenantId: string
  contactId?: string
}

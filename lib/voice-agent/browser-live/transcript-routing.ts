/**
 * Transcript routing for browser-live spoken demo post-call CRM actions.
 */

export type TranscriptRouting =
  | 'matched_contact'
  | 'unmatched_lead'
  | 'no_crm_inbox'

export type TranscriptRoutingInput = {
  /** When false, always route to no_crm_inbox (demo without CRM writes). */
  crmWritebackEnabled: boolean
  callerPhone?: string | null
  matchedContactId?: string | null
}

export function decideTranscriptRouting(input: TranscriptRoutingInput): TranscriptRouting {
  if (!input.crmWritebackEnabled) return 'no_crm_inbox'

  const phone = normalizePhone(input.callerPhone)
  if (!phone || phone.length < 10) return 'no_crm_inbox'

  if (input.matchedContactId) return 'matched_contact'
  return 'unmatched_lead'
}

export function normalizePhone(phone?: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

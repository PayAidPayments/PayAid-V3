/** Default document types for checklist (v1). Kept outside route.ts — Next.js route modules may only export handlers. */

export const DOCUMENT_CHECKLIST_TYPES = [
  'OFFER_LETTER',
  'PAN_CARD',
  'AADHAAR',
  'FORM_16',
  'RELIEVING_LETTER',
  'EXPERIENCE_LETTER',
] as const

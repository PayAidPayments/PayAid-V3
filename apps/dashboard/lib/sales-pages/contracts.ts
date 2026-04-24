export type SalesPageType =
  | 'lead_capture'
  | 'offer'
  | 'appointment_booking'
  | 'proposal_acceptance'
  | 'payment_cta'
  | 'event_registration'
  | 'gated_download'

export type SalesPageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type SalesPageGoalType =
  | 'form_submit'
  | 'booking'
  | 'payment'
  | 'whatsapp'
  | 'call'
  | 'download'

export type SalesSubmissionStatus = 'received' | 'normalized' | 'crm_synced' | 'failed'

export const SALES_PAGE_EVENTS = {
  created: 'sales_page.created',
  updated: 'sales_page.updated',
  published: 'sales_page.published',
  unpublished: 'sales_page.unpublished',
  submissionReceived: 'sales_submission.received',
  submissionNormalized: 'sales_submission.normalized',
  submissionCrmSynced: 'sales_submission.crm_synced',
  submissionAssigned: 'sales_submission.assigned',
  submissionQualified: 'sales_submission.qualified',
  submissionVoiceTriggered: 'sales_submission.voice_triggered',
  submissionBookingCreated: 'sales_submission.booking_created',
  submissionPaymentIntentCreated: 'sales_submission.payment_intent_created',
} as const

export type SalesPageEventName = (typeof SALES_PAGE_EVENTS)[keyof typeof SALES_PAGE_EVENTS]

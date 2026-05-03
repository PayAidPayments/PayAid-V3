export type WebsiteSiteStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type WebsiteGoalType =
  | 'lead_generation'
  | 'appointment_booking'
  | 'local_presence'
  | 'campaign_microsite'
  | 'service_showcase'

export type WebsitePageType =
  | 'home'
  | 'about'
  | 'services'
  | 'contact'
  | 'faq'
  | 'testimonials'
  | 'pricing'
  | 'book_now'
  | 'custom'

export type WebsiteSubmissionStatus = 'received' | 'normalized' | 'crm_synced' | 'failed'

export const WEBSITE_BUILDER_EVENTS = {
  siteCreated: 'website.site.created',
  siteUpdated: 'website.site.updated',
  sitePublished: 'website.site.published',
  siteUnpublished: 'website.site.unpublished',
  formSubmitted: 'website.form.submitted',
  submissionNormalized: 'website.submission.normalized',
  submissionCrmSynced: 'website.submission.crm_synced',
  ctaClicked: 'website.cta.clicked',
  whatsappClicked: 'website.whatsapp.clicked',
  bookingRequested: 'website.booking.requested',
} as const

export type WebsiteBuilderEventName =
  (typeof WEBSITE_BUILDER_EVENTS)[keyof typeof WEBSITE_BUILDER_EVENTS]

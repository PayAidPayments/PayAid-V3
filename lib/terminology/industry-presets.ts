import type { CanonicalTerm, TerminologyMap } from '@/lib/terminology/terms'

export type IndustryKey =
  | 'restaurant'
  | 'retail'
  | 'manufacturing'
  | 'healthcare'
  | 'education'
  | 'real-estate'
  | 'freelancer'
  | 'service-business'
  | 'ecommerce'
  | 'professional-services'
  | 'logistics'
  | 'agriculture'
  | 'construction'
  | 'beauty'
  | 'automotive'
  | 'hospitality'
  | 'legal'
  | 'financial-services'
  | 'events'
  | 'wholesale'
  | 'other'

type IndustryTermMap = Record<IndustryKey, Partial<TerminologyMap>>

export const INDUSTRY_TERMS: IndustryTermMap = {
  restaurant: {
    lead: 'Inquiry',
    contact: 'Customer',
    deal: 'Order',
    pipeline: 'Reservation Pipeline',
  },
  retail: {
    deal: 'Sale',
    pipeline: 'Sales Pipeline',
  },
  manufacturing: {
    contact: 'Buyer',
    deal: 'Opportunity',
    pipeline: 'Sales Pipeline',
  },
  healthcare: {
    lead: 'Patient Inquiry',
    contact: 'Patient',
    deal: 'Care Plan',
    pipeline: 'Patient Journey',
    customer: 'Patient',
  },
  education: {
    lead: 'Admission Lead',
    contact: 'Student',
    deal: 'Enrollment',
    pipeline: 'Admissions Pipeline',
    customer: 'Student',
  },
  'real-estate': {
    lead: 'Property Lead',
    contact: 'Buyer',
    pipeline: 'Sales Pipeline',
  },
  freelancer: {
    lead: 'Inquiry',
    contact: 'Client',
    deal: 'Project',
    pipeline: 'Deals Pipeline',
    customer: 'Client',
  },
  'service-business': {
    contact: 'Client',
    deal: 'Job',
    customer: 'Client',
  },
  ecommerce: {
    deal: 'Order',
    pipeline: 'Orders Pipeline',
  },
  'professional-services': {
    contact: 'Client',
    deal: 'Engagement',
    customer: 'Client',
  },
  logistics: {
    deal: 'Shipment',
    pipeline: 'Operations Pipeline',
  },
  agriculture: {
    contact: 'Farmer',
    deal: 'Order',
    pipeline: 'Sales Pipeline',
    customer: 'Farmer',
  },
  construction: {
    contact: 'Client',
    deal: 'Project',
    pipeline: 'Project Pipeline',
    customer: 'Client',
  },
  beauty: {
    contact: 'Client',
    deal: 'Booking',
    pipeline: 'Appointments Pipeline',
    customer: 'Client',
  },
  automotive: {
    deal: 'Repair Job',
    pipeline: 'Service Pipeline',
  },
  hospitality: {
    lead: 'Inquiry',
    contact: 'Guest',
    deal: 'Booking',
    pipeline: 'Reservations Pipeline',
    customer: 'Guest',
  },
  legal: {
    lead: 'Inquiry',
    contact: 'Client',
    deal: 'Matter',
    pipeline: 'Cases Pipeline',
    customer: 'Client',
  },
  'financial-services': {
    contact: 'Client',
    deal: 'Case',
    pipeline: 'Review Pipeline',
    customer: 'Client',
  },
  events: {
    lead: 'Inquiry',
    contact: 'Client',
    deal: 'Event',
    pipeline: 'Events Pipeline',
    customer: 'Client',
  },
  wholesale: {
    contact: 'Buyer',
    deal: 'Order',
    pipeline: 'Orders Pipeline',
    customer: 'Buyer',
  },
  other: {},
}

const INDUSTRY_ALIASES: Record<string, IndustryKey> = {
  service_businesses: 'service-business',
  serviceBusinesses: 'service-business',
  real_estate: 'real-estate',
  professional_services: 'professional-services',
  beauty_wellness: 'beauty',
  wholesale_distribution: 'wholesale',
  event_management: 'events',
  financial: 'financial-services',
}

export function normalizeIndustryKey(industry?: string | null): IndustryKey | null {
  if (!industry) return null
  if (industry in INDUSTRY_TERMS) {
    return industry as IndustryKey
  }
  return INDUSTRY_ALIASES[industry] ?? null
}

export function getIndustryTermMap(industry?: string | null): Partial<Record<CanonicalTerm, string>> {
  const normalized = normalizeIndustryKey(industry)
  if (!normalized) return {}
  return INDUSTRY_TERMS[normalized] ?? {}
}

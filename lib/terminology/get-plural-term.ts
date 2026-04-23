import { getIndustryTermMap, normalizeIndustryKey, type IndustryKey } from '@/lib/terminology/industry-presets'
import {
  DEFAULT_PLURAL_TERMS,
  type CanonicalTerm,
  type TerminologyMap,
} from '@/lib/terminology/terms'

export type PluralTermContext = {
  industry?: string | null
  tenantPluralTerms?: Partial<TerminologyMap> | null
}

const INDUSTRY_PLURAL_OVERRIDES: Partial<Record<IndustryKey, Partial<TerminologyMap>>> = {
  healthcare: {
    lead: 'Patient Inquiries',
    contact: 'Patients',
    deal: 'Care Plans',
    customer: 'Patients',
  },
  education: {
    lead: 'Admission Leads',
    contact: 'Students',
    deal: 'Enrollments',
    customer: 'Students',
  },
  hospitality: {
    contact: 'Guests',
    deal: 'Bookings',
    customer: 'Guests',
  },
}

export function getPluralTerm(key: CanonicalTerm, ctx: PluralTermContext = {}): string {
  const industryMap = getIndustryTermMap(ctx.industry)
  const normalizedIndustry = normalizeIndustryKey(ctx.industry)
  const industryPlural = normalizedIndustry ? INDUSTRY_PLURAL_OVERRIDES[normalizedIndustry]?.[key] : undefined
  const fallbackPlural = DEFAULT_PLURAL_TERMS[key]
  return ctx.tenantPluralTerms?.[key] ?? industryPlural ?? (industryMap[key] ? `${industryMap[key]}s` : fallbackPlural)
}

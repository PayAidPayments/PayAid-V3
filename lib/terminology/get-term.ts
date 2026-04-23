import { getIndustryTermMap } from '@/lib/terminology/industry-presets'
import { DEFAULT_TERMS, type CanonicalTerm, type TerminologyMap } from '@/lib/terminology/terms'

export type TermContext = {
  industry?: string | null
  tenantTerms?: Partial<TerminologyMap> | null
}

export function getTerm(key: CanonicalTerm, ctx: TermContext = {}): string {
  const industryMap = getIndustryTermMap(ctx.industry)
  return ctx.tenantTerms?.[key] ?? industryMap[key] ?? DEFAULT_TERMS[key]
}

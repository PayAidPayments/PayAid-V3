'use client'

import { getPluralTerm } from '@/lib/terminology/get-plural-term'
import { getTerm } from '@/lib/terminology/get-term'
import { getTenantTermOverrides } from '@/lib/terminology/tenant-overrides'
import type { CanonicalTerm } from '@/lib/terminology/terms'
import { useAuthStore } from '@/lib/stores/auth'

export function useTerms() {
  const tenant = useAuthStore((state) => state.tenant)
  const tenantTerms = getTenantTermOverrides()
  const industry = tenant?.industry ?? null

  return {
    term: (key: CanonicalTerm) => getTerm(key, { industry, tenantTerms }),
    pluralTerm: (key: CanonicalTerm) => getPluralTerm(key, { industry }),
    industry,
  }
}

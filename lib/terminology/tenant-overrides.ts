import type { TerminologyMap } from '@/lib/terminology/terms'

/**
 * V1 behavior: tenant glossary overrides are disabled.
 * Keep this helper as the single extension point for future admin-configured labels.
 */
export function getTenantTermOverrides(): Partial<TerminologyMap> | null {
  return null
}

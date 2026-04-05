/**
 * Module catalog — single source of truth for signup + license IDs.
 * Aligns with `requireModuleAccess(..., '<id>')` and PAYAID_MODULES ids.
 *
 * Note: `invoicing` / `accounting` are normalized to `finance` in license middleware.
 */

/** Keep `apps/dashboard/middleware.ts` `config.matcher` in sync when this list changes. */
export const ALL_LICENSE_MODULE_IDS = [
  'crm',
  'sales',
  'marketing',
  'finance',
  'hr',
  'communication',
  'ai-studio',
  'analytics',
  'projects',
  'inventory',
] as const

export type LicenseModuleId = (typeof ALL_LICENSE_MODULE_IDS)[number]

export const ALL_LICENSE_MODULE_ID_SET = new Set<string>(ALL_LICENSE_MODULE_IDS)

/** Full suite granted when planType === 'suite' at signup. */
export const SUITE_MODULES: readonly string[] = [...ALL_LICENSE_MODULE_IDS]

/** Named bundles (optional presets in UI or admin). */
export const DEFAULT_BUNDLE_MODULES = {
  starter: ['crm', 'finance'],
  growth: ['crm', 'sales', 'marketing', 'finance'],
} as const

export type SignupPlanType = 'single' | 'multi' | 'suite'

export class SignupModuleResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignupModuleResolutionError'
  }
}

export function filterToCatalogModules(ids: string[]): string[] {
  return Array.from(
    new Set(ids.filter((id): id is string => typeof id === 'string' && ALL_LICENSE_MODULE_ID_SET.has(id)))
  )
}

/**
 * Turn signup selection into the `licensedModules` array stored on Tenant.
 */
export function resolveLicensedModules(
  planType: SignupPlanType,
  selectedModules: string[]
): string[] {
  if (planType === 'suite') {
    return [...SUITE_MODULES]
  }

  const picked = filterToCatalogModules(selectedModules)

  if (planType === 'single') {
    if (picked.length !== 1) {
      throw new SignupModuleResolutionError('Exactly one module is required for single-module signup.')
    }
    return picked
  }

  if (picked.length === 0) {
    throw new SignupModuleResolutionError('Select at least one module.')
  }

  return picked
}

export function inferPlanTypeFromSelection(selectedModules: string[]): SignupPlanType | null {
  const n = filterToCatalogModules(selectedModules).length
  if (n <= 0) return null
  return n === 1 ? 'single' : 'multi'
}

import { ALL_LICENSE_MODULE_ID_SET } from '@/lib/modules/catalog'

const ALWAYS_VISIBLE_MODULES = new Set<string>([
  'home',
  'dashboard',
  'marketplace',
  'app-store',
])

const MODULE_LICENSE_ALIASES: Record<string, string> = {
  // AI Studio sub-products
  'ai-cofounder': 'ai-studio',
  'ai-chat': 'ai-studio',
  'ai-insights': 'ai-studio',
  'website-builder': 'ai-studio',
  'logo-generator': 'ai-studio',
  'knowledge-rag': 'ai-studio',
  'voice-agents': 'ai-studio',
}

function normalizeModuleId(moduleId: string | null | undefined): string {
  return (moduleId ?? '').trim().toLowerCase()
}

function toLicensedModuleSet(licensedModules: readonly string[] | null | undefined): Set<string> {
  return new Set((licensedModules ?? []).map((id) => normalizeModuleId(id)).filter(Boolean))
}

function resolveRequiredLicense(moduleId: string): string {
  return MODULE_LICENSE_ALIASES[moduleId] ?? moduleId
}

/**
 * Returns true when a module should be shown in switchers for the current tenant.
 * Unknown/non-licensable module ids are treated as visible to avoid accidental UI lockouts.
 */
export function isModuleListedForTenantLicense(
  moduleId: string,
  tenantId?: string,
  licensedModules?: readonly string[]
): boolean {
  const normalizedModuleId = normalizeModuleId(moduleId)

  if (!normalizedModuleId) return false
  if (ALWAYS_VISIBLE_MODULES.has(normalizedModuleId)) return true

  // During bootstrap states (tenant/session not fully loaded), avoid hiding modules prematurely.
  if (!tenantId) return true

  const normalizedLicensedModules = toLicensedModuleSet(licensedModules)
  if (normalizedLicensedModules.size === 0) return true

  const requiredLicense = resolveRequiredLicense(normalizedModuleId)
  if (normalizedLicensedModules.has(requiredLicense)) return true

  // If module id is not part of the licensable catalog, treat it as visible.
  return !ALL_LICENSE_MODULE_ID_SET.has(requiredLicense)
}

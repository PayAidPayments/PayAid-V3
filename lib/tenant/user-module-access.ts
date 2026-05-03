import { ALL_LICENSE_MODULE_ID_SET, ALL_LICENSE_MODULE_IDS } from '@/lib/modules/catalog'
import { resolveLicenseModuleId } from '@/lib/tenant/module-license-filter'

export function normalizeLicensedModuleIds(licensedModules: readonly string[] | null | undefined): Set<string> {
  return new Set((licensedModules ?? []).filter((id) => ALL_LICENSE_MODULE_ID_SET.has(id)))
}

/**
 * Converts arbitrary surface-level module selections into canonical licensed module ids,
 * and filters out modules not licensed for the tenant.
 */
export function normalizeRequestedModuleAccess(
  requestedModules: Record<string, boolean>,
  tenantLicensedModules: readonly string[] | null | undefined
): Set<string> {
  const licensedSet = normalizeLicensedModuleIds(tenantLicensedModules)
  const granted = new Set<string>()

  for (const [moduleName, hasAccess] of Object.entries(requestedModules)) {
    if (!hasAccess) continue
    const canonical = resolveLicenseModuleId(moduleName)
    if (licensedSet.has(canonical)) {
      granted.add(canonical)
    }
  }

  return granted
}

/**
 * Returns a stable response map keyed by canonical license module ids only.
 */
export function buildCanonicalModuleAccessMap(
  tenantLicensedModules: readonly string[] | null | undefined,
  grantedCanonicalModules: ReadonlySet<string>,
  forceAllEnabled = false
): Record<string, boolean> {
  const licensedSet = normalizeLicensedModuleIds(tenantLicensedModules)
  const out: Record<string, boolean> = {}

  for (const moduleId of ALL_LICENSE_MODULE_IDS) {
    if (!licensedSet.has(moduleId)) continue
    out[moduleId] = forceAllEnabled || grantedCanonicalModules.has(moduleId)
  }

  return out
}

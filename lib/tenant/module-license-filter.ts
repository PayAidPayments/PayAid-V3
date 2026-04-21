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
const ALWAYS_VISIBLE_MODULES = new Set(['home', 'notifications', 'settings'])

const MODULE_ALIASES: Record<string, string[]> = {
  workflow: ['workflow-automation'],
  'workflow-automation': ['workflow'],
}

function normalizeModuleId(moduleId: string | null | undefined): string {
  return (moduleId ?? '').trim().toLowerCase()
}

function expandAliases(moduleId: string): string[] {
  const aliases = MODULE_ALIASES[moduleId] ?? []
  return [moduleId, ...aliases]
}

/**
 * Returns whether a module should be visible for the current tenant's license.
 * Fallback behavior is intentionally permissive to avoid hiding modules for
 * legacy tenants that do not yet have populated `licensedModules`.
 */
export function isModuleListedForTenantLicense(
  moduleId: string,
  tenantId?: string,
  licensedModules: string[] = []
): boolean {
  const normalizedModule = normalizeModuleId(moduleId)
  if (!normalizedModule) return false

  if (ALWAYS_VISIBLE_MODULES.has(normalizedModule)) return true

  // During pre-auth or partially-loaded tenant state, keep navigation visible.
  if (!tenantId) return true

  if (!Array.isArray(licensedModules) || licensedModules.length === 0) {
    return true
  }

  const normalizedLicensed = new Set(
    licensedModules.map((entry) => normalizeModuleId(entry)).filter(Boolean)
  )

  if (normalizedLicensed.has('all') || normalizedLicensed.has('suite')) {
    return true
  }

  return expandAliases(normalizedModule).some((candidate) =>
    normalizedLicensed.has(candidate)
  )
}

const moduleMigrationMap: Record<string, string[]> = {
  invoicing: ['finance'],
  accounting: ['finance'],
  whatsapp: ['marketing', 'communication'],
}

function normalizeId(value: string): string {
  return value.trim().toLowerCase()
}

function normalizedCandidates(moduleId: string): string[] {
  const normalized = normalizeId(moduleId)
  const mapped = moduleMigrationMap[normalized]
  if (!mapped || mapped.length === 0) return [normalized]
  return Array.from(new Set([normalized, ...mapped.map(normalizeId)]))
}

/**
 * Client-safe helper used by module switchers.
 * If a tenant has no explicit module list yet, keep modules visible.
 */
export function isModuleListedForTenantLicense(
  moduleId: string,
  tenantId?: string | null,
  licensedModules?: string[] | null
): boolean {
  if (!moduleId || !tenantId) return true
  if (!Array.isArray(licensedModules) || licensedModules.length === 0) return true

  const normalizedLicensed = new Set(licensedModules.map(normalizeId))
  const candidates = normalizedCandidates(moduleId)
  return candidates.some((candidate) => normalizedLicensed.has(candidate))
}
/**
 * Shared rule for which module ids appear in module switchers when a tenant is hydrated.
 *
 * - No `tenantId`: show all (pre-tenant / non-tenant shell).
 * - `tenantId` + empty `licensedModules`: only **`home`** (strict entitlements).
 * - `tenantId` + non-empty `licensedModules`: **`home`** plus any module whose `id` is listed.
 */
export function isModuleListedForTenantLicense(
  moduleId: string,
  tenantId: string | undefined,
  licensedModules: readonly string[]
): boolean {
  if (!tenantId) return true
  if (moduleId === 'home') return true
  if (!licensedModules.length) return false
  return licensedModules.includes(moduleId)
}

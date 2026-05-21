import { PAYAID_MODULES } from '@/lib/config/payaid-modules.config'

/**
 * Default landing path for a licensed module (e.g. after login redirect).
 * @param tenantRouteKey URL segment from {@link getTenantRouteKey} (slug preferred; else id).
 */
export function getModuleHomeHref(moduleId: string, tenantRouteKey: string): string | null {
  if (!tenantRouteKey) return null
  if (moduleId === 'home') {
    return `/home/${tenantRouteKey}`
  }
  const m = PAYAID_MODULES.find((x) => x.id === moduleId)
  if (!m) return null
  const seg = m.homeSegment === undefined ? 'Home' : m.homeSegment
  if (seg === '') {
    return `${m.basePath}/${tenantRouteKey}`.replace(/\/$/, '') || `/home/${tenantRouteKey}`
  }
  return `${m.basePath}/${tenantRouteKey}/${seg}/`
}

import { PAYAID_MODULES } from '@/lib/config/payaid-modules.config'

/**
 * Default landing path for a licensed module (e.g. after login redirect).
 */
export function getModuleHomeHref(moduleId: string, tenantId: string): string | null {
  if (!tenantId) return null
  if (moduleId === 'home') {
    return `/home/${tenantId}`
  }
  const m = PAYAID_MODULES.find((x) => x.id === moduleId)
  if (!m) return null
  const seg = m.homeSegment === undefined ? 'Home' : m.homeSegment
  if (seg === '') {
    return `${m.basePath}/${tenantId}`.replace(/\/$/, '') || `/home/${tenantId}`
  }
  return `${m.basePath}/${tenantId}/${seg}/`
}

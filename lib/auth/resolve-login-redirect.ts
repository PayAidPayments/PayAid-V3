import { PAYAID_MODULES } from '@/lib/config/payaid-modules.config'
import { getModuleHomeHref } from '@/lib/modules/module-entry'

/**
 * Turn `?redirect=/crm` or `?module=crm` (via basePath) into a concrete post-login URL with tenant id.
 */
export function resolveRedirectAfterLogin(
  raw: string | null | undefined,
  tenantId: string | null | undefined
): string {
  const tid = tenantId?.trim()
  if (!tid) return '/home'

  const s = (raw ?? '').trim()
  if (!s) return `/home/${tid}`

  if (s === '/home' || s === '/home/') return `/home/${tid}`

  // Path already includes this tenant (bookmark / deep link)
  if (s.startsWith('/') && tid && s.includes(`/${tid}/`)) {
    return s
  }

  const normalized = s.replace(/\/$/, '') || '/'
  const match = PAYAID_MODULES.find(
    (m) => normalized === m.basePath || normalized.startsWith(`${m.basePath}/`)
  )
  if (match) {
    if (match.id === 'home' || match.basePath === '/home') {
      return `/home/${tid}`
    }
    const href = getModuleHomeHref(match.id, tid)
    if (href) return href
  }

  return `/home/${tid}`
}

import {
  CANONICAL_APP_HOSTS,
  type CanonicalProductModule,
} from '@/lib/config/canonical-app-hosts'

function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, '')
}

const PROD_DEFAULT_ORIGINS: Partial<Record<CanonicalProductModule, string>> = {
  // Voice UI still ships from the dedicated Vercel project; without a default,
  // ModuleSwitcher emits a same-origin path and next.config redirects strip the session.
  voice: 'https://voice-six-xi.vercel.app',
}

export function getCanonicalAppOrigin(module: CanonicalProductModule): string | null {
  const envKey = CANONICAL_APP_HOSTS[module].envOriginKey
  const raw =
    typeof process !== 'undefined' && process.env?.[envKey]
      ? process.env[envKey]
      : typeof window !== 'undefined'
        ? (window as unknown as { __ENV__?: Record<string, string> }).__ENV__?.[envKey]
        : undefined

  if (raw && String(raw).trim()) return normalizeOrigin(String(raw).trim())

  const devDefault = CANONICAL_APP_HOSTS[module].devDefaultOrigin
  if (devDefault && process.env.NODE_ENV === 'development') {
    return devDefault
  }

  const prodDefault = PROD_DEFAULT_ORIGINS[module]
  if (prodDefault && process.env.NODE_ENV === 'production') {
    return prodDefault
  }
  return null
}

export function isCanonicalLoginPath(
  module: CanonicalProductModule,
  pathname: string
): boolean {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  return CANONICAL_APP_HOSTS[module].loginPaths.some(
    (loginPath) => path === loginPath || path.startsWith(`${loginPath}/`)
  )
}

export function shouldRedirectToCanonicalApp(
  module: CanonicalProductModule,
  pathname: string,
  requestOrigin: string
): boolean {
  const { pathPrefix } = CANONICAL_APP_HOSTS[module]
  if (!pathname.startsWith(pathPrefix)) return false
  if (isCanonicalLoginPath(module, pathname)) return false
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 2) return false

  const canonicalOrigin = getCanonicalAppOrigin(module)
  if (!canonicalOrigin) return false

  try {
    const target = new URL(canonicalOrigin)
    const current = new URL(requestOrigin)
    if (target.origin === current.origin) return false
  } catch {
    return false
  }

  return true
}

export function buildCanonicalModuleUrl(
  module: CanonicalProductModule,
  pathname: string,
  search = ''
): string {
  const origin = getCanonicalAppOrigin(module)
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (!origin) return `${path}${search}`
  
  const fullUrl = `${origin}${path}${search}`
  
  // For cross-host navigation (external origin), append SSO params client-side
  if (typeof window !== 'undefined') {
    try {
      const targetUrl = new URL(fullUrl)
      const currentOrigin = window.location.origin
      
      // If navigating to a different origin, mark URL to trigger SSO append client-side
      if (targetUrl.origin !== currentOrigin) {
        return fullUrl
      }
    } catch {
      // Invalid URL, return as is
    }
  }
  
  return fullUrl
}

export function buildCanonicalModuleUrlWithSSO(
  module: CanonicalProductModule,
  pathname: string,
  tenantRouteKey: string,
  search = ''
): string {
  const origin = getCanonicalAppOrigin(module)
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (!origin) return `${path}${search}`

  const fullUrl = `${origin}${path}${search}`

  // Cross-host navigation: append SSO so the target origin can hydrate auth.
  // JWT_SECRET must match across dashboard + voice Vercel projects.
  if (typeof window !== 'undefined') {
    try {
      const targetUrl = new URL(fullUrl)
      if (targetUrl.origin !== window.location.origin) {
        // Lazy require avoids circular imports in Edge/server bundles.
        const { useAuthStore } = require('@/lib/stores/auth') as typeof import('@/lib/stores/auth')
        const { token, user, tenant } = useAuthStore.getState()
        const tenantId = tenant?.id || tenantRouteKey
        const userId = user?.id
        if (token && tenantId && userId) {
          targetUrl.searchParams.set('sso_token', token)
          targetUrl.searchParams.set('tenant_id', tenantId)
          targetUrl.searchParams.set('user_id', userId)
          return targetUrl.toString()
        }
      }
    } catch {
      // Store unavailable (SSR) — caller/middleware may still attach SSO.
    }
  }

  return fullUrl
}

/** Build voice SSO redirect URL from a request cookie token (Edge middleware). */
export function appendVoiceSsoParams(
  targetOrigin: string,
  pathname: string,
  search: string,
  token: string,
  tenantId: string,
  userId: string
): string {
  const url = new URL(`${pathname}${search || ''}`, normalizeOrigin(targetOrigin))
  url.searchParams.set('sso_token', token)
  url.searchParams.set('tenant_id', tenantId)
  url.searchParams.set('user_id', userId)
  return url.toString()
}

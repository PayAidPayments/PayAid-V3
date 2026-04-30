/**
 * Phase 10: Edge proxy – tenant from path (no DB).
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DASHBOARD_PATH = '/dashboard'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  const tenantRouteKeyFromPath = segments[1] ?? ''

  // Canonical Sales Pages route enforcement (server-side).
  if (pathname.includes('/Landing-Pages')) {
    const canonicalPath = pathname.replace('/Landing-Pages', '/Sales-Pages')
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = canonicalPath
    return NextResponse.redirect(redirectUrl)
  }

  const token = getTokenFromRequest(request)
  const decodedToken = token ? safeDecodeToken(token) : null
  const tenantId = decodedToken?.tenantId || decodedToken?.tenant_id || ''
  const tenantSlug = decodedToken?.tenantSlug || decodedToken?.tenant_slug || ''
  const tenantRouteKey = tenantSlug || tenantId

  // Canonicalize old ID-based module URLs to slug-based URLs when available.
  if (
    tenantRouteKeyFromPath &&
    tenantId &&
    tenantSlug &&
    tenantRouteKeyFromPath === tenantId &&
    tenantSlug !== tenantId
  ) {
    const redirectUrl = request.nextUrl.clone()
    segments[1] = tenantSlug
    redirectUrl.pathname = `/${segments.join('/')}`
    return NextResponse.redirect(redirectUrl)
  }

  const tenantBillingPath = tenantRouteKey ? `/finance/${tenantRouteKey}/Billing` : '/dashboard/billing'
  const isSubscriptionPath =
    pathname === tenantBillingPath ||
    pathname === '/dashboard/billing' ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/finance') ||
    pathname.startsWith('/settings')

  // Keep expired-trial users on billing/checkout/settings until they upgrade.
  if (decodedToken?.billingStatus === 'payment_required' && !isSubscriptionPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = tenantBillingPath
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  if (!pathname.startsWith(DASHBOARD_PATH)) return NextResponse.next()

  const dashboardTenantRouteKey = pathname
    .slice(DASHBOARD_PATH.length)
    .split('/')
    .filter(Boolean)[0]
  if (dashboardTenantRouteKey) {
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', dashboardTenantRouteKey)
    return res
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/home/:path*',
    '/crm/:path*',
    '/hr/:path*',
    '/sales/:path*',
    '/finance/:path*',
    '/marketing/:path*',
    '/projects/:path*',
    '/inventory/:path*',
    '/analytics/:path*',
    '/workflow-automation/:path*',
    '/ai-studio/:path*',
    '/support/:path*',
    '/contracts/:path*',
    '/appointments/:path*',
    '/communication/:path*',
    '/productivity/:path*',
    '/settings/:path*',
  ],
}

function safeDecodeToken(token: string): Record<string, any> | null {
  try {
    const [, payloadPart] = token.split('.')
    if (!payloadPart) return null

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8')

    return JSON.parse(json)
  } catch {
    return null
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  const token = request.cookies.get('token')?.value
  if (token) {
    return token
  }

  return null
}

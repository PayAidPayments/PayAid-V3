/**
 * Phase 10: Edge proxy – tenant from path (no DB).
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DASHBOARD_PATH = '/dashboard'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = getTokenFromRequest(request)
  const decodedToken = token ? safeDecodeToken(token) : null
  const tenantId = decodedToken?.tenantId || decodedToken?.tenant_id || ''
  const tenantBillingPath = tenantId ? `/finance/${tenantId}/Billing` : '/dashboard/billing'
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

  const segments = pathname.slice(DASHBOARD_PATH.length).split('/').filter(Boolean)
  const tenantSlug = segments[0]
  if (tenantSlug) {
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', tenantSlug)
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

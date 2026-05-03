/**
 * Phase 10: Edge middleware – auth/tenant from path and cookies only (no DB).
 * Resolves tenant from URL /crm/[tenantSlug]/... and sets headers for downstream.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CRM_PATH = '/crm'
const LOGIN_PATH = '/crm/login'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith(CRM_PATH)) return NextResponse.next()

  if (pathname === CRM_PATH || pathname === CRM_PATH + '/') {
    return NextResponse.next()
  }

  // /crm/login → allow
  if (pathname.startsWith(LOGIN_PATH)) return NextResponse.next()

  // /crm/[tenantSlug]/... → extract tenant, set header for API/layout (no DB hit)
  const segments = pathname.slice(CRM_PATH.length).split('/').filter(Boolean)
  const tenantSlug = segments[0]
  if (tenantSlug && tenantSlug !== 'login') {
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', tenantSlug)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/crm/:path*'],
}

/**
 * Phase 10: Edge proxy – tenant from path (no DB).
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DASHBOARD_PATH = '/dashboard'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
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
  matcher: ['/dashboard/:path*'],
}

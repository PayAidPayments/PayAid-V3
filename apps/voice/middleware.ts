/**
 * Phase 10: Edge middleware – tenant from path (no DB).
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VOICE_PATH = '/voice-agents'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith(VOICE_PATH)) return NextResponse.next()

  const segments = pathname.slice(VOICE_PATH.length).split('/').filter(Boolean)
  const tenantSlug = segments[0]
  if (tenantSlug) {
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', tenantSlug)
    return res
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/voice-agents/:path*'],
}

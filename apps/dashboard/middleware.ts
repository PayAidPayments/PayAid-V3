/** Edge middleware: tenant from path (no DB). Named middleware.ts to avoid Next 16 proxy NFT rename bugs on Vercel. */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  CANONICAL_APP_HOSTS,
  type CanonicalProductModule,
} from '@/lib/config/canonical-app-hosts'
import {
  appendVoiceSsoParams,
  getCanonicalAppOrigin,
  shouldRedirectToCanonicalApp,
} from '@/lib/utils/canonical-module-url'

const DASHBOARD_PATH = '/dashboard'
const DEFAULT_VOICE_ORIGIN = 'https://voice-six-xi.vercel.app'

const CANONICAL_MODULE_REDIRECTS: CanonicalProductModule[] = [
  'crm',
  'finance',
  'marketing',
  'hr',
  'projects',
  'sales',
  'leads',
  'website-builder',
  'voice',
]

function resolveVoiceOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_VOICE_APP_URL?.trim() ||
    process.env.VOICE_MODULE_URL?.trim() ||
    process.env.VOICE_API_ORIGIN?.trim() ||
    getCanonicalAppOrigin('voice') ||
    DEFAULT_VOICE_ORIGIN
  ).replace(/\/$/, '')
}

/**
 * Always hop /voice-agents → voice host with SSO query params from the
 * dashboard `token` cookie so CRM→Voice does not force a second login.
 */
function redirectVoiceAgentsWithSso(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (pathname !== '/voice-agents' && !pathname.startsWith('/voice-agents/')) {
    return null
  }

  const voiceOrigin = resolveVoiceOrigin()
  try {
    if (new URL(voiceOrigin).origin === request.nextUrl.origin) {
      return null
    }
  } catch {
    /* continue with default hop */
  }

  // Already carrying SSO — preserve and forward.
  if (request.nextUrl.searchParams.has('sso_token')) {
    const redirectUrl = new URL(`${pathname}${request.nextUrl.search}`, voiceOrigin)
    return NextResponse.redirect(redirectUrl, 307)
  }

  const token = getTokenFromRequest(request)
  const decoded = token ? safeDecodeToken(token) : null
  const tenantId = String(decoded?.tenantId || decoded?.tenant_id || '')
  const userId = String(decoded?.userId || decoded?.user_id || decoded?.sub || '')

  if (token && tenantId && userId) {
    return NextResponse.redirect(
      appendVoiceSsoParams(voiceOrigin, pathname, request.nextUrl.search, token, tenantId, userId),
      307
    )
  }

  const fallback = new URL(`${pathname}${request.nextUrl.search}`, voiceOrigin)
  return NextResponse.redirect(fallback, 307)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const voiceSsoRedirect = redirectVoiceAgentsWithSso(request)
  if (voiceSsoRedirect) return voiceSsoRedirect

  for (const module of CANONICAL_MODULE_REDIRECTS) {
    if (module === 'voice') continue // handled above with SSO
    if (shouldRedirectToCanonicalApp(module, pathname, request.nextUrl.origin)) {
      const envKey = CANONICAL_APP_HOSTS[module].envOriginKey
      const redirectUrl = new URL(
        `${pathname}${request.nextUrl.search}`,
        process.env[envKey]!
      )
      return NextResponse.redirect(redirectUrl, 307)
    }
  }
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
  // Light dev: skip so module work is not blocked without billing APIs.
  if (
    process.env.PAYAID_DEV_LIGHT !== '1' &&
    decodedToken?.billingStatus === 'payment_required' &&
    !isSubscriptionPath
  ) {
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
    '/voice-agents',
    '/voice-agents/:path*',
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

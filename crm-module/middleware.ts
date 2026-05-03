import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

// OAuth2 configuration
const CORE_AUTH_URL = process.env.CORE_AUTH_URL || 'https://payaid.io'
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || ''

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  const tokenCookie = request.cookies.get('payaid_token')
  if (tokenCookie) {
    return tokenCookie.value
  }
  return null
}

function verifyRequestToken(request: NextRequest): any {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

function redirectToAuth(returnUrl: string): NextResponse {
  const authUrl = new URL(`${CORE_AUTH_URL}/api/oauth/authorize`)
  authUrl.searchParams.set('client_id', OAUTH_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', returnUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid profile email')
  return NextResponse.redirect(authUrl.toString())
}

/**
 * Next.js Middleware for CRM Module
 * 
 * Handles authentication for all routes in the CRM module.
 * Redirects to core OAuth2 provider if not authenticated.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip authentication for public routes
  const publicRoutes = [
    '/api/oauth/callback',
    '/login',
    '/_next',
    '/favicon.ico',
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for authentication token
  const payload = verifyRequestToken(request)

  if (!payload) {
    // No token found - redirect to core for authentication
    const returnUrl = request.url
    return redirectToAuth(returnUrl)
  }

  // Check if CRM module is licensed
  const licensedModules = payload.licensedModules || []
  if (!licensedModules.includes('crm')) {
    // Module not licensed - redirect to upgrade page or show error
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'CRM module not licensed for this tenant' },
        { status: 403 }
      )
    }
    
    // For frontend routes, redirect to upgrade page
    return NextResponse.redirect(new URL('/upgrade?module=crm', request.url))
  }

  // Token valid and module licensed - allow request
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
}


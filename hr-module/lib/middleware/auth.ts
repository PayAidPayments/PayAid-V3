/**
 * HR Module - Authentication Middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from '@/lib/auth/jwt'

// OAuth2 configuration
const CORE_AUTH_URL = process.env.CORE_AUTH_URL || 'https://payaid.io'
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || ''

/**
 * Middleware result type
 */
export interface AuthMiddlewareResult {
  authenticated: boolean
  payload: JWTPayload | null
  response: NextResponse | null
}

/**
 * Get token from request (cookie or Authorization header)
 */
function getTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Try cookie
  const tokenCookie = request.cookies.get('payaid_token')
  if (tokenCookie) {
    return tokenCookie.value
  }
  
  return null
}

/**
 * Verify token and return payload
 */
function verifyRequestToken(request: NextRequest): JWTPayload | null {
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

/**
 * Redirect user to core for authentication
 */
function redirectToAuth(returnUrl: string): NextResponse {
  const authUrl = new URL(`${CORE_AUTH_URL}/api/oauth/authorize`)
  authUrl.searchParams.set('client_id', OAUTH_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', returnUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid profile email')
  
  return NextResponse.redirect(authUrl.toString())
}

/**
 * Check if request is authenticated
 */
function checkAuthentication(
  request: NextRequest,
  options?: {
    redirectToLogin?: boolean
    returnUrl?: string
  }
): AuthMiddlewareResult {
  const payload = verifyRequestToken(request)

  if (!payload) {
    // Not authenticated
    if (options?.redirectToLogin) {
      const returnUrl = options.returnUrl || request.url
      const response = redirectToAuth(returnUrl)
      return {
        authenticated: false,
        payload: null,
        response,
      }
    }

    return {
      authenticated: false,
      payload: null,
      response: null,
    }
  }

  return {
    authenticated: true,
    payload,
    response: null,
  }
}

/**
 * Require authentication middleware
 * Automatically redirects to login if not authenticated
 */
function requireAuth(
  request: NextRequest,
  returnUrl?: string
): AuthMiddlewareResult {
  return checkAuthentication(request, {
    redirectToLogin: true,
    returnUrl: returnUrl || request.url,
  })
}

/**
 * Optional authentication middleware
 * Returns authentication status without redirecting
 */
function optionalAuth(request: NextRequest): AuthMiddlewareResult {
  return checkAuthentication(request, {
    redirectToLogin: false,
  })
}

/**
 * Require authentication for HR module routes
 * Redirects to core login if not authenticated
 */
export function requireHRAuth(
  request: NextRequest,
  returnUrl?: string
): AuthMiddlewareResult {
  return requireAuth(request, returnUrl)
}

/**
 * Optional authentication for HR module routes
 * Returns auth status without redirecting
 */
export function optionalHRAuth(request: NextRequest): AuthMiddlewareResult {
  return optionalAuth(request)
}

/**
 * Check if user has HR module access
 */
export function requireHRAccess(request: NextRequest): {
  authenticated: boolean
  payload: any
  response: NextResponse | null
} {
  const auth = requireHRAuth(request)
  
  if (!auth.authenticated) {
    return auth
  }

  // Check if HR module is licensed
  const licensedModules = auth.payload?.licensedModules || []
  if (!licensedModules.includes('hr')) {
    return {
      authenticated: false,
      payload: null,
      response: NextResponse.json(
        { error: 'HR module not licensed for this tenant' },
        { status: 403 }
      ),
    }
  }

  return auth
}

/**
 * HR Module - Authentication Middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, optionalAuth, AuthMiddlewareResult } from '@payaid/oauth-client'

export function requireHRAuth(
  request: NextRequest,
  returnUrl?: string
): AuthMiddlewareResult {
  return requireAuth(request, returnUrl)
}

export function optionalHRAuth(request: NextRequest): AuthMiddlewareResult {
  return optionalAuth(request)
}

export function requireHRAccess(request: NextRequest): {
  authenticated: boolean
  payload: any
  response: NextResponse | null
} {
  const auth = requireHRAuth(request)
  
  if (!auth.authenticated) {
    return auth
  }

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


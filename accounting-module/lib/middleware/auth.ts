/**
 * Accounting Module - Authentication Middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, optionalAuth, AuthMiddlewareResult } from '@payaid/oauth-client'

export function requireAccountingAuth(
  request: NextRequest,
  returnUrl?: string
): AuthMiddlewareResult {
  return requireAuth(request, returnUrl)
}

export function optionalAccountingAuth(request: NextRequest): AuthMiddlewareResult {
  return optionalAuth(request)
}

export function requireAccountingAccess(request: NextRequest): {
  authenticated: boolean
  payload: any
  response: NextResponse | null
} {
  const auth = requireAccountingAuth(request)
  
  if (!auth.authenticated) {
    return auth
  }

  const licensedModules = auth.payload?.licensedModules || []
  if (!licensedModules.includes('accounting') && !licensedModules.includes('finance')) {
    return {
      authenticated: false,
      payload: null,
      response: NextResponse.json(
        { error: 'Accounting module not licensed for this tenant' },
        { status: 403 }
      ),
    }
  }

  return auth
}


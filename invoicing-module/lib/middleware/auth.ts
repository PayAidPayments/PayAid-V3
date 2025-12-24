/**
 * Invoicing Module - Authentication Middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, optionalAuth, AuthMiddlewareResult } from '@payaid/oauth-client'

export function requireInvoicingAuth(
  request: NextRequest,
  returnUrl?: string
): AuthMiddlewareResult {
  return requireAuth(request, returnUrl)
}

export function optionalInvoicingAuth(request: NextRequest): AuthMiddlewareResult {
  return optionalAuth(request)
}

export function requireInvoicingAccess(request: NextRequest): {
  authenticated: boolean
  payload: any
  response: NextResponse | null
} {
  const auth = requireInvoicingAuth(request)
  
  if (!auth.authenticated) {
    return auth
  }

  const licensedModules = auth.payload?.licensedModules || []
  if (!licensedModules.includes('invoicing') && !licensedModules.includes('finance')) {
    return {
      authenticated: false,
      payload: null,
      response: NextResponse.json(
        { error: 'Invoicing module not licensed for this tenant' },
        { status: 403 }
      ),
    }
  }

  return auth
}


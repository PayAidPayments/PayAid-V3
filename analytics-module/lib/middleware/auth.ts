/**
 * Analytics Module - Authentication Middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, optionalAuth, AuthMiddlewareResult } from '@payaid/oauth-client'

export function requireAnalyticsAuth(
  request: NextRequest,
  returnUrl?: string
): AuthMiddlewareResult {
  return requireAuth(request, returnUrl)
}

export function optionalAnalyticsAuth(request: NextRequest): AuthMiddlewareResult {
  return optionalAuth(request)
}

export function requireAnalyticsAccess(request: NextRequest): {
  authenticated: boolean
  payload: any
  response: NextResponse | null
} {
  const auth = requireAnalyticsAuth(request)
  
  if (!auth.authenticated) {
    return auth
  }

  const licensedModules = auth.payload?.licensedModules || []
  if (!licensedModules.includes('analytics') && !licensedModules.includes('ai-studio')) {
    return {
      authenticated: false,
      payload: null,
      response: NextResponse.json(
        { error: 'Analytics module not licensed for this tenant' },
        { status: 403 }
      ),
    }
  }

  return auth
}


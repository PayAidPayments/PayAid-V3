import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, JWTPayload } from './auth'
import { validateAPIKey } from '@/lib/security/api-keys'

export interface AuthResult {
  authenticated: boolean
  tenantId: string
  userId?: string
  authType: 'jwt' | 'api_key'
  scopes?: string[]
  apiKeyId?: string
  response?: NextResponse
}

/**
 * Authenticate API request - supports both JWT and API key authentication
 */
export async function authenticateApiRequest(
  request: NextRequest
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return {
      authenticated: false,
      tenantId: '',
      authType: 'jwt',
      response: NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      ),
    }
  }

  // Try JWT authentication first
  if (authHeader.startsWith('Bearer ')) {
    const jwtUser = await authenticateRequest(request)
    
    if (jwtUser) {
      const tenantId = jwtUser.tenantId || jwtUser.tenant_id || ''
      return {
        authenticated: true,
        tenantId,
        userId: jwtUser.userId || jwtUser.sub,
        authType: 'jwt',
      }
    }

    // If JWT fails, try API key
    const clientIP = 
      request.headers.get('cf-connecting-ip') || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      'unknown'
    
    const apiKeyResult = await validateAPIKey(authHeader, clientIP)
    
    if (apiKeyResult.valid) {
      return {
        authenticated: true,
        tenantId: apiKeyResult.orgId,
        authType: 'api_key',
        scopes: apiKeyResult.scopes,
        apiKeyId: apiKeyResult.apiKeyId,
      }
    }
  }

  return {
    authenticated: false,
    tenantId: '',
    authType: 'jwt',
    response: NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    ),
  }
}

/**
 * Require specific scopes for API key authentication
 */
export function requireScope(requiredScopes: string[]) {
  return (authResult: AuthResult): boolean => {
    if (authResult.authType !== 'api_key') {
      return true // JWT auth doesn't need scope checks
    }
    
    if (!authResult.scopes || authResult.scopes.length === 0) {
      return false
    }
    
    return requiredScopes.every(scope => authResult.scopes!.includes(scope))
  }
}

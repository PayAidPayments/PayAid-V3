import { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from '../auth/jwt'
import { LicenseError } from './license'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export async function authenticateRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    return payload
  } catch (error) {
    return null
  }
}

export async function requireAuth(
  request: NextRequest
): Promise<JWTPayload> {
  const user = await authenticateRequest(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

// Re-export license middleware functions for backward compatibility
export { requireModuleAccess, handleLicenseError } from './license'

/**
 * AI gateway API routes: require a valid Bearer JWT (same auth as the app).
 * Throws {@link LicenseError} so {@link handleLicenseError} can return 401/403.
 */
export async function requireCanonicalAiGatewayAccess(
  request: NextRequest
): Promise<JWTPayload> {
  const user = await authenticateRequest(request)
  if (!user) {
    throw new LicenseError('ai', 'No authorization token provided')
  }
  return user
}


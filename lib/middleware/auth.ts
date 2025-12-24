import { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from '../auth/jwt'

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

export function requireAuth(
  request: NextRequest
): JWTPayload {
  const user = authenticateRequest(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user as JWTPayload
}

// Re-export license middleware functions for backward compatibility
export { requireModuleAccess, handleLicenseError } from './license'


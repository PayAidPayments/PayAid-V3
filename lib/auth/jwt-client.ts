/**
 * Client-side JWT utilities
 * Safe to use in client components - only decodes, doesn't verify
 */

export interface JWTPayload {
  userId: string
  tenantId: string
  email: string
  role: string
  licensedModules?: string[]
  subscriptionTier?: string
}

/**
 * Decode JWT token without verification (client-side only)
 * This is safe for reading token data but should NOT be used for authentication
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    
    // Base64 URL decode
    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    
    // Decode from base64
    const decoded = atob(padded)
    
    // Parse JSON
    return JSON.parse(decoded) as JWTPayload
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}


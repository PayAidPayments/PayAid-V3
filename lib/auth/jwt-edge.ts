/**
 * Edge Runtime Compatible JWT Functions
 * 
 * This module provides JWT verification that works in Edge Runtime (Next.js middleware).
 * Uses 'jose' library which is compatible with Edge Runtime, unlike 'jsonwebtoken'.
 */

// Lazy import jose to avoid Edge Runtime bundling issues
// We'll import it dynamically in the functions

const JWT_SECRET: string = (process.env.JWT_SECRET || 'change-me-in-production').trim()

export interface JWTPayload {
  userId: string
  tenantId: string
  email: string
  role: string
  // Module licensing
  licensedModules?: string[]
  subscriptionTier?: string
}

/**
 * Verify JWT token (Edge Runtime compatible)
 * Returns the payload if valid, throws error if invalid
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload> {
  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid or expired token')
    }

    if (!JWT_SECRET || JWT_SECRET === 'change-me-in-production') {
      throw new Error('JWT_SECRET is not configured')
    }

    // Lazy import jose to avoid Edge Runtime issues
    let jwtVerifyFn: (token: string, secret: Uint8Array, options: { algorithms: string[] }) => Promise<{ payload: any }>
    try {
      const joseModule = await import('jose')
      if (!joseModule || !joseModule.jwtVerify) {
        throw new Error('JWT verification library not available')
      }
      jwtVerifyFn = joseModule.jwtVerify
    } catch (importError) {
      // If import fails, throw a clear error
      const errorMsg = importError instanceof Error ? importError.message : 'Unknown import error'
      throw new Error(`JWT verification library not available: ${errorMsg}`)
    }

    // Convert secret to Uint8Array for jose
    const secret = new TextEncoder().encode(JWT_SECRET)
    
    // Verify and decode the token
    const { payload } = await jwtVerifyFn(token, secret, {
      algorithms: ['HS256'],
    })

    // Map the payload to our JWTPayload interface
    // The payload from jose includes all custom claims directly
    return {
      userId: (payload.userId || payload.sub || '') as string,
      tenantId: (payload.tenantId || '') as string,
      email: (payload.email || '') as string,
      role: (payload.role || 'user') as string,
      licensedModules: (payload.licensedModules || []) as string[],
      subscriptionTier: (payload.subscriptionTier || 'free') as string,
    }
  } catch (error) {
    // Always throw a consistent error message for invalid tokens
    // This allows the middleware to catch it and handle gracefully
    throw new Error('Invalid or expired token')
  }
}

/**
 * Decode JWT token without verification (Edge Runtime compatible)
 * Use with caution - does not verify signature
 */
export async function decodeTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null
    }

    // Lazy import jose
    let decodeJwtFn: typeof import('jose').decodeJwt
    try {
      const joseModule = await import('jose')
      decodeJwtFn = joseModule.decodeJwt
    } catch {
      return null
    }

    const payload = decodeJwtFn(token)
    
    return {
      userId: (payload.userId || payload.sub || '') as string,
      tenantId: (payload.tenantId || '') as string,
      email: (payload.email || '') as string,
      role: (payload.role || 'user') as string,
      licensedModules: (payload.licensedModules || []) as string[],
      subscriptionTier: (payload.subscriptionTier || 'free') as string,
    }
  } catch {
    return null
  }
}


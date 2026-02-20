import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from '@/lib/auth/jwt'

/**
 * License Error - thrown when module access is denied
 */
export class LicenseError extends Error {
  constructor(
    public moduleId: string,
    public message: string = `Module '${moduleId}' is not licensed`
  ) {
    super(message)
    this.name = 'LicenseError'
  }
}

/**
 * Module migration map (V1 → V2)
 * Maps old module IDs to new module IDs for backward compatibility
 */
const moduleMigrationMap: Record<string, string[]> = {
  'invoicing': ['finance'],
  'accounting': ['finance'],
  'whatsapp': ['marketing', 'communication'],
}

/**
 * Normalize module ID - maps old module IDs to new ones
 */
function normalizeModuleId(moduleId: string): string[] {
  return moduleMigrationMap[moduleId] || [moduleId]
}

/**
 * Check if user has access to a specific module
 * 
 * @param request - Next.js request object
 * @param moduleId - Module ID to check (e.g., 'crm', 'finance', 'marketing')
 * @returns Object with userId, tenantId, and licensedModules
 * @throws LicenseError if module is not licensed
 */
export async function checkModuleAccess(
  request: NextRequest,
  moduleId: string
): Promise<{
  userId: string
  tenantId: string
  licensedModules: string[]
  subscriptionTier: string
}> {
  // Get token from Authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new LicenseError(moduleId, 'No authorization token provided')
  }

  const token = authHeader.substring(7)
  
  try {
    // Verify and decode token
    const payload = verifyToken(token)
    
    if (!payload.tenantId) {
      throw new LicenseError(moduleId, 'Invalid token: missing tenantId')
    }

    // Get licensed modules from token
    const licensedModules = payload.licensedModules || []
    const subscriptionTier = payload.subscriptionTier || 'free'

    // Normalize module ID (handle backward compatibility)
    const normalizedModules = normalizeModuleId(moduleId)
    
    // Free tier with no licensed modules: allow access to all modules (no license enforcement)
    const isFreeTierNoModules = subscriptionTier === 'free' && licensedModules.length === 0
    
    // Check if any of the normalized modules are licensed (or allow if free tier with no modules)
    const hasAccess = isFreeTierNoModules || normalizedModules.some(normalizedId => 
      licensedModules.includes(normalizedId)
    )

    if (!hasAccess) {
      throw new LicenseError(
        moduleId,
        `Module '${moduleId}' is not licensed. Licensed modules: ${licensedModules.join(', ') || 'none'}`
      )
    }

    if (isFreeTierNoModules) {
      console.warn(`Free tier user accessing module ${moduleId} (no license list)`)
    }

    return {
      userId: payload.userId,
      tenantId: payload.tenantId,
      licensedModules,
      subscriptionTier,
    }
  } catch (error) {
    if (error instanceof LicenseError) {
      throw error
    }
    
    // If token verification failed, check if it's a JWT error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Invalid or expired token') || errorMessage.includes('jwt')) {
      // Return 401 Unauthorized for token errors (not 403)
      throw new LicenseError(moduleId, 'Invalid or expired token. Please log out and log back in.')
    }
    
    // Other errors
    throw new LicenseError(moduleId, 'Invalid or expired token')
  }
}

/**
 * Middleware wrapper for API routes that require module access
 * 
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const { tenantId } = await requireModuleAccess(request, 'crm')
 *   // ... rest of route logic
 * }
 * ```
 */
export async function requireModuleAccess(
  request: NextRequest,
  moduleId: string
): Promise<{
  userId: string
  tenantId: string
  licensedModules: string[]
  subscriptionTier: string
}> {
  try {
    return await checkModuleAccess(request, moduleId)
  } catch (error) {
    if (error instanceof LicenseError) {
      throw error
    }
    throw new LicenseError(moduleId, 'Failed to verify module access')
  }
}

/**
 * Helper to check if a module is licensed (non-throwing)
 * Returns true if licensed, false otherwise
 */
export async function hasModuleAccess(
  request: NextRequest,
  moduleId: string
): Promise<boolean> {
  try {
    await checkModuleAccess(request, moduleId)
    return true
  } catch {
    return false
  }
}

/**
 * Error handler for LicenseError
 * Returns appropriate HTTP response (401 for token errors, 403 for license errors)
 */
export function handleLicenseError(error: unknown): NextResponse {
  if (error instanceof LicenseError) {
    // Check if it's a token error (should return 401)
    const isTokenError = error.message.includes('Invalid or expired token') || 
                         error.message.includes('No authorization token')
    
    return NextResponse.json(
      {
        error: error.message,
        message: error.message,
        code: isTokenError ? 'INVALID_TOKEN' : 'MODULE_NOT_LICENSED',
        moduleId: error.moduleId,
      },
      { status: isTokenError ? 401 : 403 }
    )
  }

  // Unknown error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  )
}

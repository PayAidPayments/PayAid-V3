/**
 * Phase 2: Module Access Middleware
 * Protects routes based on module access and permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, type JWTPayload } from '@/lib/auth/jwt'
import { hasModuleAccess, getModule } from '@/lib/modules/moduleRegistry'
import { prisma } from '@/lib/db/prisma'

/**
 * Check if user has access to a module route
 */
export async function checkModuleRouteAccess(
  request: NextRequest,
  moduleId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Extract token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      // Try to get from cookie
      const cookies = request.cookies
      const token = cookies.get('token')?.value
      if (!token) {
        return { allowed: false, reason: 'No authentication token' }
      }
      
      // Verify token
      let decoded: JWTPayload
      try {
        decoded = verifyToken(token)
      } catch {
        return { allowed: false, reason: 'Invalid token' }
      }

      // Get tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: decoded.tenant_id || decoded.tenantId || '' },
        select: { licensedModules: true },
      })

      if (!tenant) {
        return { allowed: false, reason: 'Tenant not found' }
      }

      // Check module access
      const hasAccess = hasModuleAccess(
        moduleId,
        {
          roles: decoded.roles || [],
          permissions: decoded.permissions || [],
        },
        tenant
      )

      if (!hasAccess) {
        return { allowed: false, reason: 'Module not accessible' }
      }

      return { allowed: true }
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenant_id || decoded.tenantId || '' },
      select: { licensedModules: true },
    })

    if (!tenant) {
      return { allowed: false, reason: 'Tenant not found' }
    }

    // Check module access
    const hasAccess = hasModuleAccess(
      moduleId,
      {
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
      },
      tenant
    )

    if (!hasAccess) {
      return { allowed: false, reason: 'Module not accessible' }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Module access check error:', error)
    return { allowed: false, reason: 'Access check failed' }
  }
}

/**
 * Middleware factory for module route protection
 */
export function requireModuleAccess(moduleId: string) {
  return async (request: NextRequest) => {
    const { allowed, reason } = await checkModuleRouteAccess(request, moduleId)
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Access denied', reason },
        { status: 403 }
      )
    }

    return null // Continue to handler
  }
}

/**
 * Check if route is admin-only
 */
export function isAdminOnlyRoute(moduleId: string, path: string): boolean {
  const module = getModule(moduleId)
  if (!module) return false

  return module.admin_only_routes?.includes(path) || false
}

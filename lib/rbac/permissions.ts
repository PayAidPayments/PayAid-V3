import { prisma } from '../db/prisma'
import { verifyToken, type JWTPayload } from '../auth/jwt'
import type { Request } from 'next/server'

/**
 * Phase 1: RBAC Permission System
 * Based on PayAid V3 Architecture Document
 */

/**
 * Check permission from JWT token (Fast - for API calls)
 */
export function checkPermission(token: string, requiredPermission: string): boolean {
  try {
    const decoded = verifyToken(token)
    return decoded.permissions?.includes(requiredPermission) || false
  } catch {
    return false
  }
}

/**
 * Check if user has any of the required permissions
 */
export function checkAnyPermission(token: string, requiredPermissions: string[]): boolean {
  try {
    const decoded = verifyToken(token)
    const userPermissions = decoded.permissions || []
    return requiredPermissions.some(perm => userPermissions.includes(perm))
  } catch {
    return false
  }
}

/**
 * Check if user has all required permissions
 */
export function checkAllPermissions(token: string, requiredPermissions: string[]): boolean {
  try {
    const decoded = verifyToken(token)
    const userPermissions = decoded.permissions || []
    return requiredPermissions.every(perm => userPermissions.includes(perm))
  } catch {
    return false
  }
}

/**
 * Check permission from database (Accurate - for sensitive operations)
 * Fetches fresh permissions from database
 */
export async function checkPermissionDB(
  userId: string,
  tenantId: string,
  permissionCode: string
): Promise<boolean> {
  // Check direct user permission first
  const userPerm = await prisma.userPermission.findFirst({
    where: {
      userId,
      tenantId,
      permissionCode,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  })

  if (userPerm) {
    return true
  }

  // Check role permissions
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      tenantId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  })

  // Check if any role has the permission
  for (const userRole of userRoles) {
    const hasPermission = userRole.role.rolePermissions.some(
      rp => rp.permission.permissionCode === permissionCode
    )
    if (hasPermission) {
      return true
    }
  }

  return false
}

/**
 * Get all permissions for a user (from database)
 * With error handling for missing tables
 */
export async function getUserPermissions(
  userId: string,
  tenantId: string
): Promise<string[]> {
  try {
    const permissions = new Set<string>()

    // Get direct user permissions
    try {
      const userPerms = await prisma.userPermission.findMany({
        where: {
          userId,
          tenantId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          permission: true,
        },
      })

      userPerms.forEach(up => {
        permissions.add(up.permissionCode)
      })
    } catch (error: any) {
      // Table doesn't exist - skip
      if (error?.code === 'P2021' || error?.code === 'P2001' || error?.message?.includes('does not exist')) {
        console.warn('[RBAC] UserPermission table does not exist, skipping')
      } else {
        throw error
      }
    }

    // Get role permissions
    try {
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
          tenantId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      })

      userRoles.forEach(userRole => {
        userRole.role.rolePermissions.forEach(rp => {
          permissions.add(rp.permission.permissionCode)
        })
      })
    } catch (error: any) {
      // Table doesn't exist - skip
      if (error?.code === 'P2021' || error?.code === 'P2001' || error?.message?.includes('does not exist')) {
        console.warn('[RBAC] RolePermission table does not exist, skipping')
      } else {
        throw error
      }
    }

    return Array.from(permissions)
  } catch (error: any) {
    // Handle case where RBAC tables don't exist yet
    if (error?.code === 'P2021' || error?.code === 'P2001' || error?.message?.includes('does not exist')) {
      console.warn('[RBAC] RBAC tables do not exist, returning empty array')
      return []
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Get all roles for a user
 * With error handling for missing tables
 */
export async function getUserRoles(
  userId: string,
  tenantId: string
): Promise<string[]> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        tenantId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: true,
      },
    })

    return userRoles.map(ur => ur.role.roleName)
  } catch (error: any) {
    // Handle case where RBAC tables don't exist yet
    if (error?.code === 'P2021' || error?.code === 'P2001' || error?.message?.includes('does not exist')) {
      console.warn('[RBAC] UserRole table does not exist, returning empty array')
      return []
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Check if user has access to a module
 */
export async function checkModuleAccess(
  userId: string,
  tenantId: string,
  moduleName: string
): Promise<boolean> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      tenantId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: {
          moduleAccess: {
            where: {
              moduleName,
            },
          },
        },
      },
    },
  })

  return userRoles.some(ur => 
    ur.role.moduleAccess.some(ma => ma.canView || ma.canAdmin)
  )
}

/**
 * Middleware factory for API route protection
 * Usage: export const GET = requirePermission('crm:read')(handler)
 */
export function requirePermission(permission: string) {
  return async (request: Request) => {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7)
    if (!checkPermission(token, permission)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return null // Continue to handler
  }
}

/**
 * Check if user has role
 */
export function hasRole(token: string, roleName: string): boolean {
  try {
    const decoded = verifyToken(token)
    return decoded.roles?.includes(roleName) || false
  } catch {
    return false
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(token: string): boolean {
  return hasRole(token, 'admin') || hasRole(token, 'super_admin')
}

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
 */
export async function getUserPermissions(
  userId: string,
  tenantId: string
): Promise<string[]> {
  const permissions = new Set<string>()

  // Get direct user permissions
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

  // Get role permissions
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

  return Array.from(permissions)
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(
  userId: string,
  tenantId: string
): Promise<string[]> {
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

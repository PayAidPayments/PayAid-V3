import { prisma } from '../db/prisma'

/**
 * Phase 1: RBAC Role Management
 * Based on PayAid V3 Architecture Document
 */

export interface CreateRoleInput {
  tenantId: string
  roleName: string
  description?: string
  roleType?: 'admin' | 'manager' | 'user' | 'custom'
  permissions?: string[]
  isSystem?: boolean
}

export interface AssignRoleInput {
  tenantId: string
  userId: string
  roleId: string
  assignedById?: string
  department?: string
  teamId?: string
  expiresAt?: Date
}

/**
 * Create a new role
 */
export async function createRole(input: CreateRoleInput) {
  return prisma.role.create({
    data: {
      tenantId: input.tenantId,
      roleName: input.roleName,
      description: input.description,
      roleType: input.roleType || 'custom',
      permissions: input.permissions || [],
      isSystem: input.isSystem || false,
    },
  })
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(input: AssignRoleInput) {
  // Check if already assigned
  const existing = await prisma.userRole.findUnique({
    where: {
      tenantId_userId_roleId: {
        tenantId: input.tenantId,
        userId: input.userId,
        roleId: input.roleId,
      },
    },
  })

  if (existing) {
    throw new Error('Role already assigned to user')
  }

  return prisma.userRole.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      roleId: input.roleId,
      assignedById: input.assignedById,
      department: input.department,
      teamId: input.teamId,
      expiresAt: input.expiresAt,
    },
  })
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(
  tenantId: string,
  userId: string,
  roleId: string
) {
  return prisma.userRole.delete({
    where: {
      tenantId_userId_roleId: {
        tenantId,
        userId,
        roleId,
      },
    },
  })
}

/**
 * Get all roles for a tenant
 */
export async function getTenantRoles(tenantId: string) {
  return prisma.role.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    orderBy: {
      roleName: 'asc',
    },
  })
}

/**
 * Get user's roles
 */
export async function getUserRoles(tenantId: string, userId: string) {
  return prisma.userRole.findMany({
    where: {
      tenantId,
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: true,
    },
  })
}

/**
 * Initialize default roles for a tenant
 * Creates Admin, Manager, and User roles
 */
export async function initializeDefaultRoles(tenantId: string) {
  const defaultRoles = [
    {
      roleName: 'Admin',
      description: 'Full system access with tenant management',
      roleType: 'admin' as const,
      isSystem: true,
      permissions: ['*'], // All permissions
    },
    {
      roleName: 'Manager',
      description: 'Can manage team and view reports',
      roleType: 'manager' as const,
      isSystem: false,
      permissions: [
        'crm:read',
        'crm:create',
        'crm:update',
        'crm:export',
        'hr:read',
        'hr:update',
        'accounting:read',
        'communication:read',
        'communication:create',
      ],
    },
    {
      roleName: 'User',
      description: 'Basic access to assigned modules',
      roleType: 'user' as const,
      isSystem: false,
      permissions: [
        'crm:read',
        'crm:create',
        'crm:update_own',
        'communication:read',
        'communication:create',
        'hr:read_own',
      ],
    },
  ]

  const createdRoles = []
  for (const roleData of defaultRoles) {
    const existing = await prisma.role.findUnique({
      where: {
        tenantId_roleName: {
          tenantId,
          roleName: roleData.roleName,
        },
      },
    })

    if (!existing) {
      const role = await createRole({
        tenantId,
        ...roleData,
      })
      createdRoles.push(role)
    } else {
      createdRoles.push(existing)
    }
  }

  return createdRoles
}

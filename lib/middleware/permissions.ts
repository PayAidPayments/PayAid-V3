import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

const ADMIN_ROLES = new Set([
  'SUPER_ADMIN',
  'super_admin',
  'BUSINESS_ADMIN',
  'business_admin',
  'admin',
  'OWNER',
  'owner',
])

export class PermissionDeniedError extends Error {
  constructor(public requiredPermissions: string[]) {
    super(`Missing required permissions: ${requiredPermissions.join(', ')}`)
    this.name = 'PermissionDeniedError'
  }
}

export async function assertAnyPermission(
  request: NextRequest,
  requiredPermissions: string[]
): Promise<void> {
  const user = await authenticateRequest(request)
  if (!user) {
    throw new PermissionDeniedError(requiredPermissions)
  }

  const roleCandidates = user.roles?.length ? user.roles : user.role ? [user.role] : []
  const hasAdminRole = roleCandidates.some((role) => ADMIN_ROLES.has(role))
  if (hasAdminRole) return

  // Fallback: some tokens may not include the latest tenant membership role.
  // Check DB membership to avoid blocking valid owner/admin users.
  try {
    const userId = user.userId || user.sub
    const tenantId = user.tenantId || user.tenant_id
    if (userId && tenantId) {
      const member = await prisma.tenantMember.findUnique({
        where: { userId_tenantId: { userId, tenantId } },
        select: { role: true },
      })
      if (member?.role && ADMIN_ROLES.has(member.role)) return
    }
  } catch {
    // If DB lookup fails, continue with permission-array fallback below.
  }

  const userPermissions = user.permissions || []
  const hasRequiredPermission = requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  )

  if (!hasRequiredPermission) {
    throw new PermissionDeniedError(requiredPermissions)
  }
}

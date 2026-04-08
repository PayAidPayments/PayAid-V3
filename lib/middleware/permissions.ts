import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'super_admin', 'BUSINESS_ADMIN', 'business_admin', 'admin'])

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

  const userPermissions = user.permissions || []
  const hasRequiredPermission = requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  )

  if (!hasRequiredPermission) {
    throw new PermissionDeniedError(requiredPermissions)
  }
}

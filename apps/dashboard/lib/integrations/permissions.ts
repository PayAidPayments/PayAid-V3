import { NextRequest } from 'next/server'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'

export type IntegrationPermissionMode = 'view' | 'configure'

const VIEW_PERMISSIONS = ['admin.integrations.manage', 'admin.audit_log.view']
const CONFIGURE_PERMISSIONS = ['admin.integrations.manage']

export async function assertIntegrationPermission(
  request: NextRequest,
  mode: IntegrationPermissionMode
) {
  if (mode === 'view') {
    await assertAnyPermission(request, VIEW_PERMISSIONS)
    return
  }
  await assertAnyPermission(request, CONFIGURE_PERMISSIONS)
}

export function toPermissionDeniedResponse(error: unknown) {
  if (error instanceof PermissionDeniedError) {
    return {
      json: { error: error.message, code: 'PERMISSION_DENIED', required: error.requiredPermissions },
      status: 403 as const,
    }
  }
  return null
}


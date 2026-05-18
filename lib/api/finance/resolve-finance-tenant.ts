import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export type FinanceTenantContext = {
  tenantId: string
  userId: string
}

/** Require finance module license; optional organizationId must match JWT tenant. */
export async function requireFinanceTenant(
  request: NextRequest,
  organizationId?: string | null
): Promise<FinanceTenantContext | NextResponse> {
  try {
    const ctx = await requireModuleAccess(request, 'finance')
    if (organizationId && organizationId !== ctx.tenantId) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 403,
          error: {
            code: 'TENANT_MISMATCH',
            message: 'organizationId does not match authorized tenant',
          },
        },
        { status: 403 }
      )
    }
    return ctx
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    throw error
  }
}

export function isFinanceTenantContext(
  value: FinanceTenantContext | NextResponse
): value is FinanceTenantContext {
  return typeof value === 'object' && value !== null && 'tenantId' in value && !('status' in value)
}

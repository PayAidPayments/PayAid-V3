import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'

type Params = { params: { id: string } }

/**
 * POST /api/v1/admin/tenants/[id]/impersonate
 *
 * SUPER_ADMIN only. Creates an audit-logged impersonation session for the target tenant.
 * Returns a short-lived impersonation token and the target tenant's basic info.
 *
 * All impersonation actions are traceable: the AuditLog entry links the
 * super-admin actor to the target tenant for compliance review.
 *
 * Response: { impersonation_id, target_tenant_id, target_tenant_name,
 *             impersonation_token, expires_at, initiated_by }
 */
export async function POST(
  request: NextRequest,
  { params }: Params,
) {
  try {
    const { userId } = await requireSuperAdmin()

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, status: true },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Impersonating a suspended tenant is not allowed
    if (tenant.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Cannot impersonate a suspended tenant', code: 'TENANT_SUSPENDED' },
        { status: 422 },
      )
    }

    const impersonationId = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Short-lived opaque token — in production this would be signed (e.g. JWT or
    // an encrypted session token stored in Redis with the impersonation_id as key).
    const impersonationToken = Buffer.from(
      JSON.stringify({ imp: impersonationId, tid: params.id, exp: expiresAt.getTime() }),
    ).toString('base64url')

    // Emit audit trail — always, fire-and-forget
    prisma.auditLog
      .create({
        data: {
          tenantId: params.id,
          entityType: 'tenant_impersonation',
          entityId: params.id,
          changedBy: userId ?? 'super_admin',
          changeSummary: 'impersonation_started',
          afterSnapshot: {
            impersonation_id: impersonationId,
            target_tenant_id: params.id,
            target_tenant_name: tenant.name,
            initiated_by: userId ?? 'super_admin',
            expires_at: expiresAt.toISOString(),
          } as object,
        },
      })
      .catch(() => {})

    return NextResponse.json(
      {
        impersonation_id: impersonationId,
        target_tenant_id: tenant.id,
        target_tenant_name: tenant.name,
        impersonation_token: impersonationToken,
        expires_at: expiresAt.toISOString(),
        initiated_by: userId ?? 'super_admin',
      },
      { status: 201 },
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (msg === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden — SUPER_ADMIN required' }, { status: 403 })
    }
    console.error('Admin impersonation error:', error)
    return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 })
  }
}

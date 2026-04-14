import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'

async function emitSdrAuditLog(
  prismaClient: typeof import('@/lib/db/prisma').prisma,
  params: { tenantId: string; userId: string; action: string; runId: string; snapshot: Record<string, unknown> }
) {
  try {
    await prismaClient.auditLog.create({
      data: {
        tenantId: params.tenantId,
        entityType: 'sdr_run',
        entityId: params.runId,
        changedBy: params.userId,
        changeSummary: params.action,
         
        afterSnapshot: params.snapshot as any,
      },
    })
  } catch {
    // Non-fatal
  }
}

/**
 * POST /api/v1/sdr/runs/[id]/pause
 * Pause a running SDR run (:id = WorkflowExecution ID).
 * Only RUNNING runs can be paused; returns 422 otherwise.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_sdr')
    await assertAnyPermission(request, ['crm:sdr:write', 'crm:admin'])
    const { id: runId } = await params

    const run = await prisma.workflowExecution.findFirst({
      where: { id: runId, tenantId },
    })

    if (!run) {
      return NextResponse.json({ error: 'SDR run not found' }, { status: 404 })
    }

    if (run.status !== 'RUNNING') {
      return NextResponse.json(
        {
          error: `Cannot pause a run with status '${run.status.toLowerCase()}'`,
          current_status: run.status.toLowerCase(),
          code: 'INVALID_STATE_TRANSITION',
        },
        { status: 422 }
      )
    }

    const triggerData = (run.triggerData as any) ?? {}

    const updated = await prisma.workflowExecution.update({
      where: { id: runId },
      data: {
        status: 'PAUSED',
        result: {
           
          ...(run.result as any),
          paused_at: new Date().toISOString(),
           
        } as any,
        triggerData: {
          ...triggerData,
          paused_at: new Date().toISOString(),
           
        } as any,
      },
      select: { id: true, workflowId: true, status: true, startedAt: true },
    })

    const pausedAt = new Date().toISOString()
    await emitSdrAuditLog(prisma, {
      tenantId,
      userId: userId || 'system',
      action: `SDR run paused`,
      runId,
      snapshot: { playbook_id: updated.workflowId, paused_at: pausedAt },
    })

    return NextResponse.json({
      success: true,
      run: {
        id: updated.id,
        playbook_id: updated.workflowId,
        status: 'paused',
        started_at: updated.startedAt,
        paused_at: pausedAt,
      },
    })
  } catch (error) {
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: error.message, code: 'PERMISSION_DENIED' }, { status: 403 })
    }
    const err = handleLicenseError(error)
    if (err) return err
    console.error('SDR run pause error:', error)
    return NextResponse.json({ error: 'Failed to pause SDR run' }, { status: 500 })
  }
}

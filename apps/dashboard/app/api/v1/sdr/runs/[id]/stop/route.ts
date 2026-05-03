import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { sdrRunStopBodySchema } from '@/lib/ai-native/m2-contracts'
import { z } from 'zod'

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
 * POST /api/v1/sdr/runs/[id]/stop
 * Stop a running or paused SDR run (:id = WorkflowExecution ID).
 * Requires a stop reason. Records the reason and policy audit trail.
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

    const body = await request.json().catch(() => ({}))
    const validated = sdrRunStopBodySchema.parse(body)

    const run = await prisma.workflowExecution.findFirst({
      where: { id: runId, tenantId },
    })

    if (!run) {
      return NextResponse.json({ error: 'SDR run not found' }, { status: 404 })
    }

    const stoppableStatuses = ['RUNNING', 'PAUSED']
    if (!stoppableStatuses.includes(run.status)) {
      return NextResponse.json(
        {
          error: `Cannot stop a run with status '${run.status.toLowerCase()}'`,
          current_status: run.status.toLowerCase(),
          code: 'INVALID_STATE_TRANSITION',
        },
        { status: 422 }
      )
    }

    const stoppedAt = new Date().toISOString()
     
    const triggerData = (run.triggerData as any) ?? {}

    const updated = await prisma.workflowExecution.update({
      where: { id: runId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
        error: validated.reason,
        result: {
           
          ...(run.result as any),
          stopped_at: stoppedAt,
          stop_reason: validated.reason,
          policy_decision: {
            decision_type: 'manual_stop',
            outcome: 'blocked',
            reason: validated.reason,
            occurred_at: stoppedAt,
          },
           
        } as any,
        triggerData: {
          ...triggerData,
          stopped_at: stoppedAt,
          stop_reason: validated.reason,
           
        } as any,
      },
      select: { id: true, workflowId: true, status: true, startedAt: true, completedAt: true },
    })

    await emitSdrAuditLog(prisma, {
      tenantId,
      userId: userId || 'system',
      action: `SDR run stopped: ${validated.reason}`,
      runId,
      snapshot: {
        playbook_id: updated.workflowId,
        stop_reason: validated.reason,
        stopped_at: updated.completedAt,
        policy_decision: {
          decision_type: 'manual_stop',
          outcome: 'blocked',
          reason: validated.reason,
          occurred_at: stoppedAt,
        },
      },
    })

    return NextResponse.json({
      success: true,
      run: {
        id: updated.id,
        playbook_id: updated.workflowId,
        status: 'stopped',
        stop_reason: validated.reason,
        started_at: updated.startedAt,
        stopped_at: updated.completedAt,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('SDR run stop error:', error)
    return NextResponse.json({ error: 'Failed to stop SDR run' }, { status: 500 })
  }
}

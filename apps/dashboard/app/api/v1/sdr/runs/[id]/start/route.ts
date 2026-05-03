import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { sdrRunStartBodySchema } from '@/lib/ai-native/m2-contracts'
import { trackEvent } from '@/lib/analytics/track'
import { z } from 'zod'

const SDR_TRIGGER_TYPE = 'SDR_PLAYBOOK'

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
    // Non-fatal: audit trail failure must not block the run operation
  }
}

/**
 * POST /api/v1/sdr/runs/[id]/start
 * Start a new SDR run for the given playbook (:id = playbook/workflow ID).
 * Validates guardrails and creates a WorkflowExecution.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_sdr')
    await assertAnyPermission(request, ['crm:sdr:write', 'crm:admin'])
    const { id: playbookId } = await params

    const body = await request.json().catch(() => ({}))
    const validated = sdrRunStartBodySchema.parse(body)

    // Verify playbook exists and belongs to tenant
    const playbook = await prisma.workflow.findFirst({
      where: { id: playbookId, tenantId, triggerType: SDR_TRIGGER_TYPE },
    })
    if (!playbook) {
      return NextResponse.json({ error: 'SDR playbook not found' }, { status: 404 })
    }

    const playbookSteps = playbook.steps as any
    const playbookGuardrails = playbookSteps?.guardrails ?? {}
    const mergedGuardrails = { ...playbookGuardrails, ...(validated.guardrails ?? {}) }

    // Guardrail: check require_approval gate
    if (mergedGuardrails.require_approval) {
      return NextResponse.json(
        {
          error: 'Playbook requires approval before run can start',
          code: 'APPROVAL_REQUIRED',
          playbook_id: playbookId,
        },
        { status: 422 }
      )
    }

    const run = await prisma.workflowExecution.create({
      data: {
        tenantId,
        workflowId: playbookId,
        status: 'RUNNING',
        triggerData: {
          contact_ids: validated.contact_ids,
          guardrails: mergedGuardrails,
          started_at: new Date().toISOString(),
          schema_version: '1.0',
           
        } as any,
      },
      select: {
        id: true,
        workflowId: true,
        status: true,
        triggerData: true,
        startedAt: true,
      },
    })

    await emitSdrAuditLog(prisma, {
      tenantId,
      userId: userId || 'system',
      action: `SDR run started for playbook ${playbookId} with ${validated.contact_ids.length} contacts`,
      runId: run.id,
      snapshot: {
        playbook_id: playbookId,
        contact_count: validated.contact_ids.length,
        guardrails: mergedGuardrails,
        started_at: run.startedAt,
      },
    })

    trackEvent('sdr_run_started', {
      tenantId,
      userId,
      entityId: run.id,
      properties: {
        playbook_id: playbookId,
        contact_count: validated.contact_ids.length,
        require_approval: !!mergedGuardrails?.require_approval,
      },
    })

    return NextResponse.json(
      {
        success: true,
        run: {
          id: run.id,
          playbook_id: run.workflowId,
          status: run.status.toLowerCase(),
          contact_count: validated.contact_ids.length,
          guardrails: mergedGuardrails,
          started_at: run.startedAt,
        },
      },
      { status: 201 }
    )
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
    console.error('SDR run start error:', error)
    return NextResponse.json({ error: 'Failed to start SDR run' }, { status: 500 })
  }
}

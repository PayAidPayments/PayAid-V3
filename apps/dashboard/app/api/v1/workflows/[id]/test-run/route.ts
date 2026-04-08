import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { createWorkflowTestRun } from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { enqueueReliableOutboxEvent } from '@/lib/outbox/reliable-events'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'

type Params = { params: { id: string } }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:workflow:test', 'crm:admin'])
    const body = await request.json().catch(() => ({}))

    const execution = await createWorkflowTestRun(tenantId, params.id, body)
    if (!execution) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    await enqueueReliableOutboxEvent({
      tenantId,
      eventType: 'workflow.test_run.completed',
      aggregateId: execution.id,
      data: {
        workflowId: execution.workflowId,
        status: execution.status,
      },
      traceId: body?.trace_id ? String(body.trace_id) : undefined,
    })

    return NextResponse.json({
      execution_id: execution.id,
      workflow_id: execution.workflowId,
      status: execution.status,
      result: execution.result,
      completed_at: execution.completedAt,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: error.message, code: 'PERMISSION_DENIED' }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Failed to execute test run'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { workflowDefinitionSchema } from '@/lib/ai-native/m0-contracts'
import {
  createWorkflow,
  findIdempotentRequest,
  listWorkflows,
  mapWorkflowStatus,
  markIdempotentRequest,
  markWorkflowAudit,
} from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:workflow:write', 'crm:admin'])
    const body = await request.json()
    const definition = workflowDefinitionSchema.parse(body)
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()

    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `workflow:create:${idempotencyKey}`)
      const existingWorkflowId = (existing?.afterSnapshot as { workflow_id?: string } | null)?.workflow_id
      if (existing && existingWorkflowId) {
        return NextResponse.json({
          workflow_id: existingWorkflowId,
          tenant_id: tenantId,
          name: definition.name,
          status: 'draft',
          deduplicated: true,
        })
      }
    }

    const workflow = await createWorkflow(tenantId, definition)
    await markWorkflowAudit(tenantId, userId, workflow.id, `Workflow created: ${workflow.name}`, {
      triggerEvent: workflow.triggerEvent ?? '',
    })
    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `workflow:create:${idempotencyKey}`, {
        workflow_id: workflow.id,
      })
    }

    return NextResponse.json(
      {
        workflow_id: workflow.id,
        tenant_id: workflow.tenantId,
        name: workflow.name,
        status: mapWorkflowStatus(workflow.isActive),
        trigger: {
          event_type: workflow.triggerEvent,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: error.message, code: 'PERMISSION_DENIED' }, { status: 403 })
    }

    const message = error instanceof Error ? error.message : 'Failed to create workflow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:workflow:read', 'crm:admin'])
    const workflows = await listWorkflows(tenantId)

    return NextResponse.json({
      workflows: workflows.map((workflow) => ({
        workflow_id: workflow.id,
        tenant_id: workflow.tenantId,
        name: workflow.name,
        description: workflow.description,
        status: mapWorkflowStatus(workflow.isActive),
        trigger: { event_type: workflow.triggerEvent },
        steps: workflow.steps,
        created_at: workflow.createdAt,
      })),
      count: workflows.length,
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
    const message = error instanceof Error ? error.message : 'Failed to list workflows'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

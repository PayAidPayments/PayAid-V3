import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { markWorkflowAudit, publishWorkflow } from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { trackEvent } from '@/lib/analytics/track'

type Params = { params: { id: string } }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:workflow:publish', 'crm:admin'])
    const workflow = await publishWorkflow(tenantId, params.id)
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    await markWorkflowAudit(tenantId, userId, workflow.id, `Workflow published: ${workflow.name}`, {
      isActive: true,
    })

    trackEvent('workflow_published', {
      tenantId,
      userId,
      entityId: workflow.id,
      properties: { workflow_name: workflow.name },
    })

    return NextResponse.json({
      workflow_id: workflow.id,
      status: 'published',
      updated_at: workflow.updatedAt,
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
    const message = error instanceof Error ? error.message : 'Failed to publish workflow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { enrollSequence, markWorkflowAudit } from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'

type Params = { params: { id: string } }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:sequence:enroll', 'crm:admin'])
    const body = await request.json().catch(() => ({}))

    const enrollment = await enrollSequence(tenantId, params.id, body)
    if (!enrollment) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }
    await markWorkflowAudit(tenantId, userId, params.id, 'Sequence enrollment created', {
      workflowExecutionId: enrollment.id,
    })

    return NextResponse.json(
      {
        enrollment_id: enrollment.id,
        sequence_id: params.id,
        status: enrollment.status,
        started_at: enrollment.startedAt,
      },
      { status: 201 }
    )
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
    const message = error instanceof Error ? error.message : 'Failed to enroll sequence'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

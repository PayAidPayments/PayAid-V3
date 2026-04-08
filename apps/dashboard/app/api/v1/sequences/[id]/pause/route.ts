import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { markWorkflowAudit, pauseSequence } from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'

type Params = { params: { id: string } }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:sequence:pause', 'crm:admin'])
    const sequence = await pauseSequence(tenantId, params.id)
    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    await markWorkflowAudit(tenantId, userId, sequence.id, `Sequence paused: ${sequence.name}`, {
      isActive: false,
    })

    return NextResponse.json({
      sequence_id: sequence.id,
      status: 'paused',
      updated_at: sequence.updatedAt,
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
    const message = error instanceof Error ? error.message : 'Failed to pause sequence'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { sequenceDefinitionSchema } from '@/lib/ai-native/m0-contracts'
import {
  createSequence,
  findIdempotentRequest,
  mapWorkflowStatus,
  markIdempotentRequest,
  markWorkflowAudit,
} from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { trackEvent } from '@/apps/dashboard/lib/analytics/track'

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:sequence:write', 'crm:admin'])
    const body = await request.json()
    const definition = sequenceDefinitionSchema.parse(body)
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()

    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `sequence:create:${idempotencyKey}`)
      const existingSequenceId = (existing?.afterSnapshot as { sequence_id?: string } | null)?.sequence_id
      if (existing && existingSequenceId) {
        return NextResponse.json({
          sequence_id: existingSequenceId,
          tenant_id: tenantId,
          name: definition.name,
          status: 'draft',
          deduplicated: true,
        })
      }
    }

    const sequence = await createSequence(tenantId, definition)
    await markWorkflowAudit(tenantId, userId, sequence.id, `Sequence created: ${sequence.name}`, {
      status: mapWorkflowStatus(sequence.isActive),
    })

    trackEvent('sequence_created', {
      tenantId,
      userId,
      entityId: sequence.id,
      properties: { name: sequence.name, step_count: definition.steps?.length ?? 0 },
    })

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `sequence:create:${idempotencyKey}`, {
        sequence_id: sequence.id,
      })
    }

    return NextResponse.json(
      {
        sequence_id: sequence.id,
        tenant_id: sequence.tenantId,
        name: sequence.name,
        status: mapWorkflowStatus(sequence.isActive),
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

    const message = error instanceof Error ? error.message : 'Failed to create sequence'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { invalidateOutboxCaches, replayDeadLetterOutboxEvent } from '@/lib/outbox/dispatcher'

const replaySchema = z.object({
  outboxId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:outbox:replay', 'crm:admin'])

    const body = await request.json()
    const validated = replaySchema.parse(body)
    const replay = await replayDeadLetterOutboxEvent({
      tenantId,
      outboxId: validated.outboxId,
      triggeredBy: userId,
    })

    if (!replay) {
      return NextResponse.json({ error: 'DLQ record not found for outboxId' }, { status: 404 })
    }
    await invalidateOutboxCaches(tenantId)

    return NextResponse.json({
      success: true,
      replay,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Failed to replay outbox event'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

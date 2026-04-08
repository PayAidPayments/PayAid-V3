import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { revenueFeedbackBodySchema } from '@/lib/ai-native/m1-revenue'
import { persistRevenueFeedback } from '@/lib/ai-native/m1-revenue-service'

/**
 * POST /api/v1/revenue/feedback — accept/reject AI-style recommendation (audit + idempotency).
 * Headers: x-idempotency-key (required).
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')
    await assertAnyPermission(request, ['crm:audit:read', 'crm:admin'])

    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Missing x-idempotency-key header' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = revenueFeedbackBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 })
    }

    const result = await persistRevenueFeedback(tenantId, userId, idempotencyKey, parsed.data)

    return NextResponse.json({
      ok: true,
      deduplicated: result.deduplicated,
      feedback: parsed.data,
      recorded_at: result.audit.timestamp.toISOString(),
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
    const message = error instanceof Error ? error.message : 'Failed to record feedback'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

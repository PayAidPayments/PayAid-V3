import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { getRevenueNextActions } from '@/lib/ai-native/m1-revenue-service'
import { revenueNextActionsResponseSchema } from '@/lib/ai-native/m1-revenue'

/**
 * GET /api/v1/revenue/insights/next-actions — ranked deal-level recommendations (CRM ground truth).
 * Query: limit (default 8, max 25).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')
    await assertAnyPermission(request, ['crm:audit:read', 'crm:admin'])

    const raw = request.nextUrl.searchParams.get('limit')
    const n = raw ? Number(raw) : 8
    const limit = Number.isFinite(n) ? Math.min(Math.max(Math.floor(n), 1), 25) : 8

    const payload = await getRevenueNextActions(tenantId, limit)
    const parsed = revenueNextActionsResponseSchema.safeParse(payload)
    if (!parsed.success) {
      console.error('[revenue/next-actions] schema drift', parsed.error.flatten())
      return NextResponse.json({ error: 'Internal response validation error' }, { status: 500 })
    }
    return NextResponse.json(parsed.data)
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
    const message = error instanceof Error ? error.message : 'Failed to load next actions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

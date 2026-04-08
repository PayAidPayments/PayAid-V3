import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { getRevenueWonTimeseries } from '@/lib/ai-native/m1-revenue-service'
import { revenueWonTimeseriesResponseSchema } from '@/lib/ai-native/m1-revenue'

/**
 * GET /api/v1/revenue/won-timeseries — monthly won count/value for last N months.
 * Query: months (default 6, max 24).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')
    await assertAnyPermission(request, ['crm:audit:read', 'crm:admin'])

    const raw = request.nextUrl.searchParams.get('months')
    const n = raw ? Number(raw) : 6
    const months = Number.isFinite(n) ? Math.min(Math.max(Math.floor(n), 1), 24) : 6

    const payload = await getRevenueWonTimeseries(tenantId, months)
    const parsed = revenueWonTimeseriesResponseSchema.safeParse(payload)
    if (!parsed.success) {
      console.error('[revenue/won-timeseries] schema drift', parsed.error.flatten())
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
    const message = error instanceof Error ? error.message : 'Failed to load won time series'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


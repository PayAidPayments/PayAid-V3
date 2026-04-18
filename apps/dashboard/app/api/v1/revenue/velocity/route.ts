import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { getRevenueVelocity } from '@/lib/ai-native/m1-revenue-service'
import { revenueVelocityResponseSchema } from '@/lib/ai-native/m1-revenue'

/**
 * GET /api/v1/revenue/velocity — deal age / velocity proxies from open deals + won in window.
 * Query: windowDays (default 30, max 365).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')

    const raw = request.nextUrl.searchParams.get('windowDays')
    const n = raw ? Number(raw) : 30
    const windowDays = Number.isFinite(n) ? Math.min(Math.max(Math.floor(n), 1), 365) : 30

    const payload = await getRevenueVelocity(tenantId, windowDays)
    const parsed = revenueVelocityResponseSchema.safeParse(payload)
    if (!parsed.success) {
      console.error('[revenue/velocity] schema drift', parsed.error.flatten())
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
    const message = error instanceof Error ? error.message : 'Failed to load revenue velocity'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

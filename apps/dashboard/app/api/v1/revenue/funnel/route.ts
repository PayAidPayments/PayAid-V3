import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { getRevenueFunnel } from '@/lib/ai-native/m1-revenue-service'
import { revenueFunnelResponseSchema } from '@/lib/ai-native/m1-revenue'

/**
 * GET /api/v1/revenue/funnel — open pipeline by stage + last 30d and prior 30d closed-won snapshots (tenant deals).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')

    const payload = await getRevenueFunnel(tenantId)
    const parsed = revenueFunnelResponseSchema.safeParse(payload)
    if (!parsed.success) {
      console.error('[revenue/funnel] schema drift', parsed.error.flatten())
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
    const message = error instanceof Error ? error.message : 'Failed to load revenue funnel'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

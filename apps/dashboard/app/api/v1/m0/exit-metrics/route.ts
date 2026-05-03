import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { getM0ExitMetrics } from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'

/**
 * Read-only M0 exit criteria metrics for the authenticated tenant.
 * Query: windowDays (default 7), signalSample (default 100, max 500).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:audit:read', 'crm:admin'])

    const searchParams = request.nextUrl.searchParams
    const windowDays = Math.min(Math.max(Number(searchParams.get('windowDays') || 7), 1), 90)
    const signalSample = Math.min(Math.max(Number(searchParams.get('signalSample') || 100), 1), 500)

    const metrics = await getM0ExitMetrics(tenantId, {
      windowDays,
      signalSampleSize: signalSample,
    })

    return NextResponse.json(metrics)
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
    const message = error instanceof Error ? error.message : 'Failed to load M0 exit metrics'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

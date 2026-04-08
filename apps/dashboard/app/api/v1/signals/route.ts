import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { listSignals } from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType') || undefined
    const status = searchParams.get('status') || undefined
    const intentMinParam = searchParams.get('intentMin')
    const intentMinValue = intentMinParam ? Number(intentMinParam) : undefined
    const intentMin = Number.isFinite(intentMinValue) ? intentMinValue : undefined
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

    const signals = await listSignals({
      tenantId,
      entityType,
      status,
      intentMin,
      limit,
    })

    return NextResponse.json({
      signals,
      count: signals.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch signals'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

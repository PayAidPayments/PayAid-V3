import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { getOutboxOperationalMetrics } from '@/lib/outbox/dispatcher'
import { evaluateOutboxAlerts } from '@/lib/outbox/alerts'
import { multiLayerCache } from '@/lib/cache/multi-layer'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:audit:read', 'crm:admin'])

    const cacheKey = `outbox:metrics:${tenantId}`
    const cached = await multiLayerCache.get<{ tenantId: string; metrics: unknown; alerts: unknown }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const metrics = await getOutboxOperationalMetrics(tenantId)
    const alerts = evaluateOutboxAlerts(metrics)
    const response = {
      tenantId,
      metrics,
      alerts,
    }
    await multiLayerCache.set(cacheKey, response, 15).catch(() => {})
    return NextResponse.json(response)
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
    const message = error instanceof Error ? error.message : 'Failed to fetch outbox metrics'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

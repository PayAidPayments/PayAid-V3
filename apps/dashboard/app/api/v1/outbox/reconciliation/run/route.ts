import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { reconcileOutboxHealthAcrossTenants } from '@/lib/outbox/reconciliation'
import { multiLayerCache } from '@/lib/cache/multi-layer'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:outbox:reconcile', 'crm:admin'])

    const cooldownSeconds = Math.max(Number(process.env.OUTBOX_RECON_RUN_MIN_INTERVAL_SECONDS || '60'), 10)
    const cooldownKey = `outbox:recon:cooldown:${tenantId}`
    const existingCooldown = await multiLayerCache.get<{ blocked: true }>(cooldownKey)
    if (existingCooldown) {
      return NextResponse.json(
        {
          error: 'Reconciliation run is on cooldown',
          code: 'RECONCILIATION_COOLDOWN',
          retryAfterSeconds: cooldownSeconds,
        },
        { status: 429 }
      )
    }

    await multiLayerCache.set(cooldownKey, { blocked: true }, cooldownSeconds).catch(() => {})

    const result = await reconcileOutboxHealthAcrossTenants()
    return NextResponse.json({
      success: true,
      processedTenants: result.processedTenants,
      riskyTenants: result.riskyTenants,
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
    const message = error instanceof Error ? error.message : 'Failed to run reconciliation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

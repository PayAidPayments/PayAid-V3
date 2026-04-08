import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:audit:read', 'crm:admin'])

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 100)
    const riskyOnly = request.nextUrl.searchParams.get('riskyOnly') === '1'
    const dlqMin = Number(request.nextUrl.searchParams.get('dlqMin') || '0')
    const driftMin = Number(request.nextUrl.searchParams.get('driftMin') || '0')
    const rows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'outbox_reconciliation_run',
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    const mapped = rows.map((row) => {
      const details = (row.afterSnapshot || {}) as Record<string, unknown>
      const hasRisk = Boolean(details.hasRisk)
      const dlqCount = Number(details.dlqCount || 0)
      const driftCount = Number(details.driftCount || 0)
      return {
        id: row.id,
        runAt: row.timestamp,
        summary: row.changeSummary,
        details,
        hasRisk,
        dlqCount,
        driftCount,
      }
    })

    const filtered = mapped.filter((run) => {
      if (riskyOnly && !run.hasRisk) return false
      if (run.dlqCount < dlqMin) return false
      if (run.driftCount < driftMin) return false
      return true
    })

    return NextResponse.json({
      tenantId,
      runs: filtered,
      filters: { riskyOnly, dlqMin, driftMin, limit },
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
    const message = error instanceof Error ? error.message : 'Failed to fetch reconciliation history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

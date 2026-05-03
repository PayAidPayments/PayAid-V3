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

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [lastRun, runs24h] = await Promise.all([
      prisma.auditLog.findFirst({
        where: { tenantId, entityType: 'outbox_reconciliation_run' },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.findMany({
        where: {
          tenantId,
          entityType: 'outbox_reconciliation_run',
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'desc' },
        take: 500,
      }),
    ])

    const riskyRunsLast24h = runs24h.filter((row) => {
      const snapshot = (row.afterSnapshot || {}) as Record<string, unknown>
      return Boolean(snapshot.hasRisk)
    }).length

    return NextResponse.json({
      tenantId,
      telemetry: {
        lastRunAt: lastRun?.timestamp ?? null,
        lastRunSummary: lastRun?.changeSummary ?? null,
        runsLast24h: runs24h.length,
        riskyRunsLast24h,
      },
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
    const message = error instanceof Error ? error.message : 'Failed to fetch reconciliation telemetry'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

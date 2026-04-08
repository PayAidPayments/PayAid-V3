import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { prisma } from '@/lib/db/prisma'

type TrendRow = {
  date: string
  totalRuns: number
  riskyRuns: number
}

function toDateKey(input: Date): string {
  return input.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:audit:read', 'crm:admin'])

    const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get('days') || 7), 1), 30)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const rows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'outbox_reconciliation_run',
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
      take: 5000,
      select: {
        timestamp: true,
        afterSnapshot: true,
      },
    })

    const map = new Map<string, TrendRow>()
    for (const row of rows) {
      const key = toDateKey(row.timestamp)
      const current = map.get(key) || { date: key, totalRuns: 0, riskyRuns: 0 }
      current.totalRuns += 1
      const snapshot = (row.afterSnapshot || {}) as Record<string, unknown>
      if (Boolean(snapshot.hasRisk)) current.riskyRuns += 1
      map.set(key, current)
    }

    const trend = Array.from(map.values())
    return NextResponse.json({
      tenantId,
      days,
      trend,
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
    const message = error instanceof Error ? error.message : 'Failed to fetch reconciliation trends'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

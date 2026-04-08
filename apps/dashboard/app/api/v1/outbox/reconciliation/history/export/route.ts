import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { prisma } from '@/lib/db/prisma'

function toCsv(rows: Array<Record<string, string | number | boolean | null>>): string {
  if (rows.length === 0) return 'runAt,hasRisk,dlqCount,driftCount,summary\n'
  const headers = Object.keys(rows[0])
  const escapeCell = (value: unknown) => {
    const str = value === null || value === undefined ? '' : String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','))
  }
  return `${lines.join('\n')}\n`
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:audit:read', 'crm:admin'])

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 500), 2000)
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
      select: {
        timestamp: true,
        changeSummary: true,
        afterSnapshot: true,
      },
    })

    const normalized = rows
      .map((row) => {
        const details = (row.afterSnapshot || {}) as Record<string, unknown>
        const hasRisk = Boolean(details.hasRisk)
        const dlqCount = Number(details.dlqCount || 0)
        const driftCount = Number(details.driftCount || 0)
        return {
          runAt: row.timestamp.toISOString(),
          hasRisk,
          dlqCount,
          driftCount,
          summary: row.changeSummary,
        }
      })
      .filter((row) => {
        if (riskyOnly && !row.hasRisk) return false
        if (row.dlqCount < dlqMin) return false
        if (row.driftCount < driftMin) return false
        return true
      })

    const csv = toCsv(normalized)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="outbox-reconciliation-history-${tenantId}.csv"`,
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
    const message = error instanceof Error ? error.message : 'Failed to export reconciliation history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

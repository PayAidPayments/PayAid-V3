import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/audit-logs?limit=50
 * Tenant-scoped audit log entries (Prisma `AuditLog`).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const raw = request.nextUrl.searchParams.get('limit') || '50'
    const limit = Math.min(Math.max(parseInt(raw, 10) || 50, 1), 100)

    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        changeSummary: true,
        changedBy: true,
        timestamp: true,
      },
    })

    return NextResponse.json({
      success: true,
      logs,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('GET /api/audit-logs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load audit logs' },
      { status: 500 }
    )
  }
}

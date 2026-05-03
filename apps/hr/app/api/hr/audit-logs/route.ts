import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10) || 50
    const entityType = request.nextUrl.searchParams.get('entityType') || ''
    const where: { tenantId: string; entityType?: string } = { tenantId }
    if (entityType && ['PayrollRun', 'Contract', 'Employee', 'Contractor'].includes(entityType)) {
      where.entityType = entityType
    }
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        entityType: true,
        entityId: true,
        changeSummary: true,
        changedBy: true,
        timestamp: true,
        beforeSnapshot: true,
        afterSnapshot: true,
      },
    })
    return NextResponse.json({ logs, generatedAt: new Date().toISOString() })
  } catch (e: unknown) {
    return handleLicenseError(e)
  }
}

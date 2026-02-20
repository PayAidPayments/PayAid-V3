import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || undefined
    const entityType = searchParams.get('entityType') || undefined
    const changedBy = searchParams.get('changedBy') || undefined
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)

    const where: any = {}
    if (tenantId) where.tenantId = tenantId
    if (entityType) where.entityType = entityType
    if (changedBy) where.changedBy = changedBy
    if (from || to) {
      where.timestamp = {}
      if (from) where.timestamp.gte = new Date(from)
      if (to) where.timestamp.lte = new Date(to)
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        tenant: { select: { id: true, name: true } },
      },
    })

    const data = logs.map((l) => ({
      id: l.id,
      entityType: l.entityType,
      entityId: l.entityId,
      changedBy: l.changedBy,
      changeSummary: l.changeSummary,
      tenantId: l.tenantId,
      tenantName: l.tenant.name,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      timestamp: l.timestamp.toISOString(),
    }))

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Super admin audit-log error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

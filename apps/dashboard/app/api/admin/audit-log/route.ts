import { NextResponse } from 'next/server'
import { requireTenantAdmin } from '@/lib/middleware/requireTenantAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const decoded = await requireTenantAdmin()
    const tenantId = decoded.tenant_id ?? decoded.tenantId
    if (!tenantId) return NextResponse.json({ data: [] })
    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      select: { id: true, changeSummary: true, changedBy: true, entityType: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
      take: 100,
    })
    const data = logs.map((l) => ({
      id: l.id,
      action: l.changeSummary,
      actorId: l.changedBy,
      resourceType: l.entityType,
      createdAt: l.timestamp.toISOString(),
    }))
    return NextResponse.json({ data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }
}

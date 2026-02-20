import { NextResponse } from 'next/server'
import { requireTenantAdmin } from '@/lib/middleware/requireTenantAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const decoded = await requireTenantAdmin()
    const tenantId = decoded.tenant_id ?? decoded.tenantId
    if (!tenantId) {
      return NextResponse.json({ data: { plan: 'free', maxUsers: 1, usage: 0 } })
    }
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, subscriptionTier: true, maxUsers: true },
    })
    const userCount = await prisma.user.count({ where: { tenantId } })
    return NextResponse.json({
      data: {
        plan: tenant?.subscriptionTier ?? tenant?.plan ?? 'free',
        maxUsers: tenant?.maxUsers ?? 1,
        usage: userCount,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }
}

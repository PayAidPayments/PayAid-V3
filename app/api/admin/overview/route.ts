import { NextResponse } from 'next/server'
import { requireTenantAdmin } from '@/lib/middleware/requireTenantAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const decoded = await requireTenantAdmin()
    const tenantId = decoded.tenant_id ?? decoded.tenantId
    if (!tenantId) {
      return NextResponse.json({ data: { users: 0, modules: 0 } })
    }
    const [users, tenant] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { licensedModules: true },
      }),
    ])
    const modules = (tenant?.licensedModules ?? []).length
    return NextResponse.json({ data: { users, modules } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }
}

import { NextResponse } from 'next/server'
import { requireTenantAdmin } from '@/lib/middleware/requireTenantAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const decoded = await requireTenantAdmin()
    const tenantId = decoded.tenant_id ?? decoded.tenantId
    if (!tenantId) return NextResponse.json({ data: [] })
    const roles = await prisma.role.findMany({
      where: { tenantId },
      select: { id: true, roleName: true, roleType: true, description: true },
    })
    return NextResponse.json({ data: roles })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }
}

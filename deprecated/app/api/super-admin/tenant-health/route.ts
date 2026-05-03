import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        _count: { select: { users: true } },
      },
    })

    const data = tenants.map((t) => {
      const totalUsers = t._count.users
      const activeUsers = Math.min(totalUsers, Math.max(0, totalUsers - 1))
      const healthScore = t.status === 'suspended' ? 0 : Math.min(100, 50 + totalUsers * 10 + (t.status === 'active' ? 20 : 0))
      return {
        tenantId: t.id,
        tenantName: t.name,
        healthScore: Math.round(healthScore),
        activeUsers,
        totalUsers,
        status: t.status,
      }
    })

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Super admin tenant-health error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

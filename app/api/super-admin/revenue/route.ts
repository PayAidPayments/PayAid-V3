import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Calculate revenue by plan
    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        plan: true,
      },
    })

    const revenueByPlan: Record<string, number> = {}
    const topTenants: Array<{ id: string; name: string; plan: string; mrr: number }> = []

    for (const tenant of tenants) {
      const tier = tenant.subscriptionTier || 'free'
      const subscription = await prisma.subscription.findFirst({
        where: { tenantId: tenant.id, status: 'active' },
      })
      const mrr = subscription?.monthlyPrice ? Number(subscription.monthlyPrice) : 0

      revenueByPlan[tier] = (revenueByPlan[tier] || 0) + mrr

      topTenants.push({
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan || tier,
        mrr,
      })
    }

    // Sort top tenants by MRR
    topTenants.sort((a, b) => b.mrr - a.mrr)

    return NextResponse.json({
      data: {
        revenueByPlan: Object.entries(revenueByPlan).map(([plan, revenue]) => ({
          plan,
          revenue,
        })),
        topTenants: topTenants.slice(0, 10),
      },
    })
  } catch (e) {
    console.error('Super admin revenue error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

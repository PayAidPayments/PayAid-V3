import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()

    const now = new Date()
    const lastMonth = new Date(now)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    // Calculate MRR and ARR from subscriptions
    const [subscriptions, paidTenants, lastMonthSubscriptions] = await Promise.all([
      prisma.subscription.findMany({
        where: { status: 'active' },
        select: { monthlyPrice: true, tier: true },
      }),
      prisma.tenant.count({
        where: { status: 'active', subscriptionTier: { not: 'free' } },
      }),
      prisma.subscription.findMany({
        where: {
          status: 'active',
          createdAt: { lte: lastMonth },
        },
        select: { monthlyPrice: true },
      }),
    ])

    const mrr = subscriptions.reduce((sum, s) => sum + Number(s.monthlyPrice || 0), 0)
    const lastMonthMrr = lastMonthSubscriptions.reduce(
      (sum, s) => sum + Number(s.monthlyPrice || 0),
      0
    )
    const mrrGrowth = lastMonthMrr > 0 ? ((mrr - lastMonthMrr) / lastMonthMrr) * 100 : 0
    const arr = mrr * 12

    // Revenue by plan tier
    const revenueByPlan = subscriptions.reduce((acc, s) => {
      const tier = s.tier || 'free'
      acc[tier] = (acc[tier] || 0) + Number(s.monthlyPrice || 0)
      return acc
    }, {} as Record<string, number>)

    // Top tenants by revenue
    const topTenants = await prisma.subscription
      .findMany({
        where: { status: 'active' },
        include: {
          tenant: {
            select: { id: true, name: true },
          },
        },
        orderBy: { monthlyPrice: 'desc' },
        take: 10,
      })
      .then((subs) =>
        subs.map((s) => ({
          tenantId: s.tenantId,
          tenantName: s.tenant?.name || 'Unknown',
          mrr: Number(s.monthlyPrice || 0),
          tier: s.tier,
        }))
      )
      .catch(() => [])

    // Calculate churn (cancelled subscriptions in last 30 days)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const churnedSubscriptions = await prisma.subscription.count({
      where: {
        status: { not: 'active' },
        cancelledAt: { gte: thirtyDaysAgo },
      },
    }).catch(() => 0)
    const churnRate = paidTenants > 0 ? (churnedSubscriptions / paidTenants) * 100 : 0

    return NextResponse.json({
      data: {
        mrr,
        arr,
        mrrGrowth: mrrGrowth.toFixed(1),
        churnRate: churnRate.toFixed(1),
        paidTenants,
        revenueByPlan,
        topTenants,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }
}

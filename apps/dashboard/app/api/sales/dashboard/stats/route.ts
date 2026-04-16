import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { cache } from '@/lib/redis/client'

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

// GET /api/sales/dashboard/stats
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const now = new Date()
    const cacheKey = `sales:dashboard:stats:${tenantId}:${now.getFullYear()}-${now.getMonth()}`
    const cached = await cache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStart = startOfMonth(lastMonthDate)
    const lastMonthEnd = endOfMonth(lastMonthDate)
    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      landingPages,
      checkoutPages,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      thisMonthOrders,
      lastMonthOrders,
      recentOrders,
      ordersByStatusRaw,
      monthlyRevenueRaw,
      landingPageViews,
    ] = await Promise.all([
      prisma.landingPage.count({ where: { tenantId } }),
      prisma.checkoutPage.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.order.count({
        where: { tenantId, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
      }),
      prisma.order.count({
        where: { tenantId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.order.aggregate({
        where: { tenantId, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { tenantId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.$queryRaw<Array<{ month: Date; revenue: number | string | null }>>`
        SELECT
          date_trunc('month', "createdAt") AS month,
          COALESCE(SUM("total"), 0) AS revenue
        FROM "Order"
        WHERE "tenantId" = ${tenantId}
          AND "createdAt" >= ${sixMonthStart}
          AND "createdAt" <= ${thisMonthEnd}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.landingPage.aggregate({
        where: { tenantId },
        _sum: { views: true },
      }),
    ])

    const revenueThisMonth = Number(thisMonthOrders._sum.total || 0)
    const revenueLastMonth = Number(lastMonthOrders._sum.total || 0)
    const orderGrowth = ordersLastMonth > 0 ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100 : 0
    const revenueGrowth = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0

    const monthlyMap = new Map<string, number>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      monthlyMap.set(key, 0)
    }
    for (const row of monthlyRevenueRaw) {
      const d = new Date(row.month)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, Number(row.revenue || 0))
      }
    }
    const monthlyRevenue = Array.from(monthlyMap.entries()).map(([key, revenue]) => {
      const [year, month] = key.split('-').map(Number)
      const d = new Date(year, month, 1)
      return {
        month: d.toLocaleString('en-US', { month: 'short' }),
        revenue,
      }
    })

    const ordersByStatus = ordersByStatusRaw.map((row) => ({
      status: row.status || 'unknown',
      count: row._count._all,
      total: Number(row._sum.total || 0),
    }))

    const payload = {
      landingPages,
      checkoutPages,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      orderGrowth,
      revenueThisMonth,
      revenueLastMonth,
      revenueGrowth,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: Number(o.total || 0),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      monthlyRevenue,
      ordersByStatus,
      landingPageViews: Number(landingPageViews._sum.views || 0),
      checkoutPageViews: 0,
    }

    await cache.set(cacheKey, payload, 60)
    return NextResponse.json(payload)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Sales dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales dashboard stats' },
      { status: 500 }
    )
  }
}

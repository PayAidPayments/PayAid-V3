import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/sales/dashboard/stats - Get Sales dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')

    // Get current date for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch all data in parallel
    const [
      landingPages,
      checkoutPages,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      recentOrders,
      landingPageViews,
      checkoutPageViews,
    ] = await Promise.all([
      // Landing pages count
      prisma.landingPage.count({
        where: {
          tenantId,
          status: 'PUBLISHED',
        },
      }).catch(() => 0),
      
      // Checkout pages count
      prisma.checkoutPage.count({
        where: {
          tenantId,
          status: 'PUBLISHED',
        },
      }).catch(() => 0),
      
      // Total orders
      prisma.order.count({
        where: { tenantId },
      }).catch(() => 0),
      
      // Orders this month
      prisma.order.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }).catch(() => 0),
      
      // Orders last month
      prisma.order.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }).catch(() => 0),
      
      // Revenue this month
      prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: { in: ['confirmed', 'shipped', 'delivered'] },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      
      // Revenue last month
      prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
          status: { in: ['confirmed', 'shipped', 'delivered'] },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      
      // Recent orders (last 5)
      prisma.order.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }).catch(() => []),
      
      // Landing page views (placeholder - would need analytics integration)
      Promise.resolve(0),
      
      // Checkout page views (placeholder - would need analytics integration)
      Promise.resolve(0),
    ])

    // Calculate growth percentages
    const orderGrowth = ordersLastMonth > 0 
      ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100 
      : ordersThisMonth > 0 ? 100 : 0
    
    const revenueGrowth = (revenueLastMonth._sum.total || 0) > 0
      ? ((revenueThisMonth._sum.total || 0) - (revenueLastMonth._sum.total || 0)) / (revenueLastMonth._sum.total || 0) * 100
      : (revenueThisMonth._sum.total || 0) > 0 ? 100 : 0

    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
      SELECT 
        TO_CHAR("createdAt", 'Mon YYYY') as month,
        COALESCE(SUM("total"), 0)::float as revenue
      FROM "Order"
      WHERE "tenantId" = ${tenantId}
        AND "status" IN ('confirmed', 'shipped', 'delivered')
        AND "createdAt" IS NOT NULL
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'Mon YYYY')
      ORDER BY MIN("createdAt") ASC
    `.catch(() => [])

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
      _sum: { total: true },
    }).catch(() => [])

    return NextResponse.json({
      landingPages,
      checkoutPages,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      orderGrowth: Math.round(orderGrowth * 10) / 10,
      revenueThisMonth: revenueThisMonth._sum.total || 0,
      revenueLastMonth: revenueLastMonth._sum.total || 0,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      recentOrders: Array.isArray(recentOrders) ? recentOrders : [],
      monthlyRevenue: Array.isArray(monthlyRevenue)
        ? monthlyRevenue.map((r: any) => ({
            month: r?.month || '',
            revenue: Number(r?.revenue) || 0,
          }))
        : [],
      ordersByStatus: Array.isArray(ordersByStatus)
        ? ordersByStatus.map((o: any) => ({
            status: o?.status || '',
            count: o?._count?.id || 0,
            total: Number(o?._sum?.total) || 0,
          }))
        : [],
      landingPageViews,
      checkoutPageViews,
    })
  } catch (error: any) {
    console.error('Sales dashboard stats error:', error)
    
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    // Return fallback stats with arrays to prevent frontend crashes
    return NextResponse.json(
      { 
        error: 'Failed to fetch sales dashboard stats', 
        message: error?.message,
        // Always return arrays to prevent "t.map is not a function" errors
        landingPages: 0,
        checkoutPages: 0,
        totalOrders: 0,
        ordersThisMonth: 0,
        ordersLastMonth: 0,
        orderGrowth: 0,
        revenueThisMonth: 0,
        revenueLastMonth: 0,
        revenueGrowth: 0,
        recentOrders: [],
        monthlyRevenue: [],
        ordersByStatus: [],
        landingPageViews: 0,
        checkoutPageViews: 0,
      },
      { status: 500 }
    )
  }
}


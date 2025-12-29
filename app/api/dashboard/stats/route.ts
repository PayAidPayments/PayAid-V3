import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { cache } from '@/lib/redis/client'

// Chart color constants
const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'
const PAYAID_LIGHT_PURPLE = '#6B4BA1'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check Analytics module license (dashboard stats are part of analytics)
    let tenantId: string
    try {
      const access = await requireModuleAccess(request, 'analytics')
      tenantId = access.tenantId
    } catch (licenseError: any) {
      // If it's a license error, return it properly
      if (licenseError && typeof licenseError === 'object' && 'moduleId' in licenseError) {
        return handleLicenseError(licenseError)
      }
      // Otherwise, try to get tenantId from auth token for basic stats
      // This allows dashboard to work even without analytics module
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'No authorization token provided' },
          { status: 401 }
        )
      }
      // Try to decode token to get tenantId (for basic stats without license check)
      const { verifyToken } = await import('@/lib/auth/jwt')
      try {
        const payload = verifyToken(authHeader.substring(7))
        tenantId = payload.tenantId
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Invalid token: missing tenantId' },
            { status: 401 }
          )
        }
      } catch (tokenError) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
    }

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbError: any) {
      console.error('Database connection error:', {
        code: dbError?.code,
        message: dbError?.message,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'NOT SET',
      })
      
      // Provide more specific error messages based on error code
      let errorMessage = 'Database connection failed'
      if (dbError?.code === 'P1001') {
        errorMessage = 'Database connection timeout. The database server may be down or unreachable.'
      } else if (dbError?.code === 'P1000') {
        errorMessage = 'Database authentication failed. Please check your DATABASE_URL credentials.'
      } else if (dbError?.code === 'P1002') {
        errorMessage = 'Database connection timeout. Try using a direct connection instead of a pooler.'
      } else if (dbError?.message?.includes('ENOTFOUND')) {
        errorMessage = 'Database hostname not found. The database server may be paused or the hostname is incorrect.'
      } else if (dbError?.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Database connection refused. The database server may be down or not accepting connections.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          code: dbError?.code,
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
        { status: 503 }
      )
    }

    // Check cache first (2 minute TTL for dashboard stats)
    // Gracefully handle Redis errors - continue without cache if Redis is unavailable
    let cached = null
    try {
      const cacheKey = `dashboard:stats:${tenantId}`
      cached = await cache.get(cacheKey)
      if (cached) {
        return NextResponse.json(cached)
      }
    } catch (cacheError) {
      console.warn('Redis cache unavailable, continuing without cache:', cacheError)
      // Continue without cache - not critical
    }

    // Optimize: Run all queries in parallel for better performance
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Execute all queries in parallel to reduce total query time
    const [
      contacts,
      deals,
      orders,
      invoices,
      tasks,
      recentOrders,
      recentInvoices,
      activeDeals,
      recentContacts,
      recentDeals,
      recentOrdersList,
      overdueInvoices,
      pendingTasks,
    ] = await Promise.all([
      prisma.contact.count({ where: { tenantId: tenantId } }).catch(() => 0),
      prisma.deal.count({ where: { tenantId: tenantId } }).catch(() => 0),
      prisma.order.count({ where: { tenantId: tenantId } }).catch(() => 0),
      prisma.invoice.count({ where: { tenantId: tenantId } }).catch(() => 0),
      prisma.task.count({ where: { tenantId: tenantId } }).catch(() => 0),
      // Revenue data (last 30 days)
      prisma.order.findMany({
        where: {
          tenantId: tenantId,
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['confirmed', 'shipped', 'delivered'] },
        },
        select: {
          total: true,
          createdAt: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          tenantId: tenantId,
          createdAt: { gte: thirtyDaysAgo },
          status: 'paid',
        },
        select: {
          total: true,
          createdAt: true,
        },
      }),
      // Active deals value
      prisma.deal.findMany({
        where: {
          tenantId: tenantId,
          stage: { not: 'lost' },
        },
        select: {
          value: true,
        },
      }).catch(() => []),
      // Recent activity
      prisma.contact.findMany({
        where: { tenantId: tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true,
        },
      }),
      prisma.deal.findMany({
        where: { tenantId: tenantId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          stage: true,
          value: true,
          updatedAt: true,
        },
      }),
      prisma.order.findMany({
        where: { tenantId: tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      // Overdue invoices
      prisma.invoice.count({
        where: {
          tenantId: tenantId,
          status: 'overdue',
        },
      }).catch(() => 0),
      // Pending tasks
      prisma.task.count({
        where: {
          tenantId: tenantId,
          status: { in: ['pending', 'in_progress'] },
        },
      }).catch(() => 0),
    ])

    const totalRevenue = [...recentOrders, ...recentInvoices].reduce(
      (sum, item) => sum + (item.total || 0),
      0
    )

    const pipelineValue = activeDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)

    // Calculate revenue breakdowns
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const [revenueLast7Days, revenueLast90Days, revenueAllTime] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId: tenantId,
          status: 'paid',
          paidAt: { gte: sevenDaysAgo },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      prisma.invoice.aggregate({
        where: {
          tenantId: tenantId,
          status: 'paid',
          paidAt: { gte: ninetyDaysAgo },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      prisma.invoice.aggregate({
        where: {
          tenantId: tenantId,
          status: 'paid',
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
    ])

    // Calculate monthly revenue trends (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenantId,
        status: 'paid',
        paidAt: { gte: sixMonthsAgo },
      },
      select: {
        total: true,
        paidAt: true,
      },
    }).catch(() => [])

    const monthlyOrders = await prisma.order.findMany({
      where: {
        tenantId: tenantId,
        status: { in: ['confirmed', 'shipped', 'delivered'] },
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        total: true,
        createdAt: true,
      },
    }).catch(() => [])

    // Group by month
    const monthlyRevenueMap = new Map<string, number>()
    const monthlySalesMap = new Map<string, number>()
    
    monthlyInvoices.forEach(inv => {
      if (inv.paidAt) {
        const monthKey = new Date(inv.paidAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        monthlyRevenueMap.set(monthKey, (monthlyRevenueMap.get(monthKey) || 0) + (inv.total || 0))
      }
    })

    monthlyOrders.forEach(order => {
      if (order.createdAt) {
        const monthKey = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        monthlySalesMap.set(monthKey, (monthlySalesMap.get(monthKey) || 0) + (order.total || 0))
      }
    })

    // Generate last 6 months data
    const salesTrendData = []
    const revenueData = []
    const monthNames = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      monthNames.push(monthName)
      
      const revenue = monthlyRevenueMap.get(monthKey) || 0
      const sales = monthlySalesMap.get(monthKey) || 0
      
      salesTrendData.push({
        name: monthName,
        value: Math.round(sales),
        target: Math.round(sales * 1.2), // 20% growth target
      })
      
      revenueData.push({
        month: monthName,
        revenue: Math.round(revenue),
        expenses: Math.round(revenue * 0.7), // Estimate expenses as 70% of revenue
      })
    }

    // Calculate market share from deals by stage
    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      where: {
        tenantId: tenantId,
      },
      _sum: {
        value: true,
      },
    }).catch(() => [])

    const totalDealValue = dealsByStage.reduce((sum, d) => sum + (d._sum.value || 0), 0)
    const marketShareData = dealsByStage
      .filter(d => d._sum.value && d._sum.value > 0)
      .slice(0, 3)
      .map((d, idx) => {
        const percentage = totalDealValue > 0 ? Math.round((d._sum.value! / totalDealValue) * 100) : 0
        const colors = [PAYAID_PURPLE, PAYAID_GOLD, PAYAID_LIGHT_PURPLE]
        return {
          name: d.stage || `Stage ${idx + 1}`,
          value: percentage,
          fill: colors[idx] || PAYAID_PURPLE,
        }
      })

    // If no deals, use default data
    if (marketShareData.length === 0) {
      marketShareData.push(
        { name: 'Active Deals', value: 100, fill: PAYAID_PURPLE }
      )
    }

    // Calculate KPIs from real data
    const totalContacts = contacts
    const totalDeals = deals
    const conversionRate = totalContacts > 0 ? ((totalDeals / totalContacts) * 100).toFixed(1) : '0.0'
    const avgRevenuePerUser = totalContacts > 0 ? Math.round((revenueAllTime._sum.total || 0) / totalContacts) : 0
    
    // Calculate churn rate (simplified: based on inactive deals)
    const lostDeals = await prisma.deal.count({
      where: {
        tenantId: tenantId,
        stage: 'lost',
      },
    }).catch(() => 0)
    const churnRate = totalDeals > 0 ? ((lostDeals / totalDeals) * 100).toFixed(1) : '0.0'

    const kpiData = [
      { name: 'Conversion Rate', value: parseFloat(conversionRate), unit: '%' },
      { name: 'Churn Rate', value: parseFloat(churnRate), unit: '%' },
      { name: 'Avg Revenue/User', value: avgRevenuePerUser, unit: '₹' },
    ]

    const stats = {
      counts: {
        contacts,
        deals,
        orders,
        invoices,
        tasks,
      },
      revenue: {
        total: totalRevenue,
        last7Days: revenueLast7Days._sum.total || 0,
        last30Days: totalRevenue,
        last90Days: revenueLast90Days._sum.total || 0,
        allTime: revenueAllTime._sum.total || 0,
      },
      pipeline: {
        value: pipelineValue,
        activeDeals: activeDeals.length,
      },
      alerts: {
        overdueInvoices,
        pendingTasks,
      },
      recentActivity: {
        contacts: recentContacts,
        deals: recentDeals,
        orders: recentOrdersList,
      },
      charts: {
        salesTrend: salesTrendData,
        revenueTrend: revenueData,
        marketShare: marketShareData,
        kpis: kpiData,
      },
    }

    // Cache for 2 minutes (gracefully handle Redis errors)
    try {
      const cacheKey = `dashboard:stats:${tenantId}`
      await cache.set(cacheKey, stats, 120)
    } catch (cacheError) {
      console.warn('Failed to cache dashboard stats (Redis unavailable):', cacheError)
      // Continue - caching is optional
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    // Handle database errors - catch all Prisma error codes
    const prismaErrorCodes = ['P1000', 'P1001', 'P1002', 'P1003', 'P1008', 'P1009', 'P1010', 'P1011', 'P1012', 'P1013', 'P1014', 'P1015', 'P1016', 'P1017']
    const isDatabaseError = prismaErrorCodes.includes(error?.code) || 
                           error?.message?.toLowerCase().includes('connect') ||
                           error?.message?.toLowerCase().includes('database') ||
                           error?.message?.toLowerCase().includes('prisma') ||
                           error?.message?.toLowerCase().includes('enotfound') ||
                           error?.message?.toLowerCase().includes('econnrefused')
    
    if (isDatabaseError) {
      console.error('Database connection error:', {
        code: error?.code,
        message: error?.message,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      })
      
      let errorMessage = 'Database connection failed. Please check your DATABASE_URL configuration.'
      if (error?.code === 'P1001') {
        errorMessage = 'Database connection timeout. The database server may be down, paused, or unreachable.'
      } else if (error?.code === 'P1000') {
        errorMessage = 'Database authentication failed. Please check your DATABASE_URL credentials.'
      } else if (error?.code === 'P1002') {
        errorMessage = 'Database connection timeout. Try using a direct connection instead of a pooler.'
      } else if (error?.message?.includes('ENOTFOUND')) {
        errorMessage = 'Database hostname not found. The database server may be paused (Supabase free tier) or the hostname is incorrect.'
      } else if (error?.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Database connection refused. The database server may be down or not accepting connections.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          code: error?.code,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
        { status: 503 }
      )
    }
    
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get dashboard stats',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { cache } from '@/lib/redis/client'

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
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
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
    
    // Handle database errors
    if (error?.code === 'P1001' || error?.message?.includes('connect')) {
      console.error('Database connection error:', error)
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check your DATABASE_URL configuration.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

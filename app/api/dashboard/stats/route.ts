import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { cache } from '@/lib/redis/client'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check Analytics module license (dashboard stats are part of analytics)
    const { tenantId } = await requireModuleAccess(request, 'analytics')

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
        last30Days: totalRevenue,
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
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard stats' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/analytics/advanced/sales - Get advanced sales analytics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'month' // day, week, month, year

    const now = new Date()
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const start = startDate ? new Date(startDate) : defaultStart
    const end = endDate ? new Date(endDate) : defaultEnd

    // Get sales data
    const [invoices, orders, deals] = await Promise.all([
      // Paid invoices
      prisma.invoice.findMany({
        where: {
          tenantId,
          status: 'PAID',
          createdAt: { gte: start, lte: end },
        },
        select: {
          total: true,
          createdAt: true,
          customerName: true,
        },
      }),
      // Completed orders
      prisma.order.findMany({
        where: {
          tenantId,
          status: 'completed',
          createdAt: { gte: start, lte: end },
        },
        select: {
          total: true,
          createdAt: true,
        },
      }),
      // Won deals
      prisma.deal.findMany({
        where: {
          tenantId,
          stage: 'won',
          updatedAt: { gte: start, lte: end },
        },
        select: {
          value: true,
          updatedAt: true,
        },
      }),
    ])

    // Calculate totals
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const totalOrders = orders.length
    const totalDeals = deals.length
    const totalDealValue = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0)

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Group by period for trends
    const revenueByPeriod: Record<string, number> = {}
    const ordersByPeriod: Record<string, number> = {}

    invoices.forEach((inv) => {
      const key = getPeriodKey(inv.createdAt, period)
      revenueByPeriod[key] = (revenueByPeriod[key] || 0) + Number(inv.total || 0)
    })

    orders.forEach((order) => {
      const key = getPeriodKey(order.createdAt, period)
      ordersByPeriod[key] = (ordersByPeriod[key] || 0) + 1
    })

    // Get top customers
    const customerRevenue = new Map<string, number>()
    invoices.forEach((inv) => {
      if (inv.customerName) {
        customerRevenue.set(
          inv.customerName,
          (customerRevenue.get(inv.customerName) || 0) + Number(inv.total || 0)
        )
      }
    })

    const topCustomers = Array.from(customerRevenue.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate growth (compare with previous period)
    const prevStart = new Date(start)
    const prevEnd = new Date(end)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    prevStart.setDate(prevStart.getDate() - daysDiff)
    prevEnd.setTime(start.getTime())

    const prevInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        createdAt: { gte: prevStart, lte: prevEnd },
      },
      select: { total: true },
    })

    const prevRevenue = prevInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        totalDeals,
        totalDealValue,
        avgOrderValue,
        revenueGrowth,
      },
      trends: {
        revenue: Object.entries(revenueByPeriod).map(([period, value]) => ({ period, value })),
        orders: Object.entries(ordersByPeriod).map(([period, count]) => ({ period, count })),
      },
      topCustomers,
      period,
      dateRange: { start, end },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get sales analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get sales analytics' },
      { status: 500 }
    )
  }
}

function getPeriodKey(date: Date, period: string): string {
  if (period === 'day') {
    return date.toISOString().split('T')[0]
  } else if (period === 'week') {
    const week = getWeekNumber(date)
    return `${date.getFullYear()}-W${week}`
  } else if (period === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  } else {
    return String(date.getFullYear())
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}


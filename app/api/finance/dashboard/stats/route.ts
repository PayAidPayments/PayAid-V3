import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/finance/dashboard/stats - Get Finance dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    // Get current date for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch all data in parallel
    const [
      totalInvoices,
      invoicesThisMonth,
      invoicesLastMonth,
      paidInvoices,
      overdueInvoices,
      pendingInvoices,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      totalExpenses,
      expensesThisMonth,
      purchaseOrders,
      purchaseOrdersThisMonth,
      gstReports,
      recentInvoices,
      recentPurchaseOrders,
    ] = await Promise.all([
      // Total invoices
      prisma.invoice.count({
        where: { tenantId },
      }).catch(() => 0),
      
      // Invoices this month
      prisma.invoice.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }).catch(() => 0),
      
      // Invoices last month
      prisma.invoice.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }).catch(() => 0),
      
      // Paid invoices
      prisma.invoice.count({
        where: {
          tenantId,
          status: 'paid',
        },
      }).catch(() => 0),
      
      // Overdue invoices
      prisma.invoice.count({
        where: {
          tenantId,
          status: 'overdue',
        },
      }).catch(() => 0),
      
      // Pending invoices
      prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['draft', 'sent'] },
        },
      }).catch(() => 0),
      
      // Total revenue (all paid invoices)
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'paid',
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      
      // Revenue this month
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'paid',
          paidAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      
      // Revenue last month
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'paid',
          paidAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      
      // Total expenses (from accounting expenses)
      prisma.expense.aggregate({
        where: {
          tenantId,
          status: { in: ['approved', 'paid'] },
        },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } })),
      
      // Expenses this month
      prisma.expense.aggregate({
        where: {
          tenantId,
          status: { in: ['approved', 'paid'] },
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } })),
      
      // Purchase orders
      prisma.purchaseOrder.count({
        where: { tenantId },
      }).catch(() => 0),
      
      // Purchase orders this month
      prisma.purchaseOrder.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }).catch(() => 0),
      
      // GST reports (count of GST filings)
      prisma.report.count({
        where: { 
          tenantId,
          type: 'gst',
        },
      }).catch(() => 0),
      
      // Recent invoices (last 5)
      prisma.invoice.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }).catch(() => []),
      
      // Recent purchase orders (last 5)
      prisma.purchaseOrder.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          poNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }).catch(() => []),
    ])

    // Calculate growth percentages
    const invoiceGrowth = invoicesLastMonth > 0 
      ? ((invoicesThisMonth - invoicesLastMonth) / invoicesLastMonth) * 100 
      : invoicesThisMonth > 0 ? 100 : 0
    
    const revenueThisMonthNum = Number(revenueThisMonth._sum.total || 0)
    const revenueLastMonthNum = Number(revenueLastMonth._sum.total || 0)
    const revenueGrowth = revenueLastMonthNum > 0
      ? ((revenueThisMonthNum - revenueLastMonthNum) / revenueLastMonthNum) * 100
      : revenueThisMonthNum > 0 ? 100 : 0

    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
      SELECT 
        TO_CHAR("paidAt", 'Mon YYYY') as month,
        COALESCE(SUM("total"), 0)::float as revenue
      FROM "Invoice"
      WHERE "tenantId" = ${tenantId}
        AND "status" = 'paid'
        AND "paidAt" IS NOT NULL
        AND "paidAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("paidAt", 'Mon YYYY')
      ORDER BY MIN("paidAt") ASC
    `.catch(() => [])

    // Invoices by status
    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
      _sum: { total: true },
    }).catch(() => [])

    // Calculate profit (revenue - expenses)
    const revenueThisMonthValue = Number(revenueThisMonth._sum.total || 0)
    const expensesThisMonthValue = Number(expensesThisMonth._sum.amount || 0)
    const profit = revenueThisMonthValue - expensesThisMonthValue
    const profitMargin = revenueThisMonthValue > 0
      ? (profit / revenueThisMonthValue) * 100
      : 0

    return NextResponse.json({
      totalInvoices,
      invoicesThisMonth,
      invoicesLastMonth,
      invoiceGrowth: Math.round(invoiceGrowth * 10) / 10,
      paidInvoices,
      overdueInvoices,
      pendingInvoices,
      totalRevenue: totalRevenue._sum.total || 0,
      revenueThisMonth: revenueThisMonth._sum.total || 0,
      revenueLastMonth: revenueLastMonth._sum.total || 0,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      totalExpenses: totalExpenses._sum.amount || 0,
      expensesThisMonth: expensesThisMonth._sum.amount || 0,
      profit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      purchaseOrders,
      purchaseOrdersThisMonth,
      gstReports,
      recentInvoices,
      recentPurchaseOrders,
      monthlyRevenue: monthlyRevenue.map((r: any) => ({
        month: r.month,
        revenue: Number(r.revenue) || 0,
      })),
      invoicesByStatus: invoicesByStatus.map((i: any) => ({
        status: i.status,
        count: i._count.id || 0,
        total: Number(i._sum.total) || 0,
      })),
    })
  } catch (error: any) {
    console.error('Finance dashboard stats error:', error)
    
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch finance dashboard stats', message: error?.message },
      { status: 500 }
    )
  }
}


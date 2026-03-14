import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/analytics/advanced/financial - Get financial analytics (P&L, cashflow)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'month'

    const now = new Date()
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const start = startDate ? new Date(startDate) : defaultStart
    const end = endDate ? new Date(endDate) : defaultEnd

    // Get revenue (paid invoices)
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        createdAt: { gte: start, lte: end },
      },
      select: {
        total: true,
        tax: true,
        discount: true,
        createdAt: true,
      },
    })

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId,
        date: { gte: start, lte: end },
      },
      select: {
        amount: true,
        category: true,
        date: true,
      },
    })

    // Get purchase orders (cost of goods)
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'RECEIVED'] },
        orderDate: { gte: start, lte: end },
      },
      select: {
        total: true,
        orderDate: true,
      },
    })

    // Calculate revenue
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const totalTax = invoices.reduce((sum, inv) => sum + Number(inv.tax || 0), 0)
    const totalDiscount = invoices.reduce((sum, inv) => sum + Number(inv.discount || 0), 0)
    const netRevenue = totalRevenue - totalDiscount

    // Calculate expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
    const totalCOGS = purchaseOrders.reduce((sum, po) => sum + Number(po.total || 0), 0)
    const totalCosts = totalExpenses + totalCOGS

    // Calculate profit
    const grossProfit = netRevenue - totalCOGS
    const netProfit = grossProfit - totalExpenses
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

    // Group by period for trends
    const revenueByPeriod: Record<string, number> = {}
    const expensesByPeriod: Record<string, number> = {}
    const profitByPeriod: Record<string, number> = {}

    invoices.forEach((inv) => {
      const key = getPeriodKey(inv.createdAt, period)
      revenueByPeriod[key] = (revenueByPeriod[key] || 0) + Number(inv.total || 0)
    })

    expenses.forEach((exp) => {
      const key = getPeriodKey(exp.date, period)
      expensesByPeriod[key] = (expensesByPeriod[key] || 0) + Number(exp.amount || 0)
    })

    // Calculate profit by period
    Object.keys(revenueByPeriod).forEach((key) => {
      profitByPeriod[key] = revenueByPeriod[key] - (expensesByPeriod[key] || 0)
    })

    // Expense breakdown by category
    const expensesByCategory: Record<string, number> = {}
    expenses.forEach((exp) => {
      const category = exp.category || 'Uncategorized'
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(exp.amount || 0)
    })

    // Cashflow (simplified - revenue minus expenses)
    const cashflow = netRevenue - totalCosts

    // Get previous period for comparison
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

    const prevExpenses = await prisma.expense.findMany({
      where: {
        tenantId,
        date: { gte: prevStart, lte: prevEnd },
      },
      select: { amount: true },
    })

    const prevRevenue = prevInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const prevTotalExpenses = prevExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
    const prevProfit = prevRevenue - prevTotalExpenses

    const revenueGrowth = prevRevenue > 0 ? ((netRevenue - prevRevenue) / prevRevenue) * 100 : 0
    const profitGrowth = prevProfit !== 0 ? ((netProfit - prevProfit) / Math.abs(prevProfit)) * 100 : 0

    return NextResponse.json({
      pnl: {
        revenue: {
          total: totalRevenue,
          net: netRevenue,
          tax: totalTax,
          discount: totalDiscount,
        },
        costs: {
          total: totalCosts,
          cogs: totalCOGS,
          expenses: totalExpenses,
        },
        profit: {
          gross: grossProfit,
          net: netProfit,
          margin: profitMargin,
        },
      },
      cashflow: {
        inflow: netRevenue,
        outflow: totalCosts,
        net: cashflow,
      },
      trends: {
        revenue: Object.entries(revenueByPeriod).map(([period, value]) => ({ period, value })),
        expenses: Object.entries(expensesByPeriod).map(([period, value]) => ({ period, value })),
        profit: Object.entries(profitByPeriod).map(([period, value]) => ({ period, value })),
      },
      expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount,
      })),
      growth: {
        revenue: revenueGrowth,
        profit: profitGrowth,
      },
      period,
      dateRange: { start, end },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get financial analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get financial analytics' },
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


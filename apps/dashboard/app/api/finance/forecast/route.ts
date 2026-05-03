import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/finance/forecast
 * Get financial forecast data (revenue, expenses, budget)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const now = new Date()
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Get historical revenue (last 6 months)
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'paid',
        paidAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        total: true,
        paidAt: true,
      },
    })

    // Group by month
    const monthlyRevenue: Record<string, number> = {}
    invoices.forEach(invoice => {
      if (invoice.paidAt) {
        const month = invoice.paidAt.toISOString().substring(0, 7)
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(invoice.total)
      }
    })

    // Generate forecast (next 12 months)
    const forecast = []
    const last6Months = Object.values(monthlyRevenue)
    const avgRevenue = last6Months.reduce((sum, val) => sum + val, 0) / (last6Months.length || 1)
    const growthRate = 0.05 // 5% growth assumption

    for (let i = 0; i < 12; i++) {
      const forecastDate = new Date(now)
      forecastDate.setMonth(forecastDate.getMonth() + i)
      const month = forecastDate.toISOString().substring(0, 7)
      
      const baseForecast = avgRevenue * (1 + growthRate * i)
      forecast.push({
        month: forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        actual: monthlyRevenue[month] || null,
        forecast: baseForecast,
        best: baseForecast * 1.2, // 20% above base
        worst: baseForecast * 0.8, // 20% below base
      })
    }

    // Budget vs Actual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentRevenue = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: 'paid',
        paidAt: {
          gte: startOfMonth,
        },
      },
      _sum: { total: true },
    })

    const currentExpenses = await prisma.expense.aggregate({
      where: {
        tenantId,
        status: { in: ['approved', 'paid'] },
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: { amount: true },
    })

    // Mock budget values
    const budget = {
      revenue: 2000000,
      costOfGoods: 800000,
      operatingExpenses: 500000,
      marketing: 200000,
      admin: 150000,
    }

    const actual = {
      revenue: Number(currentRevenue._sum.total || 0),
      costOfGoods: Number(currentExpenses._sum.amount || 0) * 0.4,
      operatingExpenses: Number(currentExpenses._sum.amount || 0) * 0.3,
      marketing: Number(currentExpenses._sum.amount || 0) * 0.15,
      admin: Number(currentExpenses._sum.amount || 0) * 0.15,
    }

    const budgetVsActual = [
      {
        category: 'Revenue',
        budget: budget.revenue,
        actual: actual.revenue,
        variance: ((actual.revenue - budget.revenue) / budget.revenue) * 100,
      },
      {
        category: 'Cost of Goods',
        budget: budget.costOfGoods,
        actual: actual.costOfGoods,
        variance: ((actual.costOfGoods - budget.costOfGoods) / budget.costOfGoods) * 100,
      },
      {
        category: 'Operating Expenses',
        budget: budget.operatingExpenses,
        actual: actual.operatingExpenses,
        variance: ((actual.operatingExpenses - budget.operatingExpenses) / budget.operatingExpenses) * 100,
      },
      {
        category: 'Marketing',
        budget: budget.marketing,
        actual: actual.marketing,
        variance: ((actual.marketing - budget.marketing) / budget.marketing) * 100,
      },
      {
        category: 'Admin',
        budget: budget.admin,
        actual: actual.admin,
        variance: ((actual.admin - budget.admin) / budget.admin) * 100,
      },
    ]

    // Financial Health Score (0-100)
    const revenueGrowth = last6Months.length >= 2 
      ? ((last6Months[last6Months.length - 1] - last6Months[last6Months.length - 2]) / last6Months[last6Months.length - 2]) * 100
      : 0
    
    const profitMargin = actual.revenue > 0
      ? ((actual.revenue - actual.costOfGoods - actual.operatingExpenses) / actual.revenue) * 100
      : 0

    const budgetAdherence = budgetVsActual.reduce((sum, item) => sum + Math.abs(item.variance), 0) / budgetVsActual.length
    const budgetScore = Math.max(0, 100 - budgetAdherence)

    const healthScore = Math.round(
      (Math.min(100, Math.max(0, revenueGrowth + 50)) * 0.3) + // Revenue growth component
      (Math.min(100, profitMargin * 4) * 0.4) + // Profit margin component
      (budgetScore * 0.3) // Budget adherence component
    )

    return NextResponse.json({
      forecast,
      budgetVsActual,
      financialHealthScore: healthScore,
      metrics: {
        revenueGrowth: revenueGrowth.toFixed(1),
        profitMargin: profitMargin.toFixed(1),
      },
    })
  } catch (error: any) {
    console.error('Financial forecast API error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch forecast data', message: error?.message },
      { status: 500 }
    )
  }
}

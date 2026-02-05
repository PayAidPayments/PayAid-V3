import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/finance/cash-flow
 * Get cash flow data including current position, forecast, and calendar
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get current cash position (from bank accounts and cash)
    // Handle case where chart_of_accounts table doesn't exist yet
    let bankAccounts: any[] = []
    try {
      bankAccounts = await prisma.chartOfAccounts.findMany({
        where: {
          tenantId,
          accountType: 'asset',
          subType: 'cash',
          isActive: true,
        },
      })
    } catch (error: any) {
      // If table doesn't exist (P2021), return empty array and continue
      if (error?.code === 'P2021') {
        console.warn('[CASH_FLOW] chart_of_accounts table does not exist. Returning default values.')
        bankAccounts = []
      } else {
        throw error
      }
    }

    // Calculate current cash (simplified - should use actual transaction balances)
    const currentCash = 2500000 // Mock value - should calculate from transactions

    // Get cash flow data (last 6 months)
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Get invoices (inflows)
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

    // Get expenses (outflows)
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId,
        status: { in: ['approved', 'paid'] },
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    })

    // Group by month
    const monthlyData: Record<string, { inflow: number; outflow: number }> = {}
    
    invoices.forEach(invoice => {
      if (invoice.paidAt) {
        const month = invoice.paidAt.toISOString().substring(0, 7)
        if (!monthlyData[month]) {
          monthlyData[month] = { inflow: 0, outflow: 0 }
        }
        monthlyData[month].inflow += Number(invoice.total)
      }
    })

    expenses.forEach(expense => {
      const month = expense.createdAt.toISOString().substring(0, 7)
      if (!monthlyData[month]) {
        monthlyData[month] = { inflow: 0, outflow: 0 }
      }
      monthlyData[month].outflow += Number(expense.amount)
    })

    // Calculate working capital
    const currentAssets = await prisma.financialTransaction.aggregate({
      where: {
        tenantId,
        transactionType: 'income',
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amountInBaseCurrency: true },
    }).catch(() => ({ _sum: { amountInBaseCurrency: 0 } }))

    const currentLiabilities = await prisma.financialTransaction.aggregate({
      where: {
        tenantId,
        transactionType: 'expense',
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amountInBaseCurrency: true },
    }).catch(() => ({ _sum: { amountInBaseCurrency: 0 } }))

    const workingCapital = Number(currentAssets._sum.amountInBaseCurrency || 0) - 
                          Number(currentLiabilities._sum.amountInBaseCurrency || 0)

    // Cash Conversion Cycle (simplified calculation)
    const ccc = {
      dio: 45, // Days Inventory Outstanding
      dso: 30, // Days Sales Outstanding
      dpo: 20, // Days Payable Outstanding
      ccc: 55, // CCC = DIO + DSO - DPO
    }

    // Cash flow forecast (next 30 days)
    const forecastData = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      forecastData.push({
        date: date.toISOString().substring(0, 10),
        forecast: currentCash + (i * 10000), // Simplified forecast
      })
    }

    // Upcoming cash flow calendar
    const upcomingInflows = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['sent', 'pending'] },
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        invoiceNumber: true,
        total: true,
        dueDate: true,
      },
      take: 10,
    })

    const upcomingOutflows = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        status: { in: ['approved', 'pending'] },
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        poNumber: true,
        total: true,
        dueDate: true,
      },
      take: 10,
    })

    return NextResponse.json({
      currentCash,
      workingCapital: {
        currentAssets: Number(currentAssets._sum.amountInBaseCurrency || 0),
        currentLiabilities: Number(currentLiabilities._sum.amountInBaseCurrency || 0),
        workingCapital,
        ratio: Number(currentAssets._sum.amountInBaseCurrency || 0) / 
               (Number(currentLiabilities._sum.amountInBaseCurrency || 0) || 1),
      },
      ccc,
      monthlyCashFlow: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        inflow: data.inflow,
        outflow: data.outflow,
        net: data.inflow - data.outflow,
      })),
      forecast: forecastData,
      calendar: {
        inflows: upcomingInflows.map(inv => ({
          id: inv.invoiceNumber,
          description: `Invoice Payment - ${inv.invoiceNumber}`,
          date: inv.dueDate,
          amount: Number(inv.total),
          type: 'inflow',
        })),
        outflows: upcomingOutflows.map(po => ({
          id: po.poNumber,
          description: `Vendor Payment - ${po.poNumber}`,
          date: po.dueDate,
          amount: Number(po.total),
          type: 'outflow',
        })),
      },
    })
  } catch (error: any) {
    console.error('Cash flow API error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch cash flow data', message: error?.message },
      { status: 500 }
    )
  }
}

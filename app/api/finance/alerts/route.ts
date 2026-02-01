import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/finance/alerts
 * Get financial alerts (low cash, overdue, budget variance, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const alerts: any[] = []

    // Low cash alert
    const cashFlow = await fetch(`${request.nextUrl.origin}/api/finance/cash-flow`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    }).then(res => res.json()).catch(() => ({ currentCash: 0 }))

    if (cashFlow.currentCash < 1000000) {
      alerts.push({
        id: 'low-cash',
        type: 'low-cash',
        title: 'Low Cash Alert',
        message: `Cash balance is below ₹10,00,000 threshold`,
        severity: 'critical',
        timestamp: now,
        actionUrl: `/finance/${tenantId}/cash-flow`,
      })
    }

    // Overdue invoices alert
    const overdueCount = await prisma.invoice.count({
      where: {
        tenantId,
        status: { in: ['sent', 'pending'] },
        dueDate: {
          lt: now,
        },
      },
    })

    if (overdueCount > 0) {
      const overdueTotal = await prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['sent', 'pending'] },
          dueDate: {
            lt: now,
          },
        },
        _sum: { total: true },
      })

      alerts.push({
        id: 'overdue',
        type: 'overdue',
        title: 'Overdue Invoices',
        message: `${overdueCount} invoices totaling ₹${Number(overdueTotal._sum.total || 0).toLocaleString()} are overdue`,
        severity: 'warning',
        timestamp: new Date(now.getTime() - 3600000),
        actionUrl: `/finance/${tenantId}/Invoices?status=overdue`,
      })
    }

    // GST filing reminder
    const gstDueDate = new Date(now.getFullYear(), now.getMonth(), 20)
    const daysUntilGST = Math.floor((gstDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilGST <= 3 && daysUntilGST >= 0) {
      alerts.push({
        id: 'gst-filing',
        type: 'gst-filing',
        title: 'GST Filing Reminder',
        message: `GSTR-3B filing due in ${daysUntilGST} days`,
        severity: 'info',
        timestamp: new Date(now.getTime() - 10800000),
        actionUrl: `/finance/${tenantId}/GST`,
      })
    }

    // Budget variance alert (simplified)
    const revenue = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: 'paid',
        paidAt: {
          gte: startOfMonth,
        },
      },
      _sum: { total: true },
    })

    const expenses = await prisma.expense.aggregate({
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
    const budgetRevenue = 2000000
    const budgetExpenses = 500000
    const actualRevenue = Number(revenue._sum.total || 0)
    const actualExpenses = Number(expenses._sum.amount || 0)

    const revenueVariance = ((actualRevenue - budgetRevenue) / budgetRevenue) * 100
    const expenseVariance = ((actualExpenses - budgetExpenses) / budgetExpenses) * 100

    if (expenseVariance > 15) {
      alerts.push({
        id: 'budget-variance',
        type: 'budget-variance',
        title: 'Budget Variance Alert',
        message: `Expenses exceed budget by ${expenseVariance.toFixed(1)}% this month`,
        severity: 'warning',
        timestamp: new Date(now.getTime() - 7200000),
        actionUrl: `/finance/${tenantId}/budget`,
      })
    }

    return NextResponse.json({ alerts })
  } catch (error: any) {
    console.error('Financial alerts API error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch financial alerts', message: error?.message },
      { status: 500 }
    )
  }
}

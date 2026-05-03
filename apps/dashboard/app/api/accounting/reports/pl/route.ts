import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/accounting/reports/pl - Get Profit & Loss statement (invoices + Expense table + revenue/expense accounts)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate) : new Date()
    end.setHours(23, 59, 59, 999)

    // Revenue: paid invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'paid',
        paidAt: { gte: start, lte: end },
      },
      select: { total: true },
    })
    const revenueFromInvoices = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)

    // Revenue from ledger (credit to revenue accounts)
    const revenueAccountIds = await prisma.chartOfAccounts.findMany({
      where: { tenantId, isActive: true, accountType: 'revenue' },
      select: { id: true },
    }).then((r) => r.map((a) => a.id))
    let revenueFromLedger = 0
    if (revenueAccountIds.length > 0) {
      const credits = await prisma.financialTransaction.groupBy({
        by: ['creditAccountId'],
        where: {
          tenantId,
          transactionDate: { gte: start, lte: end },
          creditAccountId: { in: revenueAccountIds },
        },
        _sum: { amount: true },
      })
      revenueFromLedger = credits.reduce((s, c) => s + Number(c._sum.amount ?? 0), 0)
    }
    const totalRevenue = Math.round((revenueFromInvoices + revenueFromLedger) * 100) / 100

    // Expenses: Expense table (approved/paid in period)
    const expenseRecords = await prisma.expense.findMany({
      where: {
        tenantId,
        date: { gte: start, lte: end },
        status: { in: ['approved', 'reimbursed', 'paid'] },
      },
      select: { amount: true, category: true },
    })
    const expensesByCategory: Record<string, number> = {}
    let totalExpensesFromTable = 0
    for (const e of expenseRecords) {
      const amt = Number(e.amount)
      totalExpensesFromTable += amt
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + amt
    }

    // Expenses from ledger (debit to expense accounts)
    const expenseAccountIds = await prisma.chartOfAccounts.findMany({
      where: { tenantId, isActive: true, accountType: 'expense' },
      select: { id: true },
    }).then((r) => r.map((a) => a.id))
    let expensesFromLedger = 0
    if (expenseAccountIds.length > 0) {
      const debits = await prisma.financialTransaction.groupBy({
        by: ['debitAccountId'],
        where: {
          tenantId,
          transactionDate: { gte: start, lte: end },
          debitAccountId: { in: expenseAccountIds },
        },
        _sum: { amount: true },
      })
      expensesFromLedger = debits.reduce((s, d) => s + Number(d._sum.amount ?? 0), 0)
    }
    const totalExpenses = Math.round((totalExpensesFromTable + expensesFromLedger) * 100) / 100

    const grossProfit = totalRevenue - totalExpenses
    const netProfit = grossProfit

    return NextResponse.json({
      period: { start: start.toISOString(), end: end.toISOString() },
      revenue: {
        total: totalRevenue,
        breakdown: {
          invoices: Math.round(revenueFromInvoices * 100) / 100,
          ledger: Math.round(revenueFromLedger * 100) / 100,
        },
      },
      expenses: {
        total: totalExpenses,
        breakdown: {
          expenseTable: Math.round(totalExpensesFromTable * 100) / 100,
          byCategory: expensesByCategory,
          ledger: Math.round(expensesFromLedger * 100) / 100,
        },
      },
      grossProfit,
      netProfit,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get P&L error:', error)
    return NextResponse.json(
      { error: 'Failed to generate P&L statement' },
      { status: 500 }
    )
  }
}


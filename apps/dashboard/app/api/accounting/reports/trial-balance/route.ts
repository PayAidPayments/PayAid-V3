/**
 * GET /api/accounting/reports/trial-balance
 * Trial balance: all accounts with debit and credit totals as of date (from ChartOfAccounts + FinancialTransaction).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const searchParams = request.nextUrl.searchParams
    const asOfDate = searchParams.get('asOfDate')
    const asOf = asOfDate ? new Date(asOfDate) : new Date()
    asOf.setHours(23, 59, 59, 999)

    const accounts = await prisma.chartOfAccounts.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ accountType: 'asc' }, { accountCode: 'asc' }],
      select: { id: true, accountCode: true, accountName: true, accountType: true, openingBalance: true },
    })

    const accountIds = accounts.map((a) => a.id)

    const [debitSums, creditSums] = await Promise.all([
      prisma.financialTransaction.groupBy({
        by: ['debitAccountId'],
        where: {
          tenantId,
          transactionDate: { lte: asOf },
          debitAccountId: { in: accountIds },
        },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.groupBy({
        by: ['creditAccountId'],
        where: {
          tenantId,
          transactionDate: { lte: asOf },
          creditAccountId: { in: accountIds },
        },
        _sum: { amount: true },
      }),
    ])

    const debitByAccount = new Map(debitSums.map((d) => [d.debitAccountId, Number(d._sum.amount ?? 0)]))
    const creditByAccount = new Map(creditSums.map((c) => [c.creditAccountId, Number(c._sum.amount ?? 0)]))

    const rows: {
      accountCode: string
      accountName: string
      accountType: string
      debit: number
      credit: number
    }[] = []

    let totalDebit = 0
    let totalCredit = 0

    for (const acc of accounts) {
      const opening = Number(acc.openingBalance)
      const debitMovements = debitByAccount.get(acc.id) ?? 0
      const creditMovements = creditByAccount.get(acc.id) ?? 0
      const totalDebitsToAccount = (opening > 0 ? opening : 0) + debitMovements
      const totalCreditsToAccount = (opening < 0 ? Math.abs(opening) : 0) + creditMovements
      const balance = Math.round((totalDebitsToAccount - totalCreditsToAccount) * 100) / 100
      const debit = balance > 0 ? balance : 0
      const credit = balance < 0 ? Math.abs(balance) : 0
      totalDebit += debit
      totalCredit += credit
      if (debit !== 0 || credit !== 0) {
        rows.push({
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          accountType: acc.accountType,
          debit,
          credit,
        })
      }
    }

    return NextResponse.json({
      asOf: asOf.toISOString(),
      rows,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.02,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Trial balance error:', error)
    return NextResponse.json(
      { error: 'Failed to generate trial balance' },
      { status: 500 }
    )
  }
}

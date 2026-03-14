import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/accounting/reports/balance-sheet - From ChartOfAccounts + FinancialTransaction by accountType
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const searchParams = request.nextUrl.searchParams
    const asOfDate = searchParams.get('asOfDate')
    const asOf = asOfDate ? new Date(asOfDate) : new Date()
    asOf.setHours(23, 59, 59, 999)

    const accounts = await prisma.chartOfAccounts.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, accountCode: true, accountName: true, accountType: true, openingBalance: true },
    })
    const accountIds = accounts.map((a) => a.id)

    const [debitSums, creditSums] = await Promise.all([
      prisma.financialTransaction.groupBy({
        by: ['debitAccountId'],
        where: { tenantId, transactionDate: { lte: asOf }, debitAccountId: { in: accountIds } },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.groupBy({
        by: ['creditAccountId'],
        where: { tenantId, transactionDate: { lte: asOf }, creditAccountId: { in: accountIds } },
        _sum: { amount: true },
      }),
    ])
    const debitByAccount = new Map(debitSums.map((d) => [d.debitAccountId, Number(d._sum.amount ?? 0)]))
    const creditByAccount = new Map(creditSums.map((c) => [c.creditAccountId, Number(c._sum.amount ?? 0)]))

    const byType: Record<string, number> = {}
    for (const acc of accounts) {
      const opening = Number(acc.openingBalance)
      const totalDebitsToAccount = (opening > 0 ? opening : 0) + (debitByAccount.get(acc.id) ?? 0)
      const totalCreditsToAccount = (opening < 0 ? Math.abs(opening) : 0) + (creditByAccount.get(acc.id) ?? 0)
      const balance = Math.round((totalDebitsToAccount - totalCreditsToAccount) * 100) / 100
      if (balance !== 0) {
        byType[acc.accountType] = (byType[acc.accountType] ?? 0) + balance
      }
    }

    const totalAssets = byType.asset ?? 0
    const totalLiabilities = Math.abs(byType.liability ?? 0)
    const totalEquity = byType.equity != null ? (byType.equity > 0 ? byType.equity : Math.abs(byType.equity)) : 0

    return NextResponse.json({
      asOf: asOf.toISOString(),
      byType,
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalEquity,
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        equity: totalEquity,
        balance: totalAssets - totalLiabilities - totalEquity,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get balance sheet error:', error)
    return NextResponse.json(
      { error: 'Failed to generate balance sheet' },
      { status: 500 }
    )
  }
}


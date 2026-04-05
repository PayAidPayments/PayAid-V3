/**
 * Finance Bank Reconciliation API
 * GET /api/finance/bank-reconcile - List transactions for reconciliation (optionally filter by reconciled)
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const reconciled = searchParams.get('reconciled') // 'true' | 'false' | omit = all
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)

    const bankAccountsList = await prisma.chartOfAccounts.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { subType: { equals: 'bank', mode: 'insensitive' } },
          { accountName: { contains: 'bank', mode: 'insensitive' } },
        ],
      },
      select: { id: true, accountCode: true, accountName: true },
    })
    const bankAccountIds = bankAccountsList.map((a) => a.id)

    const where: Prisma.FinancialTransactionWhereInput = { tenantId }
    if (bankAccountIds.length > 0) {
      where.OR = [
        { debitAccountId: { in: bankAccountIds } },
        { creditAccountId: { in: bankAccountIds } },
      ]
    }
    if (reconciled === 'true') where.isReconciled = true
    else if (reconciled === 'false') where.isReconciled = false

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: {
        debitAccount: { select: { id: true, accountCode: true, accountName: true, accountType: true } },
        creditAccount: { select: { id: true, accountCode: true, accountName: true, accountType: true } },
      },
      orderBy: { transactionDate: 'desc' },
      take: limit,
    })

    const list = transactions.map((t) => ({
      id: t.id,
      transactionDate: t.transactionDate,
      transactionType: t.transactionType,
      sourceModule: t.sourceModule,
      sourceId: t.sourceId,
      amount: Number(t.amount),
      description: t.description,
      referenceNumber: t.referenceNumber,
      isReconciled: t.isReconciled,
      reconciledDate: t.reconciledDate,
      bankStatementDate: t.bankStatementDate,
      debitAccount: t.debitAccount,
      creditAccount: t.creditAccount,
    }))

    const unreconciledCount = bankAccountIds.length > 0
      ? await prisma.financialTransaction.count({
          where: {
            ...where,
            isReconciled: false,
          },
        })
      : 0
    const reconciledCount = bankAccountIds.length > 0
      ? await prisma.financialTransaction.count({
          where: { ...where, isReconciled: true },
        })
      : 0

    return NextResponse.json({
      transactions: list,
      summary: { unreconciledCount, reconciledCount, bankAccountsCount: bankAccountIds.length },
      bankAccounts: bankAccountsList.map((a) => ({ id: a.id, name: `${a.accountCode} – ${a.accountName}` })),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

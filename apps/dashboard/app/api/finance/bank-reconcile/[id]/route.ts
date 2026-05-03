/**
 * PATCH /api/finance/bank-reconcile/[id] - Mark transaction as reconciled
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json().catch(() => ({}))
    const bankStatementDate = body.bankStatementDate ? new Date(body.bankStatementDate) : new Date()

    const updated = await prisma.financialTransaction.updateMany({
      where: { id: id, tenantId },
      data: {
        isReconciled: true,
        reconciledDate: new Date(),
        bankStatementDate,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const t = await prisma.financialTransaction.findFirst({
      where: { id: id, tenantId },
      include: {
        debitAccount: { select: { accountCode: true, accountName: true } },
        creditAccount: { select: { accountCode: true, accountName: true } },
      },
    })

    return NextResponse.json({
      success: true,
      transaction: t
        ? {
            id: t.id,
            transactionDate: t.transactionDate,
            amount: Number(t.amount),
            isReconciled: t.isReconciled,
            reconciledDate: t.reconciledDate,
            bankStatementDate: t.bankStatementDate,
            debitAccount: t.debitAccount,
            creditAccount: t.creditAccount,
          }
        : null,
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

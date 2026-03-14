/**
 * PATCH /api/finance/bank-reconcile/statement-lines/[lineId]
 * Match: body { transactionId } - link statement line to ledger tx and mark tx reconciled.
 * Unmatch: body { unmatch: true } - clear link and unmark transaction.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { lineId } = await params
    const body = await request.json().catch(() => ({}))
    const transactionId = body.transactionId as string | undefined
    const unmatch = body.unmatch === true

    const line = await prisma.bankStatementLine.findFirst({
      where: { id: lineId, import: { tenantId } },
      include: { import: { select: { bankAccountId: true } } },
    })
    if (!line) {
      return NextResponse.json({ error: 'Statement line not found' }, { status: 404 })
    }

    if (unmatch) {
      const previousTxId = line.matchedTransactionId
      await prisma.$transaction([
        prisma.bankStatementLine.update({
          where: { id: lineId },
          data: { matchedTransactionId: null },
        }),
        ...(previousTxId
          ? [
              prisma.financialTransaction.updateMany({
                where: { id: previousTxId, tenantId },
                data: { isReconciled: false, reconciledDate: null, bankStatementDate: null },
              }),
            ]
          : []),
      ])
      return NextResponse.json({
        success: true,
        matchedTransactionId: null,
        message: 'Unmatched.',
      })
    }

    if (!transactionId) {
      return NextResponse.json({ error: 'Provide transactionId to match, or unmatch: true.' }, { status: 400 })
    }

    const tx = await prisma.financialTransaction.findFirst({
      where: { id: transactionId, tenantId },
      include: {
        debitAccount: { select: { id: true } },
        creditAccount: { select: { id: true } },
      },
    })
    if (!tx) {
      return NextResponse.json({ error: 'Ledger transaction not found' }, { status: 404 })
    }

    const bankAccountId = line.import.bankAccountId
    const txInvolvesBank =
      tx.debitAccount.id === bankAccountId || tx.creditAccount.id === bankAccountId
    if (!txInvolvesBank) {
      return NextResponse.json(
        { error: 'Transaction does not involve the same bank account as this statement.' },
        { status: 400 }
      )
    }

    const confirmAmountMismatch = body.confirmAmountMismatch === true
    const statementAmount = Number(line.debitAmount) > 0 ? Number(line.debitAmount) : Number(line.creditAmount)
    const txAmount = Math.abs(Number(tx.amount))
    if (!confirmAmountMismatch && Math.abs(statementAmount - txAmount) > 0.02) {
      return NextResponse.json(
        { error: `Amount mismatch: statement ${statementAmount}, ledger ${txAmount}. Send confirmAmountMismatch: true to match anyway.`, allowConfirm: true },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.bankStatementLine.update({
        where: { id: lineId },
        data: { matchedTransactionId: transactionId },
      }),
      prisma.financialTransaction.updateMany({
        where: { id: transactionId, tenantId },
        data: {
          isReconciled: true,
          reconciledDate: new Date(),
          bankStatementDate: line.transactionDate,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      matchedTransactionId: transactionId,
      message: 'Matched and marked reconciled.',
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

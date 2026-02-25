/**
 * POST /api/finance/journal-entries/[id]/reverse
 * Create a reversing journal entry (swap debit/credit, same amount)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { id } = await params

    const original = await prisma.financialTransaction.findFirst({
      where: { id, tenantId, transactionType: 'journal' },
      include: {
        debitAccount: { select: { id: true, accountCode: true, accountName: true } },
        creditAccount: { select: { id: true, accountCode: true, accountName: true } },
      },
    })

    if (!original) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    const amount = Number(original.amount)
    const transactionDate = new Date()
    const year = transactionDate.getFullYear()
    const count = await prisma.financialTransaction.count({
      where: { tenantId, transactionType: 'journal' },
    })
    const transactionCode = `JE-${year}-${String(count + 1).padStart(4, '0')}`

    const reversal = await prisma.financialTransaction.create({
      data: {
        tenantId,
        transactionDate,
        transactionType: 'journal',
        transactionCode,
        sourceModule: 'manual',
        amount: original.amount,
        amountInBaseCurrency: original.amountInBaseCurrency,
        description: `Reversal of ${original.transactionCode ?? original.id}`,
        notes: original.notes,
        referenceNumber: original.transactionCode ? `REV-${original.transactionCode}` : null,
        debitAccountId: original.creditAccountId,
        creditAccountId: original.debitAccountId,
      },
      include: {
        debitAccount: { select: { accountCode: true, accountName: true } },
        creditAccount: { select: { accountCode: true, accountName: true } },
      },
    })

    return NextResponse.json({
      success: true,
      reversal: {
        id: reversal.id,
        transactionCode: reversal.transactionCode,
        transactionDate: reversal.transactionDate,
        amount: Number(reversal.amount),
        description: reversal.description,
        debitAccount: reversal.debitAccount,
        creditAccount: reversal.creditAccount,
      },
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

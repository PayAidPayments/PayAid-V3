/**
 * GET /api/finance/bank-reconcile/statement-lines
 * List imported statement lines. Query: importId (single import) or bankAccountId + limit (all lines for bank).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const importId = searchParams.get('importId')
    const bankAccountId = searchParams.get('bankAccountId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)

    if (importId) {
      const lines = await prisma.bankStatementLine.findMany({
        where: {
          import: { id: importId, tenantId },
        },
        orderBy: [{ transactionDate: 'desc' }, { lineIndex: 'asc' }],
        take: limit,
        include: {
          import: { select: { fileName: true, importedAt: true, bankAccountId: true } },
        },
      })
      const list = lines.map((l) => ({
        id: l.id,
        importId: l.importId,
        lineIndex: l.lineIndex,
        transactionDate: l.transactionDate,
        description: l.description,
        referenceNumber: l.referenceNumber,
        debitAmount: Number(l.debitAmount),
        creditAmount: Number(l.creditAmount),
        balanceAfter: l.balanceAfter != null ? Number(l.balanceAfter) : null,
        currency: l.currency,
        matchedTransactionId: l.matchedTransactionId,
        fileName: l.import.fileName,
        importedAt: l.import.importedAt,
      }))
      return NextResponse.json({ statementLines: list, importId })
    }

    if (bankAccountId) {
      const lines = await prisma.bankStatementLine.findMany({
        where: {
          import: { tenantId, bankAccountId },
        },
        orderBy: [{ transactionDate: 'desc' }, { lineIndex: 'asc' }],
        take: limit,
        include: {
          import: { select: { fileName: true, importedAt: true } },
        },
      })
      const list = lines.map((l) => ({
        id: l.id,
        importId: l.importId,
        lineIndex: l.lineIndex,
        transactionDate: l.transactionDate,
        description: l.description,
        referenceNumber: l.referenceNumber,
        debitAmount: Number(l.debitAmount),
        creditAmount: Number(l.creditAmount),
        balanceAfter: l.balanceAfter != null ? Number(l.balanceAfter) : null,
        currency: l.currency,
        matchedTransactionId: l.matchedTransactionId,
        fileName: l.import.fileName,
        importedAt: l.import.importedAt,
      }))
      return NextResponse.json({ statementLines: list })
    }

    return NextResponse.json(
      { error: 'Provide importId or bankAccountId.' },
      { status: 400 }
    )
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

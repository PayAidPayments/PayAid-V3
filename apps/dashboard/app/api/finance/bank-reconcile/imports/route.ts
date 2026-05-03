/**
 * GET /api/finance/bank-reconcile/imports
 * List recent bank statement imports. Query: bankAccountId (optional), limit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const bankAccountId = searchParams.get('bankAccountId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

    const where: { tenantId: string; bankAccountId?: string } = { tenantId }
    if (bankAccountId) where.bankAccountId = bankAccountId

    const imports = await prisma.bankStatementImport.findMany({
      where,
      orderBy: { importedAt: 'desc' },
      take: limit,
      include: {
        bankAccount: { select: { id: true, accountCode: true, accountName: true } },
      },
    })

    const list = imports.map((i) => ({
      id: i.id,
      tenantId: i.tenantId,
      bankAccountId: i.bankAccountId,
      bankAccount: i.bankAccount,
      fileName: i.fileName,
      importedAt: i.importedAt,
      lineCount: i.lineCount,
      format: i.format,
    }))

    return NextResponse.json({ imports: list })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

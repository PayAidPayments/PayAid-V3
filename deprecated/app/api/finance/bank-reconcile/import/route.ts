/**
 * POST /api/finance/bank-reconcile/import
 * Parse and persist bank statement (CSV or OFX). Optional: bankAccountId (Chart of Accounts bank).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { parseCSV, parseOFX } from '@/lib/finance/bank-statement-parser'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bankAccountId = formData.get('bankAccountId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Use form field "file".' },
        { status: 400 }
      )
    }

    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.txt') && !name.endsWith('.ofx')) {
      return NextResponse.json(
        { error: 'Supported formats: CSV, TXT, OFX.' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const isOfx = name.endsWith('.ofx')
    const { lines, columnMap, errors: parseErrors } = isOfx
      ? (() => {
          const ofx = parseOFX(text)
          return { lines: ofx.lines, columnMap: {} as Record<string, string>, errors: ofx.errors }
        })()
      : parseCSV(text)

    if (lines.length === 0 && parseErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid rows parsed.',
        parseErrors,
      }, { status: 400 })
    }

    let resolvedBankAccountId: string | null = bankAccountId?.trim() || null
    if (resolvedBankAccountId) {
      const account = await prisma.chartOfAccounts.findFirst({
        where: {
          id: resolvedBankAccountId,
          tenantId,
          isActive: true,
          OR: [
            { subType: { equals: 'bank', mode: 'insensitive' } },
            { accountName: { contains: 'bank', mode: 'insensitive' } },
          ],
        },
      })
      if (!account) {
        return NextResponse.json(
          { error: 'Invalid or non-bank account selected.' },
          { status: 400 }
        )
      }
    } else {
      const firstBank = await prisma.chartOfAccounts.findFirst({
        where: {
          tenantId,
          isActive: true,
          OR: [
            { subType: { equals: 'bank', mode: 'insensitive' } },
            { accountName: { contains: 'bank', mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      })
      resolvedBankAccountId = firstBank?.id ?? null
    }

    if (!resolvedBankAccountId) {
      return NextResponse.json(
        { error: 'No bank account found in Chart of Accounts. Add a bank account first.' },
        { status: 400 }
      )
    }

    const importRecord = await prisma.bankStatementImport.create({
      data: {
        tenantId,
        bankAccountId: resolvedBankAccountId,
        fileName: file.name,
        format: isOfx ? 'ofx' : 'csv',
        lineCount: lines.length,
        metadata: { columnMap, parseErrors: parseErrors.slice(0, 20) },
      },
    })

    await prisma.bankStatementLine.createMany({
      data: lines.map((line, idx) => ({
        importId: importRecord.id,
        lineIndex: idx,
        transactionDate: line.transactionDate,
        description: line.description,
        referenceNumber: line.referenceNumber,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        balanceAfter: line.balanceAfter,
        currency: 'INR',
        rawDescription: line.rawDescription,
      })),
    })

    return NextResponse.json({
      success: true,
      message: `Imported ${lines.length} statement line(s). You can match them to ledger transactions below.`,
      importId: importRecord.id,
      bankAccountId: resolvedBankAccountId,
      fileName: file.name,
      lineCount: lines.length,
      parseErrors: parseErrors.length > 0 ? parseErrors.slice(0, 10) : undefined,
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

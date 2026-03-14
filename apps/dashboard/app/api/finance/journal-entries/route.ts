/**
 * Finance Journal Entries API
 * GET /api/finance/journal-entries - List journal entries
 * POST /api/finance/journal-entries - Create journal entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createSchema = z.object({
  transactionDate: z.string().transform((s) => new Date(s)),
  debitAccountId: z.string(),
  creditAccountId: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const entries = await prisma.financialTransaction.findMany({
      where: { tenantId, transactionType: 'journal' },
      include: {
        debitAccount: { select: { id: true, accountCode: true, accountName: true } },
        creditAccount: { select: { id: true, accountCode: true, accountName: true } },
      },
      orderBy: { transactionDate: 'desc' },
      take: limit,
    })

    const list = entries.map((e) => ({
      id: e.id,
      transactionCode: e.transactionCode,
      transactionDate: e.transactionDate,
      amount: Number(e.amount),
      description: e.description,
      referenceNumber: e.referenceNumber,
      debitAccount: e.debitAccount,
      creditAccount: e.creditAccount,
      isPosted: e.isPosted,
      createdAt: e.createdAt,
    }))

    return NextResponse.json({ journalEntries: list })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json()
    const v = createSchema.parse(body)
    if (v.debitAccountId === v.creditAccountId) {
      return NextResponse.json({ error: 'Debit and credit accounts must be different' }, { status: 400 })
    }

    const accounts = await prisma.chartOfAccounts.findMany({
      where: {
        tenantId,
        id: { in: [v.debitAccountId, v.creditAccountId] },
        isActive: true,
      },
    })
    if (accounts.length !== 2) {
      return NextResponse.json({ error: 'Invalid debit or credit account' }, { status: 400 })
    }

    const year = v.transactionDate.getFullYear()
    const count = await prisma.financialTransaction.count({
      where: { tenantId, transactionType: 'journal' },
    })
    const transactionCode = `JE-${year}-${String(count + 1).padStart(4, '0')}`

    const entry = await prisma.financialTransaction.create({
      data: {
        tenantId,
        transactionDate: v.transactionDate,
        transactionType: 'journal',
        transactionCode,
        sourceModule: 'manual',
        amount: v.amount,
        amountInBaseCurrency: v.amount,
        description: v.description ?? null,
        notes: v.notes ?? null,
        referenceNumber: v.referenceNumber ?? null,
        debitAccountId: v.debitAccountId,
        creditAccountId: v.creditAccountId,
      },
      include: {
        debitAccount: { select: { accountCode: true, accountName: true } },
        creditAccount: { select: { accountCode: true, accountName: true } },
      },
    })

    return NextResponse.json({
      success: true,
      journalEntry: {
        id: entry.id,
        transactionCode: entry.transactionCode,
        transactionDate: entry.transactionDate,
        amount: Number(entry.amount),
        description: entry.description,
        debitAccount: entry.debitAccount,
        creditAccount: entry.creditAccount,
      },
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return handleLicenseError(error)
  }
}

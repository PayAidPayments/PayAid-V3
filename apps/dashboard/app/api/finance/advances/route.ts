/**
 * Finance Advance Payments & Receipts API
 * GET /api/finance/advances - List advances (optional type filter)
 * POST /api/finance/advances - Create advance
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createSchema = z.object({
  type: z.enum(['TO_VENDOR', 'FROM_CUSTOMER']),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  vendorId: z.string().optional(),
  contactId: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'TO_VENDOR' | 'FROM_CUSTOMER' | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)

    const where: { tenantId: string; type?: string } = { tenantId }
    if (type === 'TO_VENDOR' || type === 'FROM_CUSTOMER') where.type = type

    const advances = await prisma.advancePayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const list = advances.map((a) => ({
      id: a.id,
      type: a.type,
      amount: Number(a.amount),
      currency: a.currency,
      vendorId: a.vendorId,
      contactId: a.contactId,
      referenceNumber: a.referenceNumber,
      adjustedAmount: Number(a.adjustedAmount),
      balance: Number(a.amount) - Number(a.adjustedAmount),
      status: a.status,
      notes: a.notes,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }))

    const summary = {
      totalAdvances: list.length,
      totalAmount: list.reduce((s, a) => s + a.amount, 0),
      totalAdjusted: list.reduce((s, a) => s + a.adjustedAmount, 0),
      totalBalance: list.reduce((s, a) => s + (a.amount - a.adjustedAmount), 0),
    }

    return NextResponse.json({ advances: list, summary })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json()
    const v = createSchema.parse(body)
    // vendorId / contactId are optional; user can link later

    const advance = await prisma.advancePayment.create({
      data: {
        tenantId,
        type: v.type,
        amount: v.amount,
        currency: v.currency,
        vendorId: v.vendorId ?? null,
        contactId: v.contactId ?? null,
        referenceNumber: v.referenceNumber ?? null,
        notes: v.notes ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      advance: {
        id: advance.id,
        type: advance.type,
        amount: Number(advance.amount),
        adjustedAmount: Number(advance.adjustedAmount),
        balance: Number(advance.amount) - Number(advance.adjustedAmount),
        status: advance.status,
        createdAt: advance.createdAt,
      },
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return handleLicenseError(error)
  }
}

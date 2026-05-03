/**
 * PATCH /api/finance/advances/[id] - Adjust advance (add adjusted amount or set status)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const adjustSchema = z.object({
  adjustAmount: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'FULLY_ADJUSTED', 'CANCELLED']).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json().catch(() => ({}))
    const v = adjustSchema.parse(body)

    const existing = await prisma.advancePayment.findFirst({
      where: { id: params.id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 })
    }

    let adjustedAmount = Number(existing.adjustedAmount)
    let status = existing.status
    if (v.adjustAmount != null) {
      adjustedAmount = Math.min(adjustedAmount + v.adjustAmount, Number(existing.amount))
      status = adjustedAmount >= Number(existing.amount) ? 'FULLY_ADJUSTED' : existing.status
    }
    if (v.status != null) status = v.status

    const updated = await prisma.advancePayment.update({
      where: { id: params.id, tenantId },
      data: { adjustedAmount, status },
    })

    return NextResponse.json({
      success: true,
      advance: {
        id: updated.id,
        amount: Number(updated.amount),
        adjustedAmount: Number(updated.adjustedAmount),
        balance: Number(updated.amount) - Number(updated.adjustedAmount),
        status: updated.status,
      },
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return handleLicenseError(error)
  }
}

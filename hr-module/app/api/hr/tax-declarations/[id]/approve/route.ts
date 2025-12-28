import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const approveTaxDeclarationSchema = z.object({
  approvedAmountInr: z.number().positive().optional(),
})

// PUT /api/hr/tax-declarations/[id]/approve - Approve tax declaration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = approveTaxDeclarationSchema.parse(body)

    const declaration = await prisma.employeeTaxDeclaration.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        category: true,
      },
    })

    if (!declaration) {
      return NextResponse.json(
        { error: 'Tax declaration not found' },
        { status: 404 }
      )
    }

    const approvedAmount = validated.approvedAmountInr
      ? new Decimal(validated.approvedAmountInr.toString())
      : declaration.declaredAmountInr

    // Check max amount
    if (
      declaration.category.maxAmountInr &&
      approvedAmount.gt(declaration.category.maxAmountInr)
    ) {
      return NextResponse.json(
        {
          error: `Approved amount exceeds maximum allowed: ₹${Number(declaration.category.maxAmountInr).toLocaleString('en-IN')}`,
        },
        { status: 400 }
      )
    }

    const updated = await prisma.employeeTaxDeclaration.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedAmountInr: approvedAmount,
        verifiedBy: userId,
        verifiedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Approve tax declaration error:', error)
    return NextResponse.json(
      { error: 'Failed to approve tax declaration' },
      { status: 500 }
    )
  }
}

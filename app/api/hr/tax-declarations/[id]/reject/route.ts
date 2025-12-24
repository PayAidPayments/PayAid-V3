import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const rejectTaxDeclarationSchema = z.object({
  rejectionReason: z.string().min(1),
})

// PUT /api/hr/tax-declarations/[id]/reject - Reject tax declaration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = rejectTaxDeclarationSchema.parse(body)

    const declaration = await prisma.employeeTaxDeclaration.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!declaration) {
      return NextResponse.json(
        { error: 'Tax declaration not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.employeeTaxDeclaration.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        verifiedBy: userId,
        verifiedAt: new Date(),
        rejectionReason: validated.rejectionReason,
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

    console.error('Reject tax declaration error:', error)
    return NextResponse.json(
      { error: 'Failed to reject tax declaration' },
      { status: 500 }
    )
  }
}

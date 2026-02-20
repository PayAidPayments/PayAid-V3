import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * PUT /api/hr/reimbursements/[id]/reject
 * Reject a reimbursement request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    const reimbursement = await prisma.reimbursement.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!reimbursement) {
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 })
    }

    if (reimbursement.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Reimbursement is already ${reimbursement.status}` },
        { status: 400 }
      )
    }

    const updated = await prisma.reimbursement.update({
      where: {
        id: params.id,
      },
      data: {
        status: 'REJECTED',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

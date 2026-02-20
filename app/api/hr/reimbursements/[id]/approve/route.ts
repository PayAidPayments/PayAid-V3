import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * PUT /api/hr/reimbursements/[id]/approve
 * Approve a reimbursement request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { notes } = body || {}

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
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
        approvalNotes: notes || null,
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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const approvePOSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
})

// POST /api/purchases/orders/[id]/approve - Approve or reject a purchase order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'finance')

    const order = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'Purchase order is not pending approval' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = approvePOSchema.parse(body)

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: validated.approved ? 'APPROVED' : 'CANCELLED',
        approvedById: validated.approved ? userId : null,
        approvedAt: validated.approved ? new Date() : null,
        rejectionReason: validated.approved ? null : (validated.rejectionReason || 'Rejected by approver'),
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    })

    return NextResponse.json({ order: updated })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Approve purchase order error:', error)
    return NextResponse.json(
      { error: 'Failed to approve purchase order' },
      { status: 500 }
    )
  }
}


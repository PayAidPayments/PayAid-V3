import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const rejectSchema = z.object({
  rejectionReason: z.string().min(1),
})

// PUT /api/hr/leave/requests/[id]/reject - Reject a leave request
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = rejectSchema.parse(body)

    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      )
    }

    if (leaveRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Leave request is already ${leaveRequest.status}` },
        { status: 400 }
      )
    }

    // Verify user is authorized to reject (manager or HR)
    if (leaveRequest.approverId && leaveRequest.approverId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to reject this leave request' },
        { status: 403 }
      )
    }

    // Update leave request status
    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: validated.rejectionReason,
        approverId: userId,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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

    console.error('Reject leave request error:', error)
    return NextResponse.json(
      { error: 'Failed to reject leave request' },
      { status: 500 }
    )
  }
}

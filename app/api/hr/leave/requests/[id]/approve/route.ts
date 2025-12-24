import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// PUT /api/hr/leave/requests/[id]/approve - Approve a leave request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireHRAccess(request)

    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        employee: true,
        leaveType: true,
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

    // Verify user is authorized to approve (manager or HR)
    if (leaveRequest.approverId && leaveRequest.approverId !== userId) {
      // Check if user is HR admin (you may need to add role check)
      return NextResponse.json(
        { error: 'Unauthorized to approve this leave request' },
        { status: 403 }
      )
    }

    // Update leave request status
    const updated = await prisma.leaveRequest.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
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

    // Update leave balance
    const balance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
      },
      orderBy: { asOfDate: 'desc' },
    })

    if (balance) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
          balance: balance.balance - leaveRequest.days,
          asOfDate: new Date(),
          tenantId: tenantId,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Approve leave request error:', error)
    return NextResponse.json(
      { error: 'Failed to approve leave request' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createLeaveRequestSchema = z.object({
  employeeId: z.string(),
  leaveTypeId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isHalfDay: z.boolean().default(false),
  halfDayType: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
  reason: z.string().min(1),
  supportingDocumentUrl: z.string().url().optional(),
})

// GET /api/hr/leave/requests - List leave requests
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId: tenantId,
    }

    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveRequest.count({ where }),
    ])

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get leave requests error:', error)
    return NextResponse.json(
      { error: 'Failed to get leave requests' },
      { status: 500 }
    )
  }
}

// POST /api/hr/leave/requests - Create a new leave request
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createLeaveRequestSchema.parse(body)

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: {
        id: validated.employeeId,
        tenantId: tenantId,
      },
      include: {
        manager: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Verify leave type exists
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: validated.leaveTypeId,
        tenantId: tenantId,
      },
    })

    if (!leaveType) {
      return NextResponse.json(
        { error: 'Leave type not found' },
        { status: 404 }
      )
    }

    // Calculate number of days
    const startDate = new Date(validated.startDate)
    const endDate = new Date(validated.endDate)
    const days = validated.isHalfDay
      ? 0.5
      : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Check leave balance
    const balance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: validated.employeeId,
        leaveTypeId: validated.leaveTypeId,
      },
      orderBy: { asOfDate: 'desc' },
    })

    if (balance && Number(balance.balance) < days) {
      return NextResponse.json(
        { error: `Insufficient leave balance. Available: ${balance.balance} days` },
        { status: 400 }
      )
    }

    // Get leave policy
    const policy = await prisma.leavePolicy.findFirst({
      where: {
        leaveTypeId: validated.leaveTypeId,
        tenantId: tenantId,
      },
    })

    // Determine approver (manager or HR)
    const approverId = employee.managerId || userId

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: validated.employeeId,
        leaveTypeId: validated.leaveTypeId,
        startDate,
        endDate,
        days,
        isHalfDay: validated.isHalfDay,
        halfDayType: validated.halfDayType,
        reason: validated.reason,
        supportingDocumentUrl: validated.supportingDocumentUrl,
        status: policy?.requiresApproval ? 'PENDING' : 'APPROVED',
        approverId: policy?.requiresApproval ? approverId : null,
        tenantId: tenantId,
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

    return NextResponse.json(leaveRequest, { status: 201 })
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

    console.error('Create leave request error:', error)
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    )
  }
}

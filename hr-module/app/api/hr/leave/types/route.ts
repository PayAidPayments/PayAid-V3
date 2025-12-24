import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createLeaveTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  isPaid: z.boolean().default(true),
  isActive: z.boolean().default(true),
})

// GET /api/hr/leave/types - List all leave types
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('isActive')

    const where: any = {
      tenantId: tenantId,
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const leaveTypes = await prisma.leaveType.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { leaveRequests: true },
        },
      },
    })

    return NextResponse.json({ leaveTypes })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get leave types error:', error)
    return NextResponse.json(
      { error: 'Failed to get leave types' },
      { status: 500 }
    )
  }
}

// POST /api/hr/leave/types - Create a new leave type
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createLeaveTypeSchema.parse(body)

    // Check for duplicate name
    const existing = await prisma.leaveType.findFirst({
      where: {
        tenantId: tenantId,
        name: validated.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Leave type with this name already exists' },
        { status: 400 }
      )
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        name: validated.name,
        code: validated.code,
        isPaid: validated.isPaid,
        isActive: validated.isActive,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(leaveType, { status: 201 })
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

    console.error('Create leave type error:', error)
    return NextResponse.json(
      { error: 'Failed to create leave type' },
      { status: 500 }
    )
  }
}

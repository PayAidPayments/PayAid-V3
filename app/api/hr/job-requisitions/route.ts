import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createJobRequisitionSchema = z.object({
  title: z.string().min(1),
  departmentId: z.string().optional(),
  locationId: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERN', 'CONTRACT']).default('FULL_TIME'),
  budgetedCtcMinInr: z.number().positive().optional(),
  budgetedCtcMaxInr: z.number().positive().optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ON_HOLD', 'CLOSED']).default('DRAFT'),
})

// GET /api/hr/job-requisitions - List all job requisitions
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId: tenantId,
    }

    if (status) where.status = status
    if (departmentId) where.departmentId = departmentId

    const [requisitions, total] = await Promise.all([
      prisma.jobRequisition.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          department: {
            select: { id: true, name: true },
          },
          location: {
            select: { id: true, name: true, city: true, state: true },
          },
          _count: {
            select: { candidateJobs: true, offers: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobRequisition.count({ where }),
    ])

    return NextResponse.json({
      requisitions,
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
    console.error('Get job requisitions error:', error)
    return NextResponse.json(
      { error: 'Failed to get job requisitions' },
      { status: 500 }
    )
  }
}

// POST /api/hr/job-requisitions - Create a new job requisition
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = createJobRequisitionSchema.parse(body)

    const requisition = await prisma.jobRequisition.create({
      data: {
        title: validated.title,
        departmentId: validated.departmentId || null,
        locationId: validated.locationId || null,
        employmentType: validated.employmentType,
        budgetedCtcMinInr: validated.budgetedCtcMinInr
          ? new Decimal(validated.budgetedCtcMinInr.toString())
          : null,
        budgetedCtcMaxInr: validated.budgetedCtcMaxInr
          ? new Decimal(validated.budgetedCtcMaxInr.toString())
          : null,
        status: validated.status,
        requestedBy: userId,
        tenantId: tenantId,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        location: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(requisition, { status: 201 })
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

    console.error('Create job requisition error:', error)
    return NextResponse.json(
      { error: 'Failed to create job requisition' },
      { status: 500 }
    )
  }
}

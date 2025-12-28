import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateJobRequisitionSchema = z.object({
  title: z.string().min(1).optional(),
  departmentId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERN', 'CONTRACT']).optional(),
  budgetedCtcMinInr: z.number().positive().optional().nullable(),
  budgetedCtcMaxInr: z.number().positive().optional().nullable(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ON_HOLD', 'CLOSED']).optional(),
  approvedBy: z.string().optional().nullable(),
})

// GET /api/hr/job-requisitions/[id] - Get a single job requisition
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const requisition = await prisma.jobRequisition.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        department: true,
        location: true,
        candidateJobs: {
          include: {
            candidate: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                status: true,
              },
            },
          },
        },
        offers: {
          include: {
            candidate: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { candidateJobs: true, offers: true },
        },
      },
    })

    if (!requisition) {
      return NextResponse.json(
        { error: 'Job requisition not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(requisition)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get job requisition error:', error)
    return NextResponse.json(
      { error: 'Failed to get job requisition' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/job-requisitions/[id] - Update a job requisition
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const existing = await prisma.jobRequisition.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Job requisition not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateJobRequisitionSchema.parse(body)

    const updateData: any = {}
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.departmentId !== undefined) updateData.departmentId = validated.departmentId
    if (validated.locationId !== undefined) updateData.locationId = validated.locationId
    if (validated.employmentType !== undefined) updateData.employmentType = validated.employmentType
    if (validated.budgetedCtcMinInr !== undefined)
      updateData.budgetedCtcMinInr = validated.budgetedCtcMinInr
        ? new Decimal(validated.budgetedCtcMinInr.toString())
        : null
    if (validated.budgetedCtcMaxInr !== undefined)
      updateData.budgetedCtcMaxInr = validated.budgetedCtcMaxInr
        ? new Decimal(validated.budgetedCtcMaxInr.toString())
        : null
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.approvedBy !== undefined) {
      updateData.approvedBy = validated.approvedBy
      if (validated.status === 'APPROVED' && !existing.approvedBy) {
        updateData.approvedBy = userId
      }
    }

    const requisition = await prisma.jobRequisition.update({
      where: { id: params.id },
      data: updateData,
      include: {
        department: true,
        location: true,
      },
    })

    return NextResponse.json(requisition)
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

    console.error('Update job requisition error:', error)
    return NextResponse.json(
      { error: 'Failed to update job requisition' },
      { status: 500 }
    )
  }
}

// DELETE /api/hr/job-requisitions/[id] - Delete a job requisition
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const requisition = await prisma.jobRequisition.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!requisition) {
      return NextResponse.json(
        { error: 'Job requisition not found' },
        { status: 404 }
      )
    }

    // Check if there are candidates or offers
    const candidateCount = await prisma.candidateJob.count({
      where: { requisitionId: params.id },
    })

    const offerCount = await prisma.offer.count({
      where: { requisitionId: params.id },
    })

    if (candidateCount > 0 || offerCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete requisition. ${candidateCount} candidate(s) and ${offerCount} offer(s) are associated.`,
        },
        { status: 400 }
      )
    }

    await prisma.jobRequisition.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Job requisition deleted successfully' })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete job requisition error:', error)
    return NextResponse.json(
      { error: 'Failed to delete job requisition' },
      { status: 500 }
    )
  }
}

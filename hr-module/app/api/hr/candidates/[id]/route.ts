import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateCandidateSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  source: z.string().optional(),
  currentCompany: z.string().optional().nullable(),
  currentCtcInr: z.number().positive().optional().nullable(),
  expectedCtcInr: z.number().positive().optional().nullable(),
  noticePeriodDays: z.number().min(0).optional().nullable(),
  location: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
  resumeFileUrl: z.string().url().optional().nullable(),
  status: z.enum(['NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED']).optional(),
})

// GET /api/hr/candidates/[id] - Get a single candidate
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const candidate = await prisma.candidate.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        candidateJobs: {
          include: {
            requisition: {
              select: {
                id: true,
                title: true,
                department: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        interviewRounds: {
          // interviewerId is just a string, not a relation
          orderBy: { scheduledAt: 'asc' },
        },
        offers: {
          include: {
            requisition: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(candidate)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get candidate error:', error)
    return NextResponse.json(
      { error: 'Failed to get candidate' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/candidates/[id] - Update a candidate
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const existing = await prisma.candidate.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateCandidateSchema.parse(body)

    // Check for duplicate email if email is being updated
    if (validated.email && validated.email !== existing.email) {
      const emailExists = await prisma.candidate.findFirst({
        where: {
          tenantId: tenantId,
          email: validated.email,
          id: { not: params.id },
        },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Candidate with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (validated.fullName !== undefined) updateData.fullName = validated.fullName
    if (validated.email !== undefined) updateData.email = validated.email
    if (validated.phone !== undefined) updateData.phone = validated.phone
    if (validated.source !== undefined) updateData.source = validated.source
    if (validated.currentCompany !== undefined) updateData.currentCompany = validated.currentCompany
    if (validated.currentCtcInr !== undefined)
      updateData.currentCtcInr = validated.currentCtcInr
        ? new Decimal(validated.currentCtcInr.toString())
        : null
    if (validated.expectedCtcInr !== undefined)
      updateData.expectedCtcInr = validated.expectedCtcInr
        ? new Decimal(validated.expectedCtcInr.toString())
        : null
    if (validated.noticePeriodDays !== undefined) updateData.noticePeriodDays = validated.noticePeriodDays
    if (validated.location !== undefined) updateData.location = validated.location
    if (validated.skills !== undefined) updateData.skills = validated.skills
    if (validated.resumeFileUrl !== undefined) updateData.resumeFileUrl = validated.resumeFileUrl
    if (validated.status !== undefined) updateData.status = validated.status

    const candidate = await prisma.candidate.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(candidate)
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

    console.error('Update candidate error:', error)
    return NextResponse.json(
      { error: 'Failed to update candidate' },
      { status: 500 }
    )
  }
}

// DELETE /api/hr/candidates/[id] - Delete a candidate
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const candidate = await prisma.candidate.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    await prisma.candidate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Candidate deleted successfully' })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete candidate error:', error)
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    )
  }
}

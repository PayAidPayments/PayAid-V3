import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateInterviewSchema = z.object({
  roundName: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  mode: z.enum(['IN_PERSON', 'VIDEO', 'PHONE']).optional(),
  interviewerId: z.string().optional(),
  feedback: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
})

// GET /api/hr/interviews/[id] - Get a single interview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const interview = await prisma.interviewRound.findFirst({
      where: {
        id: resolvedParams.id,
        candidate: {
          tenantId: tenantId,
        },
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            officialEmail: true,
          },
        },
      },
    })

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(interview)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get interview error:', error)
    return NextResponse.json(
      { error: 'Failed to get interview' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/interviews/[id] - Update an interview
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const existing = await prisma.interviewRound.findFirst({
      where: {
        id: resolvedParams.id,
        candidate: {
          tenantId: tenantId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateInterviewSchema.parse(body)

    const updateData: any = {}
    if (validated.roundName !== undefined) updateData.roundName = validated.roundName
    if (validated.scheduledAt !== undefined) updateData.scheduledAt = new Date(validated.scheduledAt)
    if (validated.mode !== undefined) updateData.mode = validated.mode
    if (validated.interviewerId !== undefined) updateData.interviewerId = validated.interviewerId
    if (validated.feedback !== undefined) updateData.feedback = validated.feedback
    if (validated.rating !== undefined) updateData.rating = validated.rating
    if (validated.status !== undefined) updateData.status = validated.status

    const interview = await prisma.interviewRound.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    return NextResponse.json(interview)
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

    console.error('Update interview error:', error)
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    )
  }
}

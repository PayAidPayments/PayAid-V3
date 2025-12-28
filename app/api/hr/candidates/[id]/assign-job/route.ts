import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const assignJobSchema = z.object({
  requisitionId: z.string(),
  stage: z.enum(['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).default('APPLIED'),
})

// POST /api/hr/candidates/[id]/assign-job - Assign candidate to a job requisition
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = assignJobSchema.parse(body)

    // Verify candidate belongs to tenant
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Verify requisition belongs to tenant
    const requisition = await prisma.jobRequisition.findFirst({
      where: {
        id: validated.requisitionId,
        tenantId: tenantId,
      },
    })

    if (!requisition) {
      return NextResponse.json(
        { error: 'Job requisition not found' },
        { status: 404 }
      )
    }

    // Check if already assigned
    const existing = await prisma.candidateJob.findFirst({
      where: {
        candidateId: resolvedParams.id,
        requisitionId: validated.requisitionId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Candidate already assigned to this job' },
        { status: 400 }
      )
    }

    // Create assignment
    const candidateJob = await prisma.candidateJob.create({
      data: {
        candidateId: resolvedParams.id,
        requisitionId: validated.requisitionId,
        stage: validated.stage,
      },
      include: {
        requisition: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(candidateJob, { status: 201 })
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

    console.error('Assign job error:', error)
    return NextResponse.json(
      { error: 'Failed to assign candidate to job' },
      { status: 500 }
    )
  }
}

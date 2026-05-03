import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createInterviewSchema = z.object({
  candidateId: z.string(),
  roundName: z.string().min(1),
  scheduledAt: z.string().datetime(),
  mode: z.enum(['IN_PERSON', 'VIDEO', 'PHONE']).default('VIDEO'),
  interviewerId: z.string(),
})

// GET /api/hr/interviews - List all interviews
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const searchParams = request.nextUrl.searchParams
    const candidateId = searchParams.get('candidateId')
    const interviewerId = searchParams.get('interviewerId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      candidate: {
        tenantId: tenantId,
      },
    }

    if (candidateId) where.candidateId = candidateId
    if (interviewerId) where.interviewerId = interviewerId
    if (status) where.status = status

    const [interviews, total] = await Promise.all([
      prisma.interviewRound.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          candidate: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          // interviewerId is just a string, not a relation
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.interviewRound.count({ where }),
    ])

    return NextResponse.json({
      interviews,
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
    console.error('Get interviews error:', error)
    return NextResponse.json(
      { error: 'Failed to get interviews' },
      { status: 500 }
    )
  }
}

// POST /api/hr/interviews - Schedule a new interview
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = createInterviewSchema.parse(body)

    // Verify candidate belongs to tenant
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: validated.candidateId,
        tenantId: tenantId,
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Verify interviewer is an employee
    const interviewer = await prisma.employee.findFirst({
      where: {
        id: validated.interviewerId,
        tenantId: tenantId,
      },
    })

    if (!interviewer) {
      return NextResponse.json(
        { error: 'Interviewer not found' },
        { status: 404 }
      )
    }

    const interview = await prisma.interviewRound.create({
      data: {
        candidateId: validated.candidateId,
        roundName: validated.roundName,
        scheduledAt: new Date(validated.scheduledAt),
        mode: validated.mode,
        interviewerId: validated.interviewerId,
        status: 'SCHEDULED',
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        // interviewerId is just a string, not a relation
      },
    })

    return NextResponse.json(interview, { status: 201 })
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

    console.error('Create interview error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule interview' },
      { status: 500 }
    )
  }
}

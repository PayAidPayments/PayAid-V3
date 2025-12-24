import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createCandidateSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  source: z.string().optional(),
  currentCompany: z.string().optional(),
  currentCtcInr: z.number().positive().optional(),
  expectedCtcInr: z.number().positive().optional(),
  noticePeriodDays: z.number().min(0).optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  resumeFileUrl: z.string().url().optional(),
  status: z.enum(['NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED']).default('NEW'),
})

// GET /api/hr/candidates - List all candidates
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId: tenantId,
    }

    if (status) where.status = status
    if (source) where.source = source
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          candidateJobs: {
            include: {
              requisition: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          _count: {
            select: { candidateJobs: true, interviewRounds: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.candidate.count({ where }),
    ])

    return NextResponse.json({
      candidates,
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
    console.error('Get candidates error:', error)
    return NextResponse.json(
      { error: 'Failed to get candidates' },
      { status: 500 }
    )
  }
}

// POST /api/hr/candidates - Create a new candidate
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createCandidateSchema.parse(body)

    // Check for duplicate email
    const existing = await prisma.candidate.findFirst({
      where: {
        tenantId: tenantId,
        email: validated.email,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Candidate with this email already exists' },
        { status: 400 }
      )
    }

    const candidate = await prisma.candidate.create({
      data: {
        fullName: validated.fullName,
        email: validated.email,
        phone: validated.phone,
        source: validated.source,
        currentCompany: validated.currentCompany,
        currentCtcInr: validated.currentCtcInr
          ? new Decimal(validated.currentCtcInr.toString())
          : null,
        expectedCtcInr: validated.expectedCtcInr
          ? new Decimal(validated.expectedCtcInr.toString())
          : null,
        noticePeriodDays: validated.noticePeriodDays,
        location: validated.location,
        skills: validated.skills || [],
        resumeFileUrl: validated.resumeFileUrl,
        status: validated.status,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(candidate, { status: 201 })
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

    console.error('Create candidate error:', error)
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    )
  }
}

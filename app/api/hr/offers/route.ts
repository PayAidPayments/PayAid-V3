import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createOfferSchema = z.object({
  candidateId: z.string(),
  requisitionId: z.string(),
  offeredCtcInr: z.number().positive(),
  acceptedCtcInr: z.number().positive().optional(),
  joiningDate: z.string().datetime(),
  offerStatus: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).default('SENT'),
  offerLetterUrl: z.string().url().optional(),
})

// GET /api/hr/offers - List all offers
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const candidateId = searchParams.get('candidateId')
    const requisitionId = searchParams.get('requisitionId')
    const offerStatus = searchParams.get('offerStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId: tenantId,
    }

    if (candidateId) where.candidateId = candidateId
    if (requisitionId) where.requisitionId = requisitionId
    if (offerStatus) where.offerStatus = offerStatus

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
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
          requisition: {
            select: {
              id: true,
              title: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.offer.count({ where }),
    ])

    return NextResponse.json({
      offers,
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
    console.error('Get offers error:', error)
    return NextResponse.json(
      { error: 'Failed to get offers' },
      { status: 500 }
    )
  }
}

// POST /api/hr/offers - Create a new offer
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createOfferSchema.parse(body)

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

    // Check if offer already exists
    const existing = await prisma.offer.findFirst({
      where: {
        candidateId: validated.candidateId,
        requisitionId: validated.requisitionId,
        offerStatus: { not: 'REJECTED' },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Active offer already exists for this candidate and requisition' },
        { status: 400 }
      )
    }

    const offer = await prisma.offer.create({
      data: {
        candidateId: validated.candidateId,
        requisitionId: validated.requisitionId,
        offeredCtcInr: new Decimal(validated.offeredCtcInr.toString()),
        acceptedCtcInr: validated.acceptedCtcInr
          ? new Decimal(validated.acceptedCtcInr.toString())
          : null,
        joiningDate: new Date(validated.joiningDate),
        offerStatus: validated.offerStatus,
        offerLetterUrl: validated.offerLetterUrl,
        tenantId: tenantId,
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        requisition: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(offer, { status: 201 })
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

    console.error('Create offer error:', error)
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    )
  }
}

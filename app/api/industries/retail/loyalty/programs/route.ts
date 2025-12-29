import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  pointsPerRupee: z.number().min(0).default(1),
  redemptionRate: z.number().min(1).default(100),
  enableTiers: z.boolean().default(false),
  tiers: z.array(z.object({
    name: z.string(),
    minPoints: z.number(),
    discountPercent: z.number(),
  })).optional(),
  expiryDays: z.number().positive().optional(),
  minRedemptionPoints: z.number().min(0).default(100),
})

// GET /api/industries/retail/loyalty/programs - List loyalty programs
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'retail') {
      return NextResponse.json(
        { error: 'This endpoint is only for retail industry' },
        { status: 403 }
      )
    }

    const programs = await prisma.loyaltyProgram.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ programs })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get loyalty programs error:', error)
    return NextResponse.json(
      { error: 'Failed to get loyalty programs' },
      { status: 500 }
    )
  }
}

// POST /api/industries/retail/loyalty/programs - Create loyalty program
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'retail') {
      return NextResponse.json(
        { error: 'This endpoint is only for retail industry' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createProgramSchema.parse(body)

    const program = await prisma.loyaltyProgram.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        pointsPerRupee: validated.pointsPerRupee,
        redemptionRate: validated.redemptionRate,
        enableTiers: validated.enableTiers,
        tiers: validated.tiers || null,
        expiryDays: validated.expiryDays || null,
        minRedemptionPoints: validated.minRedemptionPoints,
      },
    })

    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create loyalty program error:', error)
    return NextResponse.json(
      { error: 'Failed to create loyalty program' },
      { status: 500 }
    )
  }
}


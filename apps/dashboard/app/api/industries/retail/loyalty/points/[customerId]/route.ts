import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const redeemPointsSchema = z.object({
  programId: z.string(),
  points: z.number().positive(),
  description: z.string().optional(),
})

// GET /api/industries/retail/loyalty/points/[customerId] - Get customer loyalty points
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { customerId } = await params

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

    const programId = request.nextUrl.searchParams.get('programId')

    const where: any = {
      tenantId,
      customerId,
    }

    if (programId) {
      where.programId = programId
    }

    const points = await prisma.loyaltyPoints.findMany({
      where,
      include: {
        program: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    return NextResponse.json({ points })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get loyalty points error:', error)
    return NextResponse.json(
      { error: 'Failed to get loyalty points' },
      { status: 500 }
    )
  }
}

// POST /api/industries/retail/loyalty/points/[customerId]/redeem - Redeem loyalty points
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { customerId } = await params

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
    const validated = redeemPointsSchema.parse(body)

    // Get or create loyalty points record
    let points = await prisma.loyaltyPoints.findUnique({
      where: {
        tenantId_programId_customerId: {
          tenantId,
          programId: validated.programId,
          customerId,
        },
      },
    })

    if (!points) {
      // Create new loyalty points record
      points = await prisma.loyaltyPoints.create({
        data: {
          tenantId,
          programId: validated.programId,
          customerId,
          currentPoints: 0,
          totalEarned: 0,
          totalRedeemed: 0,
        },
      })
    }

    // Check if customer has enough points
    if (Number(points.currentPoints) < validated.points) {
      return NextResponse.json(
        { error: 'Insufficient loyalty points' },
        { status: 400 }
      )
    }

    // Get program to check minimum redemption
    const program = await prisma.loyaltyProgram.findUnique({
      where: { id: validated.programId },
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Loyalty program not found' },
        { status: 404 }
      )
    }

    if (validated.points < program.minRedemptionPoints) {
      return NextResponse.json(
        { error: `Minimum redemption is ${program.minRedemptionPoints} points` },
        { status: 400 }
      )
    }

    // Calculate new balance
    const newBalance = Number(points.currentPoints) - validated.points
    const newTotalRedeemed = Number(points.totalRedeemed) + validated.points

    // Update points and create transaction
    const updatedPoints = await prisma.loyaltyPoints.update({
      where: { id: points.id },
      data: {
        currentPoints: newBalance,
        totalRedeemed: newTotalRedeemed,
        lastTransactionAt: new Date(),
      },
    })

    // Create redemption transaction
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        tenantId,
        pointsId: points.id,
        programId: validated.programId,
        type: 'REDEEMED',
        points: -validated.points,
        balanceAfter: newBalance,
        description: validated.description || 'Points redeemed',
      },
    })

    return NextResponse.json({ 
      points: updatedPoints,
      transaction,
      discountAmount: validated.points / Number(program.redemptionRate), // Discount in rupees
    })
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

    console.error('Redeem loyalty points error:', error)
    return NextResponse.json(
      { error: 'Failed to redeem loyalty points' },
      { status: 500 }
    )
  }
}


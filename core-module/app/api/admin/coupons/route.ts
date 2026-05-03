import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  maxUses: z.number().int().positive().optional(),
  applicableModules: z.array(z.string()).optional(),
  minAmount: z.number().positive().optional(),
})

// GET /api/admin/coupons - List all coupons
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: auth.userId || '' },
      select: { role: true },
    })

    if (user?.role !== 'admin' && user?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Fetch coupons from database
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      coupons,
      count: coupons.length,
    })
  } catch (error) {
    console.error('Get coupons error:', error)
    return NextResponse.json(
      { error: 'Failed to get coupons' },
      { status: 500 }
    )
  }
}

// POST /api/admin/coupons - Create a new coupon
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: auth.userId || '' },
      select: { role: true },
    })

    if (user?.role !== 'admin' && user?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createCouponSchema.parse(body)

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: validated.code },
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      )
    }

    // Create coupon in database
    const coupon = await prisma.coupon.create({
      data: {
        code: validated.code,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        validFrom: new Date(validated.validFrom),
        validUntil: new Date(validated.validUntil),
        maxUses: validated.maxUses,
        applicableModules: validated.applicableModules || [],
        minAmount: validated.minAmount,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      coupon,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create coupon error:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createPaymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_account', 'upi', 'wallet']),
  provider: z.string(),
  token: z.string().optional(),
  last4: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().optional(),
  isDefault: z.boolean().optional().default(false),
})

// GET /api/billing/payment-methods - List payment methods
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ paymentMethods })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get payment methods error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

// POST /api/billing/payment-methods - Create payment method
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const validated = createPaymentMethodSchema.parse(body)

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: {
          tenantId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        tenantId,
        type: validated.type,
        provider: validated.provider,
        token: validated.token,
        last4: validated.last4,
        expiryMonth: validated.expiryMonth,
        expiryYear: validated.expiryYear,
        isDefault: validated.isDefault,
      },
    })

    return NextResponse.json({ paymentMethod }, { status: 201 })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create payment method error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    )
  }
}


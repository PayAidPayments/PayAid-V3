import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tier: z.enum(['starter', 'professional', 'enterprise']),
  monthlyPrice: z.number().positive(),
  annualPrice: z.number().positive().optional(),
  modules: z.array(z.string()),
  features: z.record(z.any()).optional(),
  maxUsers: z.number().int().positive().optional(),
  maxStorage: z.number().int().positive().optional(),
  isSystem: z.boolean().optional().default(false),
})

const updatePlanSchema = createPlanSchema.partial()

// GET /api/subscriptions/plans - List subscription plans
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {
      OR: [
        { isSystem: true }, // System plans available to all
        { tenantId: null }, // Global plans
      ],
    }

    if (tier) {
      where.tier = tier
    }

    if (!includeInactive) {
      where.isActive = true
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' },
        { monthlyPrice: 'asc' },
      ],
    })

    return NextResponse.json({ plans })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get plans error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

// POST /api/subscriptions/plans - Create subscription plan (admin only)
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== 'admin' && user?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createPlanSchema.parse(body)

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: validated.name,
        description: validated.description,
        tier: validated.tier,
        monthlyPrice: new Decimal(validated.monthlyPrice),
        annualPrice: validated.annualPrice ? new Decimal(validated.annualPrice) : null,
        modules: validated.modules,
        features: validated.features || {},
        maxUsers: validated.maxUsers,
        maxStorage: validated.maxStorage,
        isSystem: validated.isSystem,
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
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
    console.error('Create plan error:', error)
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    )
  }
}


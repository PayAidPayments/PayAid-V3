import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/insurance/plans
 * List insurance plans
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const planType = searchParams.get('planType') || ''

    const where: any = { tenantId }
    if (planType) where.planType = planType

    const [plans, total] = await Promise.all([
      prisma.insurancePlan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
      prisma.insurancePlan.count({ where }).catch(() => 0),
    ])

    return NextResponse.json({
      plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

/**
 * POST /api/hr/insurance/plans
 * Create a new insurance plan
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { planName, planType, provider, coverageAmount, premiumAmount, startDate, endDate, description } = body

    const plan = await prisma.insurancePlan.create({
      data: {
        tenantId,
        planName,
        planType,
        provider,
        coverageAmount,
        premiumAmount,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description: description || null,
        status: 'ACTIVE',
        createdBy: userId,
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

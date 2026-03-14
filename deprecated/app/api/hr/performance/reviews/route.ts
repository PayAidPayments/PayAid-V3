import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/performance/reviews
 * List performance reviews with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const employeeId = searchParams.get('employeeId') || ''
    const reviewType = searchParams.get('reviewType') || ''

    const where: any = { tenantId }
    if (employeeId) where.employeeId = employeeId
    if (reviewType) where.reviewType = reviewType

    const [reviews, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
      }).catch(() => []),
      prisma.performanceReview.count({ where }).catch(() => 0),
    ])

    return NextResponse.json({
      reviews,
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
 * POST /api/hr/performance/reviews
 * Create a new performance review
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { employeeId, reviewType, period, reviewerId, startDate, endDate } = body

    const review = await prisma.performanceReview.create({
      data: {
        tenantId,
        employeeId,
        reviewType,
        period,
        reviewerId: reviewerId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'IN_PROGRESS',
        createdBy: userId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/performance/okrs
 * List OKRs with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const employeeId = searchParams.get('employeeId') || ''
    const quarter = searchParams.get('quarter') || ''
    const year = searchParams.get('year') || ''

    const where: any = { tenantId }
    if (employeeId) where.employeeId = employeeId
    if (quarter) where.quarter = quarter
    if (year) where.year = parseInt(year)

    const [okrs, total] = await Promise.all([
      prisma.okr.findMany({
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
          keyResults: true,
        },
      }).catch(() => []),
      prisma.okr.count({ where }).catch(() => 0),
    ])

    return NextResponse.json({
      okrs,
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
 * POST /api/hr/performance/okrs
 * Create a new OKR
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { employeeId, objective, quarter, year, keyResults } = body

    // Create OKR with key results
    const okr = await prisma.okr.create({
      data: {
        tenantId,
        employeeId,
        objective,
        quarter,
        year,
        status: 'ACTIVE',
        createdBy: userId,
        keyResults: {
          create: keyResults.map((kr: any) => ({
            description: kr.description,
            target: kr.target,
            unit: kr.unit,
            currentValue: 0,
          })),
        },
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
        keyResults: true,
      },
    })

    return NextResponse.json(okr, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

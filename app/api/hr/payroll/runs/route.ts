import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/hr/payroll/runs - List payroll runs
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const cycleId = searchParams.get('cycleId')
    const employeeId = searchParams.get('employeeId')
    const payoutStatus = searchParams.get('payoutStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId: tenantId,
    }

    if (cycleId) where.cycleId = cycleId
    if (employeeId) where.employeeId = employeeId
    if (payoutStatus) where.payoutStatus = payoutStatus

    const [runs, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
            },
          },
          cycle: {
            select: {
              id: true,
              month: true,
              year: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payrollRun.count({ where }),
    ])

    return NextResponse.json({
      runs,
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
    console.error('Get payroll runs error:', error)
    return NextResponse.json(
      { error: 'Failed to get payroll runs' },
      { status: 500 }
    )
  }
}

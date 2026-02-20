import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/payroll-runs
 * List payroll runs with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || ''

    const where: any = { tenantId }
    if (status) {
      where.status = status
    }

    const [runs, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
      prisma.payrollRun.count({ where }).catch(() => 0),
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
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

/**
 * POST /api/hr/payroll-runs
 * Create a new payroll run
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const {
      payrollMonth,
      payDate,
      type,
      departmentId,
      includeContractors,
      includeBonuses,
      includeArrears,
      notes,
    } = body

    const payrollRun = await prisma.payrollRun.create({
      data: {
        tenantId,
        payrollMonth,
        payDate: new Date(payDate),
        type,
        departmentId: departmentId || null,
        includeContractors: includeContractors ?? false,
        includeBonuses: includeBonuses ?? false,
        includeArrears: includeArrears ?? false,
        notes: notes || null,
        status: 'DRAFT',
        createdBy: userId,
      },
    })

    return NextResponse.json(payrollRun, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

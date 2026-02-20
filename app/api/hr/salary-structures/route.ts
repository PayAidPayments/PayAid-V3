import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/salary-structures
 * List salary structures with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const departmentId = searchParams.get('departmentId') || ''

    const where: any = { tenantId }
    if (departmentId) {
      where.departmentId = departmentId
    }

    const [structures, total] = await Promise.all([
      prisma.salaryStructure.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
        },
      }).catch(() => []),
      prisma.salaryStructure.count({ where }).catch(() => 0),
    ])

    return NextResponse.json({
      structures,
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
 * POST /api/hr/salary-structures
 * Create a new salary structure
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const {
      name,
      departmentId,
      ctc,
      basic,
      hra,
      allowances,
      pf,
      esi,
      pt,
      gross,
      deductions,
      netSalary,
      effectiveDate,
    } = body

    const structure = await prisma.salaryStructure.create({
      data: {
        tenantId,
        name,
        departmentId,
        ctc,
        basic,
        hra,
        allowances: allowances || 0,
        pf: pf || 0,
        esi: esi || 0,
        pt: pt || 0,
        gross,
        deductions,
        netSalary,
        effectiveDate: new Date(effectiveDate),
        status: 'ACTIVE',
        createdBy: userId,
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json(structure, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

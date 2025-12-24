import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createPayrollCycleSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  runType: z.enum(['REGULAR', 'BONUS', 'ARREARS']).default('REGULAR'),
})

// GET /api/hr/payroll/cycles - List all payroll cycles
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const year = searchParams.get('year')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId: tenantId,
    }

    if (status) where.status = status
    if (year) where.year = parseInt(year)

    const [cycles, total] = await Promise.all([
      prisma.payrollCycle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { payrollRuns: true },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.payrollCycle.count({ where }),
    ])

    return NextResponse.json({
      cycles,
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
    console.error('Get payroll cycles error:', error)
    return NextResponse.json(
      { error: 'Failed to get payroll cycles' },
      { status: 500 }
    )
  }
}

// POST /api/hr/payroll/cycles - Create a new payroll cycle
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createPayrollCycleSchema.parse(body)

    // Check if cycle already exists
    const existing = await prisma.payrollCycle.findUnique({
      where: {
        tenantId_month_year_runType: {
          tenantId: tenantId,
          month: validated.month,
          year: validated.year,
          runType: validated.runType,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Payroll cycle already exists for this month/year/type' },
        { status: 400 }
      )
    }

    const cycle = await prisma.payrollCycle.create({
      data: {
        month: validated.month,
        year: validated.year,
        runType: validated.runType,
        status: 'DRAFT',
        tenantId: tenantId,
      },
    })

    return NextResponse.json(cycle, { status: 201 })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create payroll cycle error:', error)
    return NextResponse.json(
      { error: 'Failed to create payroll cycle' },
      { status: 500 }
    )
  }
}

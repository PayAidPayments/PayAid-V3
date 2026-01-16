import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createCycleSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  runType: z.enum(['REGULAR', 'BONUS', 'ARREARS']).default('REGULAR'),
})

// GET /api/hr/payroll/cycles - List payroll cycles
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const cycles = await prisma.payrollCycle.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { payrollRuns: true },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      take: limit,
    })

    return NextResponse.json({ cycles })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get payroll cycles error:', error)
    return NextResponse.json(
      { error: 'Failed to get payroll cycles', cycles: [] },
      { status: 500 }
    )
  }
}

// POST /api/hr/payroll/cycles - Create a new payroll cycle
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = createCycleSchema.parse(body)

    // Check if cycle already exists
    const existing = await prisma.payrollCycle.findUnique({
      where: {
        tenantId_month_year_runType: {
          tenantId,
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
        tenantId,
        month: validated.month,
        year: validated.year,
        runType: validated.runType,
        status: 'DRAFT',
      },
    })

    return NextResponse.json({ cycle }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create payroll cycle error:', error)
    return NextResponse.json(
      { error: 'Failed to create payroll cycle' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updatePayrollCycleSchema = z.object({
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'LOCKED', 'PAID']).optional(),
})

// GET /api/hr/payroll/cycles/[id] - Get a single payroll cycle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const cycle = await prisma.payrollCycle.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        payrollRuns: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { payrollRuns: true },
        },
      },
    })

    if (!cycle) {
      return NextResponse.json(
        { error: 'Payroll cycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cycle)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get payroll cycle error:', error)
    return NextResponse.json(
      { error: 'Failed to get payroll cycle' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/payroll/cycles/[id] - Update payroll cycle status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const existing = await prisma.payrollCycle.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Payroll cycle not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updatePayrollCycleSchema.parse(body)

    const cycle = await prisma.payrollCycle.update({
      where: { id: resolvedParams.id },
      data: {
        status: validated.status,
      },
    })

    return NextResponse.json(cycle)
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

    console.error('Update payroll cycle error:', error)
    return NextResponse.json(
      { error: 'Failed to update payroll cycle' },
      { status: 500 }
    )
  }
}

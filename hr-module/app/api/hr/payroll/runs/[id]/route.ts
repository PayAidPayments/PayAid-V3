import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updatePayrollRunSchema = z.object({
  grossEarningsInr: z.number().positive().optional(),
  tdsInr: z.number().min(0).optional(),
  pfEmployeeInr: z.number().min(0).optional(),
  esiEmployeeInr: z.number().min(0).optional(),
  ptInr: z.number().min(0).optional(),
  lopDays: z.number().min(0).optional(),
  lopAmountInr: z.number().min(0).optional(),
})

// GET /api/hr/payroll/runs/[id] - Get a single payroll run
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const run = await prisma.payrollRun.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
          },
        },
        cycle: true,
        adjustments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Payroll run not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(run)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get payroll run error:', error)
    return NextResponse.json(
      { error: 'Failed to get payroll run' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/payroll/runs/[id] - Update payroll run (manual adjustment)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireHRAccess(request)

    const existing = await prisma.payrollRun.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        cycle: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Payroll run not found' },
        { status: 404 }
      )
    }

    if (existing.cycle.status === 'LOCKED' || existing.cycle.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot modify payroll for locked or paid cycle' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = updatePayrollRunSchema.parse(body)

    const updateData: any = {}
    const adjustments: Array<{
      componentName: string
      originalAmount: Decimal
      adjustedAmount: Decimal
      reason: string
    }> = []

    if (validated.grossEarningsInr !== undefined) {
      adjustments.push({
        componentName: 'Gross Earnings',
        originalAmount: existing.grossEarningsInr,
        adjustedAmount: new Decimal(validated.grossEarningsInr.toString()),
        reason: 'Manual adjustment',
      })
      updateData.grossEarningsInr = new Decimal(validated.grossEarningsInr.toString())
    }
    if (validated.tdsInr !== undefined) {
      adjustments.push({
        componentName: 'TDS',
        originalAmount: existing.tdsInr,
        adjustedAmount: new Decimal(validated.tdsInr.toString()),
        reason: 'Manual adjustment',
      })
      updateData.tdsInr = new Decimal(validated.tdsInr.toString())
    }
    if (validated.pfEmployeeInr !== undefined) {
      adjustments.push({
        componentName: 'PF Employee',
        originalAmount: existing.pfEmployeeInr,
        adjustedAmount: new Decimal(validated.pfEmployeeInr.toString()),
        reason: 'Manual adjustment',
      })
      updateData.pfEmployeeInr = new Decimal(validated.pfEmployeeInr.toString())
    }
    if (validated.esiEmployeeInr !== undefined) {
      adjustments.push({
        componentName: 'ESI Employee',
        originalAmount: existing.esiEmployeeInr,
        adjustedAmount: new Decimal(validated.esiEmployeeInr.toString()),
        reason: 'Manual adjustment',
      })
      updateData.esiEmployeeInr = new Decimal(validated.esiEmployeeInr.toString())
    }
    if (validated.ptInr !== undefined) {
      adjustments.push({
        componentName: 'PT',
        originalAmount: existing.ptInr,
        adjustedAmount: new Decimal(validated.ptInr.toString()),
        reason: 'Manual adjustment',
      })
      updateData.ptInr = new Decimal(validated.ptInr.toString())
    }
    if (validated.lopDays !== undefined) {
      updateData.lopDays = new Decimal(validated.lopDays.toString())
    }
    if (validated.lopAmountInr !== undefined) {
      updateData.lopAmountInr = new Decimal(validated.lopAmountInr.toString())
    }

    // Recalculate net pay
    const grossDeductions = (updateData.pfEmployeeInr || existing.pfEmployeeInr)
      .add(updateData.esiEmployeeInr || existing.esiEmployeeInr)
      .add(updateData.ptInr || existing.ptInr)
      .add(updateData.tdsInr || existing.tdsInr)
      .add(updateData.lopAmountInr || existing.lopAmountInr)

    updateData.grossDeductionsInr = grossDeductions
    updateData.netPayInr = (updateData.grossEarningsInr || existing.grossEarningsInr).sub(
      grossDeductions
    )

    // Update payroll run and create adjustments
    const updated = await prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.update({
        where: { id: params.id },
        data: updateData,
      })

      // Create adjustment records
      for (const adj of adjustments) {
        await tx.payrollAdjustment.create({
          data: {
            payrollRunId: params.id,
            componentName: adj.componentName,
            originalAmount: adj.originalAmount,
            adjustedAmount: adj.adjustedAmount,
            reason: adj.reason,
            adjustedBy: userId,
          },
        })
      }

      return run
    })

    return NextResponse.json(updated)
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

    console.error('Update payroll run error:', error)
    return NextResponse.json(
      { error: 'Failed to update payroll run' },
      { status: 500 }
    )
  }
}

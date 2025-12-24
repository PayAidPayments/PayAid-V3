import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculatePayroll } from '@/lib/payroll/calculation-engine'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const calculatePayrollSchema = z.object({
  employeeId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  daysWorked: z.number().optional(),
  totalDays: z.number().optional(),
  lopDays: z.number().optional(),
  variablePayments: z.record(z.number()).optional(),
})

// POST /api/hr/payroll/calculate - Calculate payroll (preview)
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = calculatePayrollSchema.parse(body)

    const calculation = await calculatePayroll({
      employeeId: validated.employeeId,
      tenantId: tenantId,
      month: validated.month,
      year: validated.year,
      daysWorked: validated.daysWorked,
      totalDays: validated.totalDays,
      lopDays: validated.lopDays ? new Decimal(validated.lopDays) : undefined,
      variablePayments: validated.variablePayments,
    })

    return NextResponse.json({
      employeeId: validated.employeeId,
      month: validated.month,
      year: validated.year,
      earnings: {
        gross: Number(calculation.grossEarningsInr),
        breakdown: Object.fromEntries(
          Object.entries(calculation.componentBreakdown.earnings).map(([k, v]) => [
            k,
            Number(v),
          ])
        ),
      },
      deductions: {
        total: Number(calculation.grossDeductionsInr),
        breakdown: {
          pf: Number(calculation.pfEmployeeInr),
          esi: Number(calculation.esiEmployeeInr),
          pt: Number(calculation.ptInr),
          tds: Number(calculation.tdsInr),
          lop: Number(calculation.lopAmountInr),
        },
      },
      netPay: Number(calculation.netPayInr),
      employerContributions: {
        pf: Number(calculation.pfEmployerInr),
        esi: Number(calculation.esiEmployerInr),
      },
      daysPaid: calculation.daysPaid,
      lopDays: Number(calculation.lopDays),
    })
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

    console.error('Calculate payroll error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate payroll' },
      { status: 500 }
    )
  }
}


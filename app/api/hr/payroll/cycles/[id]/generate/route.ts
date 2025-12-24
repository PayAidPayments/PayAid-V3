import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculatePayroll } from '@/lib/payroll/calculation-engine'
import { Decimal } from '@prisma/client/runtime/library'

// POST /api/hr/payroll/cycles/[id]/generate - Generate payroll runs for all employees
export async function POST(
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
    })

    if (!cycle) {
      return NextResponse.json(
        { error: 'Payroll cycle not found' },
        { status: 404 }
      )
    }

    if (cycle.status === 'LOCKED' || cycle.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot generate payroll for locked or paid cycle' },
        { status: 400 }
      )
    }

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: {
        tenantId: tenantId,
        status: { in: ['ACTIVE', 'PROBATION'] },
      },
    })

    const payrollRuns = []
    const errors = []

    for (const employee of employees) {
      try {
        // Check if payroll run already exists
        const existing = await prisma.payrollRun.findUnique({
          where: {
            tenantId_cycleId_employeeId: {
              tenantId: tenantId,
              cycleId: resolvedParams.id,
              employeeId: employee.id,
            },
          },
        })

        if (existing) {
          continue // Skip if already generated
        }

        // Get attendance records for the month
        const startDate = new Date(cycle.year, cycle.month - 1, 1)
        const endDate = new Date(cycle.year, cycle.month, 0)

        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            employeeId: employee.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
            status: 'PRESENT',
          },
        })

        const daysWorked = attendanceRecords.length
        const totalDays = getWorkingDaysInMonth(cycle.month, cycle.year)
        const lopDays = Math.max(0, totalDays - daysWorked)

        // Calculate payroll
        const calculation = await calculatePayroll({
          employeeId: employee.id,
          tenantId: tenantId,
          month: cycle.month,
          year: cycle.year,
          daysWorked,
          totalDays,
          lopDays: new Decimal(lopDays),
        })

        // Create payroll run
        const payrollRun = await prisma.payrollRun.create({
          data: {
            cycleId: resolvedParams.id,
            employeeId: employee.id,
            grossEarningsInr: calculation.grossEarningsInr,
            grossDeductionsInr: calculation.grossDeductionsInr,
            tdsInr: calculation.tdsInr,
            pfEmployeeInr: calculation.pfEmployeeInr,
            pfEmployerInr: calculation.pfEmployerInr,
            esiEmployeeInr: calculation.esiEmployeeInr,
            esiEmployerInr: calculation.esiEmployerInr,
            ptInr: calculation.ptInr,
            lopDays: calculation.lopDays,
            lopAmountInr: calculation.lopAmountInr,
            netPayInr: calculation.netPayInr,
            daysPaid: calculation.daysPaid,
            payoutStatus: 'PENDING',
            generatedAt: new Date(),
            tenantId: tenantId,
          },
        })

        payrollRuns.push(payrollRun)
      } catch (error: any) {
        errors.push({
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          error: error.message,
        })
      }
    }

    // Update cycle status
    await prisma.payrollCycle.update({
      where: { id: resolvedParams.id },
      data: { status: 'IN_PROGRESS' },
    })

    return NextResponse.json({
      message: `Generated ${payrollRuns.length} payroll runs`,
      payrollRuns,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Generate payroll error:', error)
    return NextResponse.json(
      { error: 'Failed to generate payroll' },
      { status: 500 }
    )
  }
}

function getWorkingDaysInMonth(month: number, year: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let workingDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    if (date.getDay() !== 0) {
      workingDays++
    }
  }

  return workingDays
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculatePayroll as calculatePayrollEngine } from '@/lib/payroll/calculation-engine'

// POST /api/hr/payroll/cycles/[id]/run - Run payroll for a cycle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id: cycleId } = await params
    const body = await request.json()
    const { employeeIds } = body // Optional: specific employees, or all if not provided

    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: cycleId, tenantId },
      include: {
        payrollRuns: true,
      },
    })

    if (!cycle) {
      return NextResponse.json(
        { error: 'Payroll cycle not found' },
        { status: 404 }
      )
    }

    if (cycle.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Payroll cycle is locked and cannot be modified' },
        { status: 400 }
      )
    }

    // Get employees
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        ...(employeeIds && employeeIds.length > 0
          ? { id: { in: employeeIds } }
          : { status: 'ACTIVE' }),
      },
      include: {
        employeeSalaryStructures: {
          where: {
            effectiveFrom: { lte: new Date(cycle.year, cycle.month - 1, 1) },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: new Date(cycle.year, cycle.month - 1, 1) } },
            ],
          },
          include: {
            structure: true,
          },
          take: 1,
          orderBy: { effectiveFrom: 'desc' },
        },
        attendanceRecords: {
          where: {
            date: {
              gte: new Date(cycle.year, cycle.month - 1, 1),
              lt: new Date(cycle.year, cycle.month, 1),
            },
          },
        },
      },
    })

    const payrollRuns: any[] = []

    for (const employee of employees) {
      // Skip if payroll already exists
      const existingRun = cycle.payrollRuns.find((r) => r.employeeId === employee.id)
      if (existingRun) {
        continue
      }

      const salaryStructure = employee.employeeSalaryStructures[0]?.structure
      if (!salaryStructure) {
        continue // Skip employees without salary structure
      }

      // Calculate days worked from attendance
      const daysWorked = employee.attendanceRecords.filter(
        (a) => a.status === 'PRESENT' || a.status === 'HALF_DAY'
      ).length
      const totalDays = new Date(cycle.year, cycle.month, 0).getDate()
      const lopDays = totalDays - daysWorked

      // Calculate payroll using the engine
      const payrollResult = await calculatePayrollEngine({
        employeeId: employee.id,
        tenantId,
        month: cycle.month,
        year: cycle.year,
        daysWorked,
        totalDays,
        lopDays: lopDays > 0 ? lopDays : 0,
      })

      // Create payroll run
      const run = await prisma.payrollRun.create({
        data: {
          cycleId: cycle.id,
          employeeId: employee.id,
          tenantId,
          grossEarningsInr: payrollResult.grossEarnings,
          grossDeductionsInr: payrollResult.grossDeductions,
          tdsInr: payrollResult.tds,
          pfEmployeeInr: payrollResult.pfEmployee,
          pfEmployerInr: payrollResult.pfEmployer,
          esiEmployeeInr: payrollResult.esiEmployee,
          esiEmployerInr: payrollResult.esiEmployer,
          ptInr: payrollResult.pt,
          lopDays: payrollResult.lopDays,
          lopAmountInr: payrollResult.lopAmount,
          netPayInr: payrollResult.netPay,
          daysPaid: payrollResult.daysPaid,
          payoutStatus: 'PENDING',
        },
      })

      payrollRuns.push(run)
    }

    // Update cycle status to ACTIVE if it was DRAFT
    if (cycle.status === 'DRAFT' && payrollRuns.length > 0) {
      await prisma.payrollCycle.update({
        where: { id: cycleId },
        data: { status: 'ACTIVE' },
      })
    }

    return NextResponse.json({
      success: true,
      runsCreated: payrollRuns.length,
      runs: payrollRuns,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Run payroll error:', error)
    return NextResponse.json(
      { error: 'Failed to run payroll' },
      { status: 500 }
    )
  }
}


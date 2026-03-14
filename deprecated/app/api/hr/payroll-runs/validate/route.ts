import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/payroll-runs/validate
 * Validate payroll run before processing - detects anomalies and errors
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { payrollMonth, departmentId, includeContractors, includeBonuses, includeArrears } = body

    if (!payrollMonth) {
      return NextResponse.json(
        { error: 'Payroll month is required' },
        { status: 400 }
      )
    }

    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      anomalies: [] as string[],
      summary: {
        totalEmployees: 0,
        totalContractors: 0,
        totalAmount: 0,
        anomaliesCount: 0,
      },
    }

    // Get employees for payroll
    const employeeWhere: any = { tenantId, status: 'ACTIVE' }
    if (departmentId) employeeWhere.departmentId = departmentId

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      include: {
        salaryStructure: true,
      },
    })

    validationResults.summary.totalEmployees = employees.length

    // Validate each employee's payroll data
    for (const employee of employees) {
      // Check for missing salary structure
      if (!employee.salaryStructure) {
        validationResults.errors.push(
          `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) has no salary structure assigned`
        )
        validationResults.isValid = false
      }

      // Check for unusual salary amounts
      if (employee.ctcAnnualInr) {
        const monthlySalary = employee.ctcAnnualInr / 12
        if (monthlySalary < 10000) {
          validationResults.warnings.push(
            `Employee ${employee.employeeCode} has unusually low salary: ₹${monthlySalary.toLocaleString('en-IN')}/month`
          )
        }
        if (monthlySalary > 500000) {
          validationResults.warnings.push(
            `Employee ${employee.employeeCode} has unusually high salary: ₹${monthlySalary.toLocaleString('en-IN')}/month`
          )
        }
        validationResults.summary.totalAmount += monthlySalary
      }

      // Check for missing bank details (would need bank table)
      // Check for missing statutory compliance flags
      if (employee.ctcAnnualInr && employee.ctcAnnualInr > 15000 && !employee.pfApplicable) {
        validationResults.warnings.push(
          `Employee ${employee.employeeCode} (Salary: ₹${(employee.ctcAnnualInr / 12).toLocaleString('en-IN')}) should have PF applicable`
        )
      }
    }

    // Check contractors if included
    if (includeContractors) {
      const contractorWhere: any = { tenantId, status: 'ACTIVE' }
      if (departmentId) contractorWhere.departmentId = departmentId

      const contractors = await prisma.contractor.findMany({
        where: contractorWhere,
      })

      validationResults.summary.totalContractors = contractors.length

      for (const contractor of contractors) {
        if (contractor.monthlyRate) {
          validationResults.summary.totalAmount += contractor.monthlyRate

          // Check for missing PAN if TDS applicable
          if (contractor.tdsApplicable && !contractor.panNumber) {
            validationResults.errors.push(
              `Contractor ${contractor.firstName} ${contractor.lastName} has TDS applicable but no PAN number`
            )
            validationResults.isValid = false
          }
        }
      }
    }

    // Check for duplicate payroll runs
    const existingRun = await prisma.payrollRun.findFirst({
      where: {
        tenantId,
        payrollMonth,
        status: { in: ['COMPLETED', 'PROCESSING'] },
      },
    })

    if (existingRun) {
      validationResults.warnings.push(
        `A payroll run already exists for ${payrollMonth} with status: ${existingRun.status}`
      )
    }

    // Check for arrears if included
    if (includeArrears) {
      const totalArrears = await prisma.employee.aggregate({
        where: employeeWhere,
        _sum: {
          // Would need arrears field or separate arrears table
        },
      })

      if (totalArrears._sum) {
        validationResults.warnings.push(
          `Arrears included: Total amount needs verification`
        )
      }
    }

    // Detect anomalies
    // Check for unusual overtime patterns
    const currentMonth = new Date(payrollMonth + '-01')
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    // Would check attendance records for overtime anomalies
    // For now, add placeholder
    validationResults.anomalies.push(
      'Overtime patterns will be analyzed during processing'
    )

    validationResults.summary.anomaliesCount = validationResults.anomalies.length

    return NextResponse.json({
      ...validationResults,
      validatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

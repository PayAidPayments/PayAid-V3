import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/hr/payroll/reports/form-16 - Generate Form 16 for employee
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const financialYear = searchParams.get('financialYear') || getCurrentFinancialYear()

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Get payroll runs for the financial year
    const fyStartMonth = 4 // April
    const fyStartYear = parseInt(financialYear.split('-')[0])
    const fyEndMonth = 3 // March
    const fyEndYear = parseInt(financialYear.split('-')[1])

    const payrollRuns = await prisma.payrollRun.findMany({
      where: {
        employeeId,
        tenantId: tenantId,
        OR: [
          {
            cycle: {
              year: fyStartYear,
              month: { gte: fyStartMonth },
            },
          },
          {
            cycle: {
              year: fyEndYear,
              month: { lte: fyEndMonth },
            },
          },
        ],
      },
      include: {
        cycle: true,
      },
      orderBy: [
        { cycle: { year: 'asc' } },
        { cycle: { month: 'asc' } },
      ],
    })

    // Get tax declarations
    const taxDeclarations = await prisma.employeeTaxDeclaration.findMany({
      where: {
        employeeId,
        financialYear,
        status: 'APPROVED',
      },
      include: {
        category: true,
      },
    })

    // Calculate annual totals
    const annualGross = payrollRuns.reduce(
      (sum, run) => sum + Number(run.grossEarningsInr),
      0
    )
    const annualPF = payrollRuns.reduce(
      (sum, run) => sum + Number(run.pfEmployeeInr),
      0
    )
    const annualTDS = payrollRuns.reduce(
      (sum, run) => sum + Number(run.tdsInr),
      0
    )
    const totalDeductions = taxDeclarations.reduce(
      (sum, decl) => sum + Number(decl.approvedAmountInr || decl.declaredAmountInr),
      0
    )

    // Get TDS config for standard deduction
    const tdsConfig = await prisma.tDSConfig.findUnique({
      where: { tenantId: tenantId },
    })

    const standardDeduction = Number(tdsConfig?.standardDeduction || 50000)
    const taxableIncome = annualGross - annualPF - standardDeduction - totalDeductions

    const form16Data = {
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        pan: employee.panNumber || '',
        employeeCode: employee.employeeCode,
      },
      employer: {
        // TODO: Get from tenant/company details
        name: 'Company Name',
        pan: 'COMPANYPAN',
        tan: 'COMPANYTAN',
      },
      financialYear,
      salaryDetails: {
        grossSalary: Number(annualGross),
        standardDeduction: Number(standardDeduction),
        deductions: {
          section80C: Number(
            taxDeclarations
              .filter((d) => d.category.code === '80C')
              .reduce((sum, d) => sum + Number(d.approvedAmountInr || d.declaredAmountInr), 0)
          ),
          section80D: Number(
            taxDeclarations
              .filter((d) => d.category.code === '80D')
              .reduce((sum, d) => sum + Number(d.approvedAmountInr || d.declaredAmountInr), 0)
          ),
          hra: Number(
            taxDeclarations
              .filter((d) => d.category.code === 'HRA')
              .reduce((sum, d) => sum + Number(d.approvedAmountInr || d.declaredAmountInr), 0)
          ),
          other: Number(
            taxDeclarations
              .filter((d) => !['80C', '80D', 'HRA'].includes(d.category.code))
              .reduce((sum, d) => sum + Number(d.approvedAmountInr || d.declaredAmountInr), 0)
          ),
        },
        totalDeductions: Number(totalDeductions),
        taxableIncome: Number(taxableIncome),
      },
      taxDetails: {
        totalTaxDeducted: Number(annualTDS),
        monthlyBreakdown: payrollRuns.map((run) => ({
          month: run.cycle.month,
          year: run.cycle.year,
          gross: Number(run.grossEarningsInr),
          tds: Number(run.tdsInr),
        })),
      },
    }

    return NextResponse.json(form16Data)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Generate Form 16 error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Form 16' },
      { status: 500 }
    )
  }
}

function getCurrentFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  if (month >= 4) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}

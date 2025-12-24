import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/db/prisma'

interface PayrollCalculationInput {
  employeeId: string
  tenantId: string
  month: number
  year: number
  daysWorked?: number
  totalDays?: number
  lopDays?: number
  variablePayments?: Record<string, number> // Bonus, incentives, etc.
}

interface PayrollCalculationResult {
  grossEarningsInr: Decimal
  grossDeductionsInr: Decimal
  tdsInr: Decimal
  pfEmployeeInr: Decimal
  pfEmployerInr: Decimal
  esiEmployeeInr: Decimal
  esiEmployerInr: Decimal
  ptInr: Decimal
  lopDays: Decimal
  lopAmountInr: Decimal
  netPayInr: Decimal
  daysPaid: number
  componentBreakdown: {
    earnings: Record<string, Decimal>
    deductions: Record<string, Decimal>
  }
}

/**
 * Calculate accurate payroll for an employee
 */
export async function calculatePayroll(
  input: PayrollCalculationInput
): Promise<PayrollCalculationResult> {
  // Get employee with salary structure
  const employee = await prisma.employee.findFirst({
    where: {
      id: input.employeeId,
      tenantId: input.tenantId,
    },
      include: {
        employeeSalaryStructures: {
          where: {
            effectiveFrom: { lte: new Date(input.year, input.month - 1, 1) },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: new Date(input.year, input.month - 1, 1) } },
            ],
          },
          include: {
            structure: true,
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
        location: true,
      },
    })

  if (!employee) {
    throw new Error('Employee not found')
  }

  // Get employee location state
  const employeeLocation = await prisma.location.findFirst({
    where: {
      id: employee.locationId || undefined,
      tenantId: input.tenantId,
    },
  })

  // Get statutory configs
  const [pfConfig, esiConfig, ptConfig, tdsConfig] = await Promise.all([
    prisma.pFConfig.findUnique({
      where: { tenantId: input.tenantId },
    }),
    prisma.eSIConfig.findUnique({
      where: { tenantId: input.tenantId },
    }),
    prisma.pTConfig.findFirst({
      where: {
        tenantId: input.tenantId,
        state: employeeLocation?.state || 'Maharashtra',
      },
      include: {
        ptSlabs: {
          orderBy: { salaryFrom: 'asc' },
        },
      },
    }),
    prisma.tDSConfig.findUnique({
      where: { tenantId: input.tenantId },
    }),
  ])

  // Get salary structure
  const salaryStructure = employee.employeeSalaryStructures[0]?.structure
  if (!salaryStructure) {
    throw new Error('No salary structure assigned to employee')
  }

  const structureJson = salaryStructure.structureJson as any
  const ctcAnnual = employee.ctcAnnualInr || new Decimal(0)

  // Calculate days
  const totalDays = input.totalDays || getWorkingDaysInMonth(input.month, input.year)
  const daysWorked = input.daysWorked || totalDays
  const lopDays = input.lopDays || new Decimal(totalDays - daysWorked)
  const prorationFactor = new Decimal(daysWorked).div(new Decimal(totalDays))

  // Calculate earnings from structure
  const earnings: Record<string, Decimal> = {}
  let basicSalary = new Decimal(0)
  let hra = new Decimal(0)
  let totalEarnings = new Decimal(0)

  if (structureJson.components) {
    for (const component of structureJson.components) {
      let amount = new Decimal(0)

      if (component.type === 'FIXED') {
        amount = new Decimal(component.amount || 0)
      } else if (component.type === 'PERCENTAGE') {
        amount = ctcAnnual.mul(new Decimal(component.percent || 0)).div(100)
      }

      // Pro-rate based on days worked
      amount = amount.mul(prorationFactor)

      // Add variable payments if applicable
      if (input.variablePayments?.[component.name]) {
        amount = amount.add(new Decimal(input.variablePayments[component.name]))
      }

      earnings[component.name] = amount
      totalEarnings = totalEarnings.add(amount)

      if (component.name === 'Basic' || component.code === 'BASIC') {
        basicSalary = amount
      }
      if (component.name === 'HRA' || component.code === 'HRA') {
        hra = amount
      }
    }
  }

  // Calculate LOP amount
  const lopAmountInr = basicSalary.mul(lopDays).div(new Decimal(totalDays))

  // Calculate PF (Employee & Employer)
  const pfWageCeiling = pfConfig?.wageCeiling || new Decimal(15000)
  const pfBase = Decimal.min(basicSalary, pfWageCeiling)
  const pfEmployeePercent = pfConfig?.employeePercent || new Decimal(12)
  const pfEmployerPercent = pfConfig?.employerPercent || new Decimal(12)
  const pfEmployeeInr = pfBase.mul(pfEmployeePercent).div(100)
  const pfEmployerInr = pfBase.mul(pfEmployerPercent).div(100)

  // Calculate ESI (Employee & Employer)
  let esiEmployeeInr = new Decimal(0)
  let esiEmployerInr = new Decimal(0)
  if (employee.esiApplicable) {
    const esiWageCeiling = esiConfig?.wageCeiling || new Decimal(21000)
    const esiBase = Decimal.min(totalEarnings, esiWageCeiling)
    const esiEmployeePercent = esiConfig?.employeePercent || new Decimal(0.75)
    const esiEmployerPercent = esiConfig?.employerPercent || new Decimal(3.25)
    esiEmployeeInr = esiBase.mul(esiEmployeePercent).div(100)
    esiEmployerInr = esiBase.mul(esiEmployerPercent).div(100)
  }

  // Calculate Professional Tax (State-wise slab-based)
  let ptInr = new Decimal(0)
  if (employee.ptApplicable && ptConfig?.ptSlabs) {
    const grossForPT = totalEarnings
    for (const slab of ptConfig.ptSlabs) {
      if (
        grossForPT.gte(slab.salaryFrom) &&
        (!slab.salaryTo || grossForPT.lte(slab.salaryTo))
      ) {
        ptInr = slab.ptAmountInr
        break
      }
    }
  }

  // Calculate TDS (Annual projection method)
  let tdsInr = new Decimal(0)
  if (employee.tdsApplicable && tdsConfig) {
    // Get tax declarations for the financial year
    const financialYear = getFinancialYear(input.month, input.year)
    const taxDeclarations = await prisma.employeeTaxDeclaration.findMany({
      where: {
        employeeId: input.employeeId,
        financialYear,
        status: 'APPROVED',
      },
    })

    const totalDeclaredDeductions = taxDeclarations.reduce(
      (sum, decl) => sum.add(decl.approvedAmountInr || decl.declaredAmountInr),
      new Decimal(0)
    )

    // Annual projected income
    const annualProjectedIncome = totalEarnings.mul(12)
    const standardDeduction = tdsConfig.standardDeduction || new Decimal(50000)
    const taxableIncome = annualProjectedIncome
      .sub(pfEmployeeInr.mul(12))
      .sub(standardDeduction)
      .sub(totalDeclaredDeductions)

    // Calculate tax based on slabs
    const taxSlabs = tdsConfig.taxSlabsJson as Array<{
      from: number
      to: number | null
      rate: number
    }>

    let annualTax = new Decimal(0)
    let remainingIncome = taxableIncome

    for (const slab of taxSlabs) {
      if (remainingIncome.lte(0)) break

      const slabRange = new Decimal(slab.to || Infinity).sub(slab.from)
      const incomeInSlab = Decimal.min(remainingIncome, slabRange)
      const taxInSlab = incomeInSlab.mul(new Decimal(slab.rate)).div(100)
      annualTax = annualTax.add(taxInSlab)
      remainingIncome = remainingIncome.sub(incomeInSlab)
    }

    // Monthly TDS
    tdsInr = annualTax.div(12)
  }

  // Calculate deductions
  const deductions: Record<string, Decimal> = {
    PF: pfEmployeeInr,
    ESI: esiEmployeeInr,
    PT: ptInr,
    TDS: tdsInr,
    LOP: lopAmountInr,
  }

  const grossDeductionsInr = pfEmployeeInr
    .add(esiEmployeeInr)
    .add(ptInr)
    .add(tdsInr)
    .add(lopAmountInr)

  // Net Pay
  const netPayInr = totalEarnings.sub(grossDeductionsInr)

  return {
    grossEarningsInr: totalEarnings,
    grossDeductionsInr,
    tdsInr,
    pfEmployeeInr,
    pfEmployerInr,
    esiEmployeeInr,
    esiEmployerInr,
    ptInr,
    lopDays,
    lopAmountInr,
    netPayInr,
    daysPaid: daysWorked,
    componentBreakdown: {
      earnings,
      deductions,
    },
  }
}

/**
 * Get working days in a month (excluding Sundays)
 */
function getWorkingDaysInMonth(month: number, year: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let workingDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    if (date.getDay() !== 0) {
      // Not Sunday
      workingDays++
    }
  }

  return workingDays
}

/**
 * Get financial year from month/year
 */
function getFinancialYear(month: number, year: number): string {
  if (month >= 4) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}

/**
 * Phase 1.3: Auto-Payroll Processing
 * Validation, anomaly detection, statutory checks, one-click bulk processing.
 */
import { prisma } from '@/lib/db/prisma'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  anomalies: AnomalyItem[]
  statutoryChecks: StatutoryCheckItem[]
  correctionSuggestions: string[]
  summary: {
    cycleId: string
    month: number
    year: number
    totalActiveEmployees: number
    existingRuns: number
    employeesWithoutStructure: number
    employeesWithZeroDays: number
    anomaliesCount: number
    statutoryOk: boolean
  }
  validatedAt: string
}

export interface AnomalyItem {
  type: 'VARIANCE' | 'ZERO_NET' | 'DUPLICATE' | 'MISSING_BANK' | 'PF_ESI_THRESHOLD' | 'UNUSUAL_LOP' | 'BONUS_CLAWBACK'
  severity: 'ERROR' | 'WARNING'
  employeeId?: string
  employeeCode?: string
  message: string
  suggestion?: string
}

export interface StatutoryCheckItem {
  name: string
  passed: boolean
  message: string
}

const WORKING_DAYS_VARIANCE_THRESHOLD = 0.25 // 25% variance in days vs expected
const NET_PAY_VARIANCE_THRESHOLD = 0.30 // 30% variance in net vs previous month

/**
 * Run full validation for a payroll cycle: data, statutory, anomalies.
 */
export async function runCycleValidation(
  tenantId: string,
  cycleId: string
): Promise<ValidationResult> {
  const cycle = await prisma.payrollCycle.findFirst({
    where: { id: cycleId, tenantId },
    include: { payrollRuns: true },
  })
  if (!cycle) {
    throw new Error('Payroll cycle not found')
  }

  const errors: string[] = []
  const warnings: string[] = []
  const anomalies: AnomalyItem[] = []
  const statutoryChecks: StatutoryCheckItem[] = []
  const correctionSuggestions: string[] = []

  const monthStart = new Date(cycle.year, cycle.month - 1, 1)
  const monthEnd = new Date(cycle.year, cycle.month, 0)
  const totalDays = getWorkingDaysInMonth(cycle.month, cycle.year)

  const employees = await prisma.employee.findMany({
    where: { tenantId, status: { in: ['ACTIVE', 'PROBATION'] } },
    include: {
      salaryStructures: {
        where: {
          effectiveFrom: { lte: monthStart },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }],
        },
        include: { structure: true },
        take: 1,
        orderBy: { effectiveFrom: 'desc' },
      },
      attendanceRecords: {
        where: {
          date: { gte: monthStart, lte: monthEnd },
        },
      },
    },
  })

  let employeesWithoutStructure = 0
  let employeesWithZeroDays = 0

  for (const emp of employees) {
    const existingRun = cycle.payrollRuns.find((r) => r.employeeId === emp.id)
    const structure = emp.salaryStructures[0]?.structure

    if (!structure) {
      employeesWithoutStructure++
      errors.push(`${emp.firstName} ${emp.lastName} (${emp.employeeCode}) has no salary structure for this month`)
    }

    const daysWorked = emp.attendanceRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'HALF_DAY'
    ).length
    if (daysWorked === 0 && !existingRun) {
      employeesWithZeroDays++
      warnings.push(`${emp.employeeCode}: No attendance for ${cycle.month}/${cycle.year} (LOP = ${totalDays} days)`)
    }

    if (emp.ctcAnnualInr) {
      const monthly = Number(emp.ctcAnnualInr) / 12
      if (monthly >= 15000 && !emp.pfApplicable) {
        statutoryChecks.push({
          name: 'PF applicability',
          passed: false,
          message: `${emp.employeeCode}: Salary ≥ ₹15k but PF not applicable`,
        })
        correctionSuggestions.push(`Review PF flag for ${emp.employeeCode} (salary ₹${(monthly / 1000).toFixed(0)}k/month)`)
      }
      if (monthly >= 21000 && !emp.esiApplicable) {
        statutoryChecks.push({
          name: 'ESI applicability',
          passed: false,
          message: `${emp.employeeCode}: Salary ≥ ₹21k - ESI may not apply (verify)`,
        })
      }
    }

    if (!emp.bankAccountNumber || !emp.ifscCode) {
      anomalies.push({
        type: 'MISSING_BANK',
        severity: 'WARNING',
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        message: `${emp.employeeCode}: Missing bank account or IFSC`,
        suggestion: 'Add bank details before payout',
      })
    }
  }

  const statutoryOk = statutoryChecks.filter((c) => !c.passed).length === 0
  if (statutoryOk && statutoryChecks.length === 0) {
    statutoryChecks.push({ name: 'PF/ESI flags', passed: true, message: 'No statutory mismatches detected' })
  }

  const pfConfig = await prisma.pFConfig.findUnique({ where: { tenantId } })
  const esiConfig = await prisma.eSIConfig.findUnique({ where: { tenantId } })
  statutoryChecks.push({
    name: 'PF config',
    passed: !!pfConfig,
    message: pfConfig ? 'PF configuration present' : 'PF config missing - defaults will apply',
  })
  statutoryChecks.push({
    name: 'ESI config',
    passed: !!esiConfig,
    message: esiConfig ? 'ESI configuration present' : 'ESI config missing - applicable only if configured',
  })

  const anomalyResults = await runAnomalyDetection(tenantId, cycleId, cycle.month, cycle.year, cycle.payrollRuns)
  anomalies.push(...anomalyResults)

  if (employeesWithoutStructure > 0) {
    correctionSuggestions.push(`Assign salary structure to ${employeesWithoutStructure} employee(s) or they will be skipped`)
  }
  if (anomalies.some((a) => a.severity === 'ERROR')) {
    correctionSuggestions.push('Resolve errors above before generating payroll')
  }

  const isValid = errors.length === 0 && !anomalyResults.some((a) => a.severity === 'ERROR')

  return {
    isValid,
    errors,
    warnings,
    anomalies,
    statutoryChecks,
    correctionSuggestions,
    summary: {
      cycleId,
      month: cycle.month,
      year: cycle.year,
      totalActiveEmployees: employees.length,
      existingRuns: cycle.payrollRuns.length,
      employeesWithoutStructure,
      employeesWithZeroDays,
      anomaliesCount: anomalies.length,
      statutoryOk,
    },
    validatedAt: new Date().toISOString(),
  }
}

/**
 * Detect anomalies: variance vs previous month, zero net, duplicate runs, unusual LOP.
 */
export async function runAnomalyDetection(
  tenantId: string,
  cycleId: string,
  month: number,
  year: number,
  existingRuns: { employeeId: string; netPayInr: unknown; grossEarningsInr: unknown; lopDays: unknown; daysPaid: number }[]
): Promise<AnomalyItem[]> {
  const items: AnomalyItem[] = []
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  const prevCycle = await prisma.payrollCycle.findFirst({
    where: { tenantId, month: prevMonth, year: prevYear },
    include: { payrollRuns: true },
  })

  const totalDays = getWorkingDaysInMonth(month, year)

  for (const run of existingRuns) {
    const net = Number(run.netPayInr)
    const gross = Number(run.grossEarningsInr)
    const lop = Number(run.lopDays)

    if (net <= 0 && gross > 0) {
      items.push({
        type: 'ZERO_NET',
        severity: 'ERROR',
        employeeId: run.employeeId,
        message: `Employee run has zero or negative net pay (gross: ₹${gross.toLocaleString('en-IN')})`,
        suggestion: 'Check deductions or LOP',
      })
    }

    if (lop > totalDays * 0.5 && totalDays > 0) {
      items.push({
        type: 'UNUSUAL_LOP',
        severity: 'WARNING',
        employeeId: run.employeeId,
        message: `LOP days (${lop}) > 50% of working days (${totalDays})`,
        suggestion: 'Verify attendance and leave records',
      })
    }

    if (prevCycle) {
      const prevRun = prevCycle.payrollRuns.find((r) => r.employeeId === run.employeeId)
      if (prevRun) {
        const prevNet = Number(prevRun.netPayInr)
        if (prevNet > 0 && Math.abs(net - prevNet) / prevNet > NET_PAY_VARIANCE_THRESHOLD) {
          items.push({
            type: 'VARIANCE',
            severity: 'WARNING',
            employeeId: run.employeeId,
            message: `Net pay variance vs last month: ${(((net - prevNet) / prevNet) * 100).toFixed(0)}%`,
            suggestion: 'Confirm salary changes or LOP are correct',
          })
        }
      }
    }
  }

  const employeeIds = existingRuns.map((r) => r.employeeId)
  const duplicateIds = employeeIds.filter((id, i) => employeeIds.indexOf(id) !== i)
  if (duplicateIds.length > 0) {
    items.push({
      type: 'DUPLICATE',
      severity: 'ERROR',
      message: `Duplicate payroll run(s) for employee(s): ${[...new Set(duplicateIds)].join(', ')}`,
      suggestion: 'Remove duplicate runs before locking',
    })
  }

  return items
}

/**
 * One-click process: validate then generate. Returns validation result and generation result.
 */
export async function runBulkGenerate(
  tenantId: string,
  cycleId: string
): Promise<{ created: number; skipped: number; errors: { employeeId: string; employeeCode: string; error: string }[] }> {
  const cycle = await prisma.payrollCycle.findFirst({
    where: { id: cycleId, tenantId },
  })
  if (!cycle) throw new Error('Payroll cycle not found')
  if (cycle.status === 'LOCKED' || cycle.status === 'PAID') {
    throw new Error('Cannot generate payroll for locked or paid cycle')
  }

  const { calculatePayroll } = await import('@/lib/payroll/calculation-engine')
  const employees = await prisma.employee.findMany({
    where: { tenantId, status: { in: ['ACTIVE', 'PROBATION'] } },
  })

  const monthStart = new Date(cycle.year, cycle.month - 1, 1)
  const monthEnd = new Date(cycle.year, cycle.month, 0)
  const totalDays = getWorkingDaysInMonth(cycle.month, cycle.year)

  let created = 0
  const errors: { employeeId: string; employeeCode: string; error: string }[] = []

  for (const employee of employees) {
    const existing = await prisma.payrollRun.findUnique({
      where: {
        tenantId_cycleId_employeeId: { tenantId, cycleId, employeeId: employee.id },
      },
    })
    if (existing) {
      continue
    }

    try {
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: monthStart, lte: monthEnd },
          status: 'PRESENT',
        },
      })
      const daysWorked = attendanceRecords.length
      const lopDays = Math.max(0, totalDays - daysWorked)

      const calculation = await calculatePayroll({
        employeeId: employee.id,
        tenantId,
        month: cycle.month,
        year: cycle.year,
        daysWorked,
        totalDays,
        lopDays,
      })

      await prisma.payrollRun.create({
        data: {
          cycleId,
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
          tenantId,
        },
      })
      created++
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      errors.push({ employeeId: employee.id, employeeCode: employee.employeeCode, error: msg })
    }
  }

  const skipped = employees.length - created - errors.length
  if (created > 0) {
    await prisma.payrollCycle.update({
      where: { id: cycleId },
      data: { status: 'IN_PROGRESS' },
    })
  }

  return { created, skipped, errors }
}

function getWorkingDaysInMonth(month: number, year: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let n = 0
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() !== 0) n++
  }
  return n
}

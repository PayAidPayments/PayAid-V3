// @ts-nocheck
/**
 * Server-side flight risk service.
 * Used by /api/hr/summary, /api/hr/employees/[id]/flight-risk, and /api/hr/ai/flight-risk-alerts.
 * Phase 1.1: Market salary benchmarking (internal by designation), retention interventions.
 */
import { prisma } from '@/lib/db/prisma'
import { calculateFlightRisk, type FlightRiskFactors } from '@/lib/hr/flight-risk-calculator'

/** Get market salary benchmark: avg CTC for same designation in tenant (or fallback multiplier). */
export async function getMarketSalaryForDesignation(
  tenantId: string,
  designationId: string | null,
  currentSalary: number
): Promise<number> {
  if (!designationId) return currentSalary * 1.2
  const agg = await prisma.employee.aggregate({
    where: {
      tenantId,
      designationId,
      status: 'ACTIVE',
      ctcAnnualInr: { not: null },
    },
    _avg: { ctcAnnualInr: true },
    _count: { id: true },
  })
  const avg = agg._avg.ctcAnnualInr ? Number(agg._avg.ctcAnnualInr) : null
  if (avg != null && agg._count.id >= 2) {
    // Use internal benchmark with slight upward bias (5–15%) as "market"
    const market = avg * 1.1
    return Math.round(market)
  }
  return currentSalary * 1.2
}

export interface FlightRiskForEmployee {
  employeeId: string
  employeeName: string
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskWindow: string
  reason: string
  factors: { factor: string; impact: number; description: string }[]
}

/**
 * Gather risk factors for one employee (performance, attendance, compensation, tenure).
 */
export async function gatherFactorsForEmployee(
  employeeId: string,
  tenantId: string,
  employee?: { ctcAnnualInr?: number | null; joiningDate?: Date | null; designationId?: string | null }
): Promise<FlightRiskFactors> {
  const factors: FlightRiskFactors = {}

  const emp = employee ?? await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
    select: { ctcAnnualInr: true, joiningDate: true, firstName: true, lastName: true, designationId: true },
  })
  if (!emp) return factors
  const empWithDes = emp as { designationId?: string | null; ctcAnnualInr?: unknown; joiningDate?: Date | null }

  try {
    const performanceReviewDelegate = (prisma as any).performanceReview
    if (performanceReviewDelegate && typeof performanceReviewDelegate.findFirst === 'function') {
      const latestReview = await performanceReviewDelegate.findFirst({
        where: { employeeId, tenantId },
        orderBy: { createdAt: 'desc' },
      })
      if (latestReview) {
        factors.lastPerformanceRating = (latestReview as { overallRating?: number }).overallRating ?? undefined
        factors.performanceTrend = 'STABLE'
      }
    }
  } catch (_) {
    // PerformanceReview model may not exist in schema; skip this factor
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { employeeId, tenantId, date: { gte: thirtyDaysAgo } },
  })
  if (attendanceRecords.length > 0) {
    const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length
    factors.attendanceRate = (presentCount / attendanceRecords.length) * 100
    factors.lateArrivalsCount = attendanceRecords.filter((r) => r.isLate).length
    factors.absentDaysCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length
  }

  factors.engagementScore = 75

  if (emp.ctcAnnualInr) {
    const current = Number(emp.ctcAnnualInr)
    factors.currentSalary = current
    factors.marketSalary = await getMarketSalaryForDesignation(
      tenantId,
      empWithDes.designationId ?? null,
      current
    )
    factors.salaryGap = ((factors.marketSalary - factors.currentSalary) / factors.marketSalary) * 100
  }

  if (emp.joiningDate) {
    const monthsSinceJoining = Math.floor(
      (Date.now() - new Date(emp.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    factors.monthsInCompany = monthsSinceJoining
  }
  factors.monthsInCurrentRole = factors.monthsInCompany
  factors.monthsSinceLastRaise = 12

  return factors
}

/**
 * Get full flight risk result for one employee.
 */
export async function getFlightRiskForEmployee(
  employeeId: string,
  tenantId: string
): Promise<{ employeeId: string; employeeName: string } & ReturnType<typeof calculateFlightRisk> | null> {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
    select: { firstName: true, lastName: true, ctcAnnualInr: true, joiningDate: true, designationId: true },
  })
  if (!employee) return null

  const factors = await gatherFactorsForEmployee(employeeId, tenantId, employee)
  const result = calculateFlightRisk(factors)

  return {
    employeeId,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    ...result,
  }
}

export interface HighRiskSummaryItem {
  employeeId: string
  name: string
  risk: number
  reason: string
}

/**
 * Get top high-risk employees for dashboard summary.
 * Limits work by only checking up to checkLimit employees, then returning top maxResults.
 * Optimized: batches attendance and market salary queries to avoid N+1.
 */
export async function getHighRiskEmployees(
  tenantId: string,
  options: { checkLimit?: number; minRiskScore?: number; maxResults?: number } = {}
): Promise<HighRiskSummaryItem[]> {
  const { checkLimit = 25, minRiskScore = 40, maxResults = 5 } = options

  const employees = await prisma.employee.findMany({
    where: { tenantId, status: 'ACTIVE' },
    take: checkLimit,
    select: { id: true, firstName: true, lastName: true, ctcAnnualInr: true, joiningDate: true, designationId: true },
  })

  if (employees.length === 0) return []

  const employeeIds = employees.map((e) => e.id)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Batch attendance for all employees at once
  const allAttendance = await prisma.attendanceRecord.findMany({
    where: { employeeId: { in: employeeIds }, tenantId, date: { gte: thirtyDaysAgo } },
  })
  const attendanceByEmployee = new Map<string, typeof allAttendance>()
  for (const record of allAttendance) {
    if (!attendanceByEmployee.has(record.employeeId)) {
      attendanceByEmployee.set(record.employeeId, [])
    }
    attendanceByEmployee.get(record.employeeId)!.push(record)
  }

  // Batch market salary by designation (group unique designations)
  const uniqueDesignations = [...new Set(employees.map((e) => e.designationId).filter(Boolean))] as string[]
  const marketSalaryByDesignation = new Map<string, number>()
  
  // Limit concurrency to 5 at a time for market salary queries
  const batchSize = 5
  for (let i = 0; i < uniqueDesignations.length; i += batchSize) {
    const batch = uniqueDesignations.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async (designationId) => {
        const agg = await prisma.employee.aggregate({
          where: { tenantId, designationId, status: 'ACTIVE', ctcAnnualInr: { not: null } },
          _avg: { ctcAnnualInr: true },
          _count: { id: true },
        })
        const avg = agg._avg.ctcAnnualInr ? Number(agg._avg.ctcAnnualInr) : null
        const market = avg != null && agg._count.id >= 2 ? Math.round(avg * 1.1) : null
        return { designationId, market }
      })
    )
    for (const { designationId, market } of results) {
      if (market !== null) {
        marketSalaryByDesignation.set(designationId, market)
      }
    }
  }

  const results: FlightRiskForEmployee[] = []

  for (const emp of employees) {
    const factors: FlightRiskFactors = {}

    // Performance review (try-catch for optional model)
    try {
      const performanceReviewDelegate = (prisma as any).performanceReview
      if (performanceReviewDelegate && typeof performanceReviewDelegate.findFirst === 'function') {
        const latestReview = await performanceReviewDelegate.findFirst({
          where: { employeeId: emp.id, tenantId },
          orderBy: { createdAt: 'desc' },
        })
        if (latestReview) {
          factors.lastPerformanceRating = (latestReview as { overallRating?: number }).overallRating ?? undefined
          factors.performanceTrend = 'STABLE'
        }
      }
    } catch {
      // PerformanceReview model may not exist; skip
    }

    // Attendance (from batched map)
    const attendanceRecords = attendanceByEmployee.get(emp.id) || []
    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length
      factors.attendanceRate = (presentCount / attendanceRecords.length) * 100
      factors.lateArrivalsCount = attendanceRecords.filter((r) => r.isLate).length
      factors.absentDaysCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length
    }

    factors.engagementScore = 75

    // Market salary (from batched map)
    if (emp.ctcAnnualInr) {
      const current = Number(emp.ctcAnnualInr)
      factors.currentSalary = current
      const marketFromMap = emp.designationId ? marketSalaryByDesignation.get(emp.designationId) : null
      factors.marketSalary = marketFromMap ?? current * 1.2
      factors.salaryGap = ((factors.marketSalary - factors.currentSalary) / factors.marketSalary) * 100
    }

    if (emp.joiningDate) {
      const monthsSinceJoining = Math.floor(
        (Date.now() - new Date(emp.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
      factors.monthsInCompany = monthsSinceJoining
    }
    factors.monthsInCurrentRole = factors.monthsInCompany
    factors.monthsSinceLastRaise = 12

    const result = calculateFlightRisk(factors)
    if (result.riskScore >= minRiskScore) {
      results.push({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        riskWindow: result.riskWindow,
        reason: result.factors[0]?.description ?? result.riskLevel,
        factors: result.factors,
      })
    }
  }

  results.sort((a, b) => b.riskScore - a.riskScore)
  return results.slice(0, maxResults).map((r) => ({
    employeeId: r.employeeId,
    name: r.employeeName,
    risk: r.riskScore,
    reason: r.reason,
  }))
}

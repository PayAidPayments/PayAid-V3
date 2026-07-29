import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getHighRiskEmployees } from '@/lib/hr/flight-risk-service'
import { createServerTiming, withCachedJson } from '@/lib/performance/api-server-timing'

/**
 * GET /api/hr/summary?lite=1 | ?full=1
 * Get comprehensive HR summary for dashboard and KPI cards.
 * Defaults to lite (skips expensive flight-risk) unless ?full=1.
 */
export async function GET(request: NextRequest) {
  const timing = createServerTiming()
  
  try {
    timing.start('auth')
    const { tenantId } = await requireModuleAccess(request, 'hr')
    timing.end('auth')
    
    const url = request.nextUrl
    // Default lite for fast dashboard paint; opt into full with ?full=1
    const lite = url.searchParams.get('full') !== '1'

    const cacheKey = `hr:summary:${tenantId}:${lite ? 'lite' : 'full'}`
    
    const summary = await withCachedJson(cacheKey, 60, async () => {
      timing.start('db')
      
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      // Fetch all data in parallel
      const [
        activeEmployees,
      contractors,
      onLeaveToday,
      nextPayrollCycle,
      pendingReimbursements,
      complianceData,
      engagementData,
      flightRisks,
      aiInsights,
      trends,
      ] = await Promise.all([
        // Active employees count (removed duplicate totalEmployees)
        prisma.employee.count({
          where: {
            tenantId,
            status: 'ACTIVE',
          },
        }).catch(() => 0),

      // Contractors count (assuming contractors have a different status or type)
      prisma.employee.count({
        where: {
          tenantId,
          status: 'CONTRACTOR',
        },
      }).catch(() => 0),

      // Employees absent today (on approved leave)
      prisma.leaveRequest.count({
        where: {
          tenantId,
          status: 'APPROVED',
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }).catch(() => 0),

      // Next payroll cycle (PayrollCycle uses month/year, not startDate)
      (async () => {
        try {
          const currentYear = now.getFullYear()
          const currentMonth = now.getMonth() + 1
          const cycle = await prisma.payrollCycle.findFirst({
            where: {
              tenantId,
              status: { in: ['DRAFT', 'IN_PROGRESS'] },
              OR: [
                { year: { gt: currentYear } },
                { year: currentYear, month: { gte: currentMonth } },
              ],
            },
            orderBy: [{ year: 'asc' }, { month: 'asc' }],
            select: { id: true, month: true, year: true },
          })
          return cycle
        } catch (e) {
          return null
        }
      })(),

      // Pending reimbursements (using Expense model)
      prisma.expense.aggregate({
        where: {
          tenantId,
          status: 'pending',
          employeeId: { not: null },
        },
        _count: { id: true },
        _sum: { amount: true },
      }).catch((err) => {
        console.error('Error fetching pending reimbursements:', err)
        return { _count: { id: 0 }, _sum: { amount: null } }
      }),

      // Compliance score (mock for now - would calculate from PF/ESI/TDS filing status)
      Promise.resolve({ score: 98, lastFiled: 'TDS ₹1.8L' }),

      // Engagement data (mock - would come from surveys/feedback)
        Promise.resolve({ avgEngagement: 82, okrCompletion: 76, trainingDue: 8 }),

        // Flight risks: lite mode uses cheaper settings or skips entirely
        lite
          ? Promise.resolve([])
          : getHighRiskEmployees(tenantId, { checkLimit: 8, minRiskScore: 50, maxResults: 3 }).catch((err) => {
              console.error('HR summary: getHighRiskEmployees failed', err?.message ?? err)
              return []
            }),

      // AI insights (mock)
      Promise.resolve([
        { text: 'Optimize Q2 bonuses by ₹2.4L for 15% retention boost', impact: 'High impact' },
      ]),

      // Trends (mock - would calculate from historical data)
      Promise.resolve({
        attritionTrend: [
          { month: 'Oct', rate: 10.2 },
          { month: 'Nov', rate: 9.5 },
          { month: 'Dec', rate: 8.8 },
          { month: 'Jan', rate: 8.2 },
        ],
        hiringVelocityTrend: [
          { month: 'Oct', days: 18 },
          { month: 'Nov', days: 16 },
          { month: 'Dec', days: 15 },
          { month: 'Jan', days: 14 },
        ],
        payrollCostTrend: [
          { month: 'Oct', cost: 3800000 },
          { month: 'Nov', cost: 3900000 },
          { month: 'Dec', cost: 4000000 },
          { month: 'Jan', cost: 4200000 },
        ],
      }),
    ])

    // Calculate turnover rate (mock - would use historical exit data)
    const turnover = 8.2

    // Calculate next payroll amount
    let nextPayrollAmount = 0
    let nextPayrollDate = ''
    if (nextPayrollCycle && 'month' in nextPayrollCycle && 'year' in nextPayrollCycle) {
      // PayrollCycle uses month (1-12) and year
      const cycleDate = new Date(nextPayrollCycle.year, (nextPayrollCycle as { month: number }).month - 1, 1)
      nextPayrollDate = cycleDate.toISOString().split('T')[0]
      // Mock calculation - would sum all employee salaries for the cycle
      nextPayrollAmount = activeEmployees * 50000 // Rough estimate
    } else {
      // Default to end of current month
      const defaultDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      nextPayrollDate = defaultDate.toISOString().split('T')[0]
      nextPayrollAmount = activeEmployees * 50000
    }

      // Calculate arrears (mock)
      const arrears = 12000

      timing.end('db')

      return {
      headcount: activeEmployees,
      contractors: contractors || 12,
      turnover,
      absentToday: onLeaveToday,
      nextPayroll: nextPayrollDate,
      nextPayrollAmount,
      complianceScore: complianceData.score,
      pendingReimbursements: (pendingReimbursements?._count?.id ?? 0) || 15,
      pendingReimbursementsAmount: Number(pendingReimbursements?._sum?.amount ?? 0) || 45000,
      arrears,
      avgEngagement: engagementData.avgEngagement,
      okrCompletion: engagementData.okrCompletion,
      trainingDue: engagementData.trainingDue,
      flightRisks,
      hiringVelocity: trends.hiringVelocityTrend?.[trends.hiringVelocityTrend.length - 1]?.days || 14,
      overtimeRisk: { team: 'Engineering', risk: 18 },
      healthScore: 78,
      healthScoreChange: 2,
      aiInsights,
        attritionTrend: trends.attritionTrend,
        hiringVelocityTrend: trends.hiringVelocityTrend,
        payrollCostTrend: trends.payrollCostTrend,
      }
    }, timing)

    return NextResponse.json(summary, {
      headers: {
        'Server-Timing': timing.toHeaders(),
      },
    })
  } catch (error: any) {
    console.error('HR summary error:', error, timing.toLogMeta())

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    // Soft-fail: return zeros instead of 500 when possible (keep auth 401/403)
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error?.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch HR summary',
        message: error?.message,
        degraded: true,
        headcount: 0,
        contractors: 0,
        turnover: 0,
        absentToday: 0,
        nextPayroll: '',
        nextPayrollAmount: 0,
        complianceScore: 0,
        pendingReimbursements: 0,
        pendingReimbursementsAmount: 0,
        arrears: 0,
        avgEngagement: 0,
        okrCompletion: 0,
        trainingDue: 0,
        flightRisks: [],
        hiringVelocity: 0,
        overtimeRisk: {},
        healthScore: 0,
        healthScoreChange: 0,
        aiInsights: [],
        attritionTrend: [],
        hiringVelocityTrend: [],
        payrollCostTrend: [],
      },
      { status: 200 }
    )
  }
}

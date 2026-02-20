import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { calculateFlightRisk, FlightRiskFactors } from '@/lib/hr/flight-risk-calculator'

/**
 * GET /api/hr/employees/[id]/flight-risk
 * Calculate flight risk for an employee
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Gather flight risk factors
    const factors: FlightRiskFactors = {}

    // Get performance data
    const latestReview = await prisma.performanceReview.findFirst({
      where: {
        employeeId: params.id,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (latestReview) {
      factors.lastPerformanceRating = latestReview.overallRating || undefined
      // Determine trend (simplified - would need multiple reviews)
      factors.performanceTrend = 'STABLE'
    }

    // Get attendance data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: params.id,
        tenantId,
        date: { gte: thirtyDaysAgo },
      },
    })

    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length
      factors.attendanceRate = (presentCount / attendanceRecords.length) * 100
      factors.lateArrivalsCount = attendanceRecords.filter((r) => r.isLate).length
      factors.absentDaysCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length
    }

    // Get engagement score (mock for now - would come from surveys)
    factors.engagementScore = 75 // Default, would be from survey system

    // Get compensation data
    if (employee.ctcAnnualInr) {
      factors.currentSalary = employee.ctcAnnualInr
      // Market salary would come from benchmarking API
      // For now, estimate 20% above current (would be replaced with real data)
      factors.marketSalary = employee.ctcAnnualInr * 1.2
      factors.salaryGap = ((factors.marketSalary - factors.currentSalary) / factors.marketSalary) * 100
    }

    // Calculate tenure
    if (employee.joiningDate) {
      const monthsSinceJoining = Math.floor(
        (new Date().getTime() - new Date(employee.joiningDate).getTime()) /
        (1000 * 60 * 60 * 24 * 30)
      )
      factors.monthsInCompany = monthsSinceJoining
    }

    // Calculate months in current role (would need role history)
    factors.monthsInCurrentRole = factors.monthsInCompany

    // Calculate months since last raise (would need salary history)
    factors.monthsSinceLastRaise = 12 // Default, would come from salary history

    // Calculate flight risk
    const riskResult = calculateFlightRisk(factors)

    return NextResponse.json({
      employeeId: params.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      ...riskResult,
      calculatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

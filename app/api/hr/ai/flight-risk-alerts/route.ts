import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { calculateFlightRisk } from '@/lib/hr/flight-risk-calculator'

/**
 * GET /api/hr/ai/flight-risk-alerts
 * Get all employees with high flight risk (for alerts/dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const minRiskScore = parseInt(searchParams.get('minRiskScore') || '60')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      take: limit,
      include: {
        department: true,
        designation: true,
      },
    })

    // Calculate flight risk for each employee
    const riskAlerts = await Promise.all(
      employees.map(async (employee) => {
        // Gather factors (simplified - would gather more data)
        const factors: any = {}

        if (employee.ctcAnnualInr) {
          factors.currentSalary = employee.ctcAnnualInr
          factors.marketSalary = employee.ctcAnnualInr * 1.2 // Placeholder
          factors.salaryGap = 20 // Placeholder
        }

        if (employee.joiningDate) {
          const monthsSinceJoining = Math.floor(
            (new Date().getTime() - new Date(employee.joiningDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
          )
          factors.monthsInCompany = monthsSinceJoining
          factors.monthsInCurrentRole = monthsSinceJoining
        }

        // Get latest performance review
        const latestReview = await prisma.performanceReview.findFirst({
          where: {
            employeeId: employee.id,
            tenantId,
          },
          orderBy: { createdAt: 'desc' },
        })

        if (latestReview) {
          factors.lastPerformanceRating = latestReview.overallRating || undefined
        }

        // Get attendance (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            employeeId: employee.id,
            tenantId,
            date: { gte: thirtyDaysAgo },
          },
        })

        if (attendanceRecords.length > 0) {
          const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length
          factors.attendanceRate = (presentCount / attendanceRecords.length) * 100
        }

        factors.engagementScore = 75 // Placeholder

        const riskResult = calculateFlightRisk(factors)

        return {
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeCode,
          department: employee.department?.name,
          designation: employee.designation?.name,
          ...riskResult,
        }
      })
    )

    // Filter by minimum risk score and sort by risk score
    const highRiskEmployees = riskAlerts
      .filter((alert) => alert.riskScore >= minRiskScore)
      .sort((a, b) => b.riskScore - a.riskScore)

    return NextResponse.json({
      alerts: highRiskEmployees,
      totalHighRisk: highRiskEmployees.length,
      totalChecked: employees.length,
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

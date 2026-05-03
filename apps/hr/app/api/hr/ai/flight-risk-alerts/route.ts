import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getFlightRiskForEmployee } from '@/lib/hr/flight-risk-service'

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

    const employees = await prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE' },
      take: limit,
      include: { department: true, designation: true },
    })

    const riskAlerts = await Promise.all(
      employees.map(async (employee) => {
        const result = await getFlightRiskForEmployee(employee.id, tenantId)
        if (!result) return null
        return {
          employeeId: employee.id,
          employeeName: result.employeeName,
          employeeCode: employee.employeeCode,
          department: employee.department?.name,
          designation: employee.designation?.name,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          riskWindow: result.riskWindow,
          factors: result.factors,
          recommendations: result.recommendations,
        }
      })
    )

    const highRiskEmployees = riskAlerts
      .filter((r): r is NonNullable<typeof r> => r !== null && r.riskScore >= minRiskScore)
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

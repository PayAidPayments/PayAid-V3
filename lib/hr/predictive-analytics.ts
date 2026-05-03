// @ts-nocheck
/**
 * Feature #17: Predictive Analytics - Attrition 90d from flight risk.
 */
import { prisma } from '@/lib/db/prisma'
import { getFlightRiskForEmployee } from '@/lib/hr/flight-risk-service'

export async function getAttritionRisk90Days(tenantId: string) {
  const active = await prisma.employee.findMany({
    where: { tenantId, status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true },
  })
  const results: { employeeId: string; employeeName: string; riskScore: number; riskLevel: string; reason: string }[] = []
  for (const e of active.slice(0, 50)) {
    const risk = await getFlightRiskForEmployee(e.id, tenantId)
    if (risk && (risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL')) {
      results.push({
        employeeId: e.id,
        employeeName: e.firstName + ' ' + e.lastName,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        reason: risk.reason,
      })
    }
  }
  results.sort((a, b) => b.riskScore - a.riskScore)
  return { employees: results, generatedAt: new Date().toISOString() }
}

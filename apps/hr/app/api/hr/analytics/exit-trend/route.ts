import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** GET /api/hr/analytics/exit-trend - Exit data for ML/flight risk; competitor placeholder */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const exited = await prisma.employee.findMany({
      where: { tenantId, exitDate: { gte: twelveMonthsAgo, not: null } },
      select: { id: true, exitDate: true, exitReason: true, departmentId: true, designationId: true },
    })

    const departmentIds = [...new Set(exited.map((e) => e.departmentId).filter(Boolean))] as string[]
    const designationIds = [...new Set(exited.map((e) => e.designationId).filter(Boolean))] as string[]
    const [departments, designations] = await Promise.all([
      prisma.department.findMany({ where: { id: { in: departmentIds } }, select: { id: true, name: true } }),
      prisma.designation.findMany({ where: { id: { in: designationIds } }, select: { id: true, name: true } }),
    ])
    const deptMap = new Map(departments.map((d) => [d.id, d.name]))
    const desgMap = new Map(designations.map((d) => [d.id, d.name]))

    const byMonth: Record<string, number> = {}
    const byDepartment: Record<string, number> = {}
    const byDesignation: Record<string, number> = {}
    const byReason: Record<string, number> = {}

    for (const e of exited) {
      const d = e.exitDate!
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      byMonth[monthKey] = (byMonth[monthKey] ?? 0) + 1
      const deptName = e.departmentId ? deptMap.get(e.departmentId) ?? 'Unknown' : 'Unassigned'
      byDepartment[deptName] = (byDepartment[deptName] ?? 0) + 1
      const desgName = e.designationId ? desgMap.get(e.designationId) ?? 'Unknown' : 'Unassigned'
      byDesignation[desgName] = (byDesignation[desgName] ?? 0) + 1
      const reason = e.exitReason?.trim() || 'Not specified'
      byReason[reason] = (byReason[reason] ?? 0) + 1
    }

    const monthlyTrend = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }))

    return NextResponse.json({
      totalExits: exited.length,
      period: { from: twelveMonthsAgo.toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
      byMonth: monthlyTrend,
      byDepartment: Object.entries(byDepartment).map(([name, count]) => ({ name, count })),
      byDesignation: Object.entries(byDesignation).map(([name, count]) => ({ name, count })),
      byExitReason: Object.entries(byReason).map(([reason, count]) => ({ reason, count })),
      competitorInsights: 'Integrate with LinkedIn/Glassdoor API when available for competitor hiring and attrition trends.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

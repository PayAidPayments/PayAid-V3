import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/analytics/advanced
 * Phase 2: Advanced HR analytics - headcount trend, payroll cost, attrition, department mix
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const now = new Date()
    const monthsBack = 12

    const headcountTrend: { month: string; count: number; joined: number; exited: number }[] = []
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)

      const [count, joined, exited] = await Promise.all([
        prisma.employee.count({
          where: {
            tenantId,
            status: { in: ['ACTIVE', 'PROBATION'] },
            joiningDate: { lte: end },
            OR: [{ exitDate: null }, { exitDate: { gt: end } }],
          },
        }),
        prisma.employee.count({
          where: { tenantId, joiningDate: { gte: start, lte: end } },
        }),
        prisma.employee.count({
          where: { tenantId, exitDate: { gte: start, lte: end } },
        }),
      ])
      headcountTrend.push({
        month: start.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        count,
        joined,
        exited,
      })
    }

    const payrollTrend: { month: string; gross: number; net: number; employeeCount: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const cycle = await prisma.payrollCycle.findFirst({
        where: { tenantId, month: d.getMonth() + 1, year: d.getFullYear() },
        include: { payrollRuns: true },
      })
      if (cycle) {
        const gross = cycle.payrollRuns.reduce((s, r) => s + Number(r.grossEarningsInr), 0)
        const net = cycle.payrollRuns.reduce((s, r) => s + Number(r.netPayInr), 0)
        payrollTrend.push({
          month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          gross,
          net,
          employeeCount: cycle.payrollRuns.length,
        })
      }
    }

    const byDepartment = await prisma.employee.groupBy({
      by: ['departmentId'],
      where: { tenantId, status: 'ACTIVE' },
      _count: { id: true },
    })
    const departmentNames = await prisma.department.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    })
    const deptMap = new Map(departmentNames.map((d) => [d.id, d.name]))
    const departmentMix = byDepartment.map((g) => ({
      departmentId: g.departmentId,
      departmentName:
        g.departmentId != null ? deptMap.get(g.departmentId) ?? 'Unassigned' : 'Unassigned',
      count: g._count.id,
    }))

    const totalActive = await prisma.employee.count({
      where: { tenantId, status: 'ACTIVE' },
    })
    const exitsLast6Months = await prisma.employee.count({
      where: {
        tenantId,
        exitDate: {
          gte: new Date(now.getFullYear(), now.getMonth() - 6, 1),
        },
      },
    })
    const attritionRate = totalActive > 0 ? (exitsLast6Months / totalActive) * 100 : 0

    return NextResponse.json({
      headcountTrend,
      payrollTrend,
      departmentMix,
      summary: {
        currentHeadcount: totalActive,
        attritionRateLast6Months: Math.round(attritionRate * 10) / 10,
        exitsLast6Months,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

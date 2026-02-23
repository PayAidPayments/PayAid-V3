import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #19: Skill gap by department */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const byDept = await prisma.employee.groupBy({ by: ['departmentId'], where: { tenantId, status: 'ACTIVE' }, _count: { id: true } })
    const depts = await prisma.department.findMany({ where: { tenantId }, select: { id: true, name: true } })
    const m = new Map(depts.map((d) => [d.id, d.name]))
    return NextResponse.json({
      byDepartment: byDept.map((g) => ({ departmentId: g.departmentId, name: m.get(g.departmentId) || 'Unassigned', count: g._count.id })),
      note: 'Map skills per designation and employee inventory for gap.',
      generatedAt: new Date().toISOString(),
    })
  } catch (e: unknown) {
    return handleLicenseError(e)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/auth'

export interface OrgChartNode {
  id: string
  name: string
  designation?: string
  department?: string
  employeeCode: string
  children: OrgChartNode[]
}

/**
 * GET /api/hr/org-chart?tenantId=
 * Returns a tree of employees by managerId for the HR Org Chart.
 * Roots: employees with no manager or manager not in tenant. Children: grouped by managerId.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const employees = await prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        managerId: true,
        designation: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    const byId = new Map(employees.map((e) => [e.id, e]))
    const roots: OrgChartNode[] = []
    const childrenByManager = new Map<string, typeof employees>()

    for (const e of employees) {
      const managerId = e.managerId ?? null
      if (!managerId || !byId.has(managerId)) {
        roots.push({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`.trim(),
          designation: e.designation?.name ?? undefined,
          department: e.department?.name ?? undefined,
          employeeCode: e.employeeCode,
          children: [],
        })
      } else {
        const list = childrenByManager.get(managerId) ?? []
        list.push(e)
        childrenByManager.set(managerId, list)
      }
    }

    function buildTree(node: OrgChartNode): void {
      const childEmployees = childrenByManager.get(node.id) ?? []
      node.children = childEmployees.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`.trim(),
        designation: e.designation?.name ?? undefined,
        department: e.department?.name ?? undefined,
        employeeCode: e.employeeCode,
        children: [],
      }))
      node.children.forEach(buildTree)
    }
    roots.forEach(buildTree)

    return NextResponse.json({ tenantId, tree: roots })
  } catch (e) {
    console.error('[HR_ORG_CHART]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load org chart' },
      { status: 500 }
    )
  }
}

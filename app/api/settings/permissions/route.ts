import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

/**
 * GET /api/settings/permissions - List permissions for current tenant (for role builder)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = await prisma.permission.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ moduleName: 'asc' }, { permissionCode: 'asc' }],
      select: {
        id: true,
        permissionCode: true,
        description: true,
        moduleName: true,
        action: true,
      },
    })

    // If no permissions seeded, return a default list for HR (UI can still use these for display)
    if (permissions.length === 0) {
      const defaults = [
        { permissionCode: 'hr:read_employees', description: 'View employees', moduleName: 'hr', action: 'read' },
        { permissionCode: 'hr:manage_employees', description: 'Manage employees', moduleName: 'hr', action: 'update' },
        { permissionCode: 'hr:read_payroll', description: 'View payroll', moduleName: 'hr', action: 'read' },
        { permissionCode: 'hr:manage_payroll', description: 'Run payroll', moduleName: 'hr', action: 'update' },
        { permissionCode: 'hr:approve_reimbursements', description: 'Approve reimbursements', moduleName: 'hr', action: 'update' },
        { permissionCode: 'hr:admin', description: 'Full HR admin', moduleName: 'hr', action: 'admin' },
      ]
      return NextResponse.json({
        permissions: defaults.map((p, i) => ({ id: `default-${i}`, ...p })),
        fromDefaults: true,
      })
    }

    return NextResponse.json({ permissions })
  } catch (e) {
    console.error('GET settings/permissions:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list permissions' },
      { status: 500 }
    )
  }
}

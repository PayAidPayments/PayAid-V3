import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import { z } from 'zod'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'
import { logCrmAudit } from '@/lib/audit-log-crm'

const bulkCompleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin', 'manager'], 'bulk task complete')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const body = await request.json()
    const { ids } = bulkCompleteSchema.parse(body)

    const result = await prisma.task.updateMany({
      where: {
        id: { in: ids },
        tenantId,
      },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    await logCrmAudit({
      tenantId,
      userId,
      entityType: 'task',
      entityId: `bulk-${ids[0]}`,
      action: 'update',
      changeSummary: `Bulk completed ${result.count} task(s)`,
      afterSnapshot: { taskIds: ids, completedCount: result.count },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
    })
  } catch (error) {
    if (error instanceof CrmRoleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Bulk complete error:', error)
    return NextResponse.json({ error: 'Failed to bulk complete tasks' }, { status: 500 })
  }
}

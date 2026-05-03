import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'

// GET /api/task-templates — list for current CRM tenant context
export async function GET(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const templates = await prisma.taskTemplate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get task templates error:', error)
    return NextResponse.json({ error: 'Failed to get task templates' }, { status: 500 })
  }
}

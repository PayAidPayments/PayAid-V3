import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'

/**
 * GET /api/crm/inbound-orchestration/logs — recent inbound orchestration runs for Execution logs UI.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '40', 10)))

    const logs = await prisma.inboundOrchestrationLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        contactId: true,
        status: true,
        sourceChannel: true,
        dedupeAction: true,
        leadScore: true,
        contactCreated: true,
        trace: true,
        errorCode: true,
        errorMessage: true,
        actorUserId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ logs })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Inbound orchestration logs error:', error)
    return NextResponse.json({ error: 'Failed to load execution logs' }, { status: 500 })
  }
}

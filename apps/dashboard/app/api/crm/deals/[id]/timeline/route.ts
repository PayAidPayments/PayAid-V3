import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import { buildUnifiedDealTimeline } from '@/lib/crm/unified-deal-timeline'

/**
 * GET /api/crm/deals/[id]/timeline
 * Unified timeline for a deal: milestones, quotes, proposals, comments, linked contact communications.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)
    const { id: dealId } = await params

    if (!dealId) {
      return NextResponse.json({ success: false, error: 'Missing deal id' }, { status: 400 })
    }

    const limitRaw = request.nextUrl.searchParams.get('limit')
    let limit: number | undefined
    if (limitRaw != null && limitRaw !== '') {
      const parsed = parseInt(limitRaw, 10)
      if (!Number.isFinite(parsed) || parsed < 1) {
        return NextResponse.json({ success: false, error: 'Invalid limit' }, { status: 400 })
      }
      limit = parsed
    }

    const result = await buildUnifiedDealTimeline({
      tenantId,
      dealId,
      limit,
    })

    if (!result) {
      return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      events: result.events,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Unified deal timeline error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load deal timeline' },
      { status: 500 }
    )
  }
}

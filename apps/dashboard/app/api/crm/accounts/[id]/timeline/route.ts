import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import { buildUnifiedAccountTimeline } from '@/lib/crm/unified-account-timeline'

/**
 * GET /api/crm/accounts/[id]/timeline
 * Aggregated interactions, tasks, deals, proposals, quotes, and comments across all contacts under the account.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)
    const { id: accountId } = await params

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'Missing account id' }, { status: 400 })
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

    const result = await buildUnifiedAccountTimeline({
      tenantId,
      accountId,
      limit,
    })

    if (!result) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      activities: result.activities,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Unified account timeline error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load account timeline' },
      { status: 500 }
    )
  }
}

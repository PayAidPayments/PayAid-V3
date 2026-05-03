import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import { buildUnifiedContactTimeline } from '@/lib/crm/unified-contact-timeline'

/**
 * GET /api/crm/contacts/[id]/timeline
 * Unified communication + activity feed for a contact (interactions, tasks, comments, deals).
 * Query: limit (optional, default 100, max 200)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)
    const { id: contactId } = await params

    if (!contactId) {
      return NextResponse.json({ success: false, error: 'Missing contact id' }, { status: 400 })
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

    const result = await buildUnifiedContactTimeline({
      tenantId,
      contactId,
      limit,
    })

    if (!result) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      activities: result.activities,
      deals: result.deals,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Unified contact timeline error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load contact timeline' },
      { status: 500 }
    )
  }
}

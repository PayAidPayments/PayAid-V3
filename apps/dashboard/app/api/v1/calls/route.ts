import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

/**
 * GET /api/v1/calls
 * List calls for the tenant with optional filters.
 * Query params: status, direction, contact_id, deal_id, limit (max 100), page
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_voice')

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const direction = url.searchParams.get('direction')
    const contactId = url.searchParams.get('contact_id')
    const dealId = url.searchParams.get('deal_id')
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1)
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      ...(status ? { status: status.toUpperCase() } : {}),
      ...(direction ? { direction: direction.toUpperCase() } : {}),
      ...(contactId ? { contactId } : {}),
      ...(dealId ? { dealId } : {}),
    }

    const [calls, total] = await Promise.all([
      prisma.aICall.findMany({
        where,
        select: {
          id: true,
          phoneNumber: true,
          direction: true,
          status: true,
          duration: true,
          handledByAI: true,
          contactId: true,
          dealId: true,
          leadId: true,
          aiIntent: true,
          startedAt: true,
          endedAt: true,
          createdAt: true,
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aICall.count({ where }),
    ])

    return NextResponse.json({
      calls: calls.map((c) => ({
        id: c.id,
        phone_number: c.phoneNumber,
        direction: c.direction.toLowerCase(),
        status: c.status.toLowerCase(),
        duration_seconds: c.duration,
        handled_by_ai: c.handledByAI,
        contact_id: c.contactId,
        deal_id: c.dealId,
        lead_id: c.leadId,
        disposition: c.aiIntent,
        started_at: c.startedAt,
        ended_at: c.endedAt,
        created_at: c.createdAt,
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    console.error('List calls v1 error:', e)
    return NextResponse.json({ error: 'Failed to list calls' }, { status: 500 })
  }
}

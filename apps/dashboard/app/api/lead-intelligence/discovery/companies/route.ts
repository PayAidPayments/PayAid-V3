import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import {
  buildAccountDiscoveryWhere,
  normalizeDiscoveryAccountRow,
  parseDiscoveryQuery,
} from '@/lib/lead-intelligence/discovery-query'
import { writeLeadAuditEvent } from '@/lib/lead-intelligence/audit'
import { trackLeadIntelligenceEvent } from '@/lib/lead-intelligence/telemetry'

/**
 * M1 Discovery API (company-first):
 * - Uses existing tenant account index as first real source
 * - Returns paged, filterable records for LI companies screen
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'lead-intelligence')
    const { q, industry, country, limit } = parseDiscoveryQuery(request.nextUrl.searchParams)

    const rows = await prisma.account.findMany({
      where: buildAccountDiscoveryWhere(tenantId, { q, industry, country }),
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        city: true,
        state: true,
        country: true,
        employeeCount: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      take: limit,
    })

    const items = rows.map(normalizeDiscoveryAccountRow)

    await writeLeadAuditEvent({
      tenantId,
      actorId: userId,
      action: 'search_started',
      entityType: 'lead_discovery',
      entityId: `search:${tenantId}:${Date.now()}`,
      metadata: { q, industry, country, limit, resultCount: items.length, source: 'tenant-account-index' },
    })
    trackLeadIntelligenceEvent('search_started')
    trackLeadIntelligenceEvent(items.length > 0 ? 'discovery_results_nonempty' : 'discovery_results_empty')

    return NextResponse.json({
      ok: true,
      source: 'tenant-account-index',
      query: { q, industry, country, limit },
      count: items.length,
      items,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('[lead-intelligence/discovery/companies] GET failed:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

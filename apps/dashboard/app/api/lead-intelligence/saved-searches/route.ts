import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { writeLeadAuditEvent } from '@/lib/lead-intelligence/audit'
import { trackLeadIntelligenceEvent } from '@/lib/lead-intelligence/telemetry'

export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'lead-intelligence')
    const listArchived = request.nextUrl.searchParams.get('status') === 'archived'
    const briefs = await prisma.leadBrief.findMany({
      where: {
        tenantId,
        segments: {
          some: { status: listArchived ? 'ARCHIVED' : { not: 'ARCHIVED' } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        segments: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      take: 100,
    })

    const items = briefs.map((brief) => {
      const segment = brief.segments[0] || null
      const industry = (brief.industryFilters as { industry?: string } | null)?.industry || ''
      const country = (brief.geoFilters as { country?: string } | null)?.country || ''
      return {
        id: brief.id,
        name: brief.name,
        query: brief.description || '',
        industry,
        country,
        resultCount: segment?.resultCount ?? 0,
        status: segment?.status ?? 'DRAFT',
        updatedAt: brief.updatedAt,
      }
    })

    await writeLeadAuditEvent({
      tenantId,
      actorId: userId,
      action: 'saved_searches_viewed',
      entityType: 'lead_saved_search',
      entityId: 'list',
      metadata: { count: items.length, list: listArchived ? 'archived' : 'active' },
    })
    trackLeadIntelligenceEvent(listArchived ? 'saved_searches_list_archived' : 'saved_searches_list_active')

    return NextResponse.json({
      ok: true,
      items,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('[lead-intelligence/saved-searches] GET failed:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'lead-intelligence')
    const body = (await request.json()) as {
      name?: string
      q?: string
      industry?: string
      country?: string
      resultCount?: number
    }
    const name = String(body?.name || '').trim()
    if (!name) {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 })
    }

    const q = String(body?.q || '').trim()
    const industry = String(body?.industry || '').trim()
    const country = String(body?.country || '').trim()
    const resultCount = Number.isFinite(Number(body?.resultCount)) ? Math.max(0, Number(body?.resultCount)) : 0

    const created = await prisma.$transaction(async (tx) => {
      const brief = await tx.leadBrief.create({
        data: {
          tenantId,
          name,
          description: q || null,
          industryFilters: { industry },
          geoFilters: { country },
          sizeFilters: {},
          personaFilters: {},
          createdById: userId,
        },
      })

      await tx.leadSegment.create({
        data: {
          tenantId,
          briefId: brief.id,
          name,
          resultCount,
        },
      })

      return brief
    })

    await writeLeadAuditEvent({
      tenantId,
      actorId: userId,
      action: 'search_saved',
      entityType: 'lead_saved_search',
      entityId: created.id,
      metadata: { name: created.name, q, industry, country, resultCount },
    })
    trackLeadIntelligenceEvent('search_saved')

    return NextResponse.json({ ok: true, id: created.id, name: created.name }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('[lead-intelligence/saved-searches] POST failed:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

/**
 * GET /api/social/posts/retries
 * Returns recent server-side retry events captured in AuditLog.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { searchParams } = new URL(request.url)
    const limitRaw = Number(searchParams.get('limit') || 3)
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 20) : 3

    const rows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'MARKETING_POST_RETRY',
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        entityId: true,
        timestamp: true,
        changedBy: true,
      },
    })
    const actorIds = Array.from(new Set(rows.map((r) => r.changedBy).filter(Boolean)))
    const actors =
      actorIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, name: true, email: true },
          })
        : []
    const actorMap = new Map(
      actors.map((u) => [u.id, (u.name || u.email || u.id).trim()])
    )

    return NextResponse.json({
      events: rows.map((r) => ({
        id: r.entityId,
        atIso: r.timestamp.toISOString(),
        changedBy: r.changedBy,
        changedByLabel: actorMap.get(r.changedBy) || r.changedBy,
      })),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get social retry events error:', error)
    return NextResponse.json({ error: 'Failed to load retry events' }, { status: 500 })
  }
}

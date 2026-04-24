import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { mediumPriorityQueue } from '@/lib/queue/bull'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type BulkRetryBody = {
  ids?: string[]
  mode?: 'ids' | 'filtered_failed'
  filters?: {
    channel?: string
    status?: string
    from?: string
    to?: string
  }
  maxRows?: number
}

const CHANNELS = ['EMAIL', 'WHATSAPP', 'SMS', 'FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'YOUTUBE'] as const

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

/**
 * POST /api/social/posts/retry-bulk
 * Re-queues multiple failed MarketingPost rows.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'marketing')
    const body = (await request.json().catch(() => ({}))) as BulkRetryBody
    let ids = Array.isArray(body.ids)
      ? Array.from(
          new Set(
            body.ids
              .map((id) => String(id || '').trim())
              .filter(Boolean)
          )
        )
      : []

    if (body.mode === 'filtered_failed') {
      const maxRowsRaw = Number(body.maxRows ?? 100)
      const maxRows = Number.isFinite(maxRowsRaw)
        ? Math.min(Math.max(Math.trunc(maxRowsRaw), 1), 500)
        : 100

      const where: Record<string, unknown> = {
        tenantId,
        status: 'FAILED',
      }
      const channel = String(body.filters?.channel || '').trim().toUpperCase()
      if (channel && (CHANNELS as readonly string[]).includes(channel)) {
        where.channel = channel
      }
      const from = String(body.filters?.from || '').trim()
      const to = String(body.filters?.to || '').trim()
      if (from || to) {
        const createdAt: Record<string, Date> = {}
        if (from) {
          const fromDate = new Date(`${from}T00:00:00.000Z`)
          if (!Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate
        }
        if (to) {
          const toDate = new Date(`${to}T23:59:59.999Z`)
          if (!Number.isNaN(toDate.getTime())) createdAt.lte = toDate
        }
        if (Object.keys(createdAt).length > 0) where.createdAt = createdAt
      }

      const rows = await prisma.marketingPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: maxRows,
        select: { id: true },
      })
      ids = rows.map((r) => r.id)
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Provide at least one post id.' }, { status: 400 })
    }
    if (ids.length > 100) {
      return NextResponse.json({ error: 'Bulk retry limit is 100 posts per request.' }, { status: 400 })
    }

    const posts = await prisma.marketingPost.findMany({
      where: { tenantId, id: { in: ids } },
      select: { id: true, status: true, metadata: true },
    })
    const byId = new Map(posts.map((p) => [p.id, p]))
    const retried: string[] = []
    const skipped: Array<{ id: string; reason: string }> = []
    const retriedAtIso = new Date().toISOString()

    for (const id of ids) {
      const post = byId.get(id)
      if (!post) {
        skipped.push({ id, reason: 'not_found' })
        continue
      }
      if (String(post.status || '').toUpperCase() !== 'FAILED') {
        skipped.push({ id, reason: `status_${String(post.status || 'unknown').toLowerCase()}` })
        continue
      }

      await prisma.marketingPost.update({
        where: { id: post.id },
        data: {
          status: 'SCHEDULED',
          scheduledFor: new Date(),
          metadata: {
            ...asObject(post.metadata),
            retryCount: Number(asObject(post.metadata).retryCount || 0) + 1,
            retryRequestedBy: userId,
            retryRequestedAt: retriedAtIso,
            retrySource: 'history-ui-bulk',
          },
        },
      })

      await (mediumPriorityQueue as any).add({ marketingPostId: post.id }, { delay: 0 })
      await prisma.auditLog.create({
        data: {
          tenantId,
          entityType: 'MARKETING_POST_RETRY',
          entityId: post.id,
          changedBy: userId,
          changeSummary: 'Bulk retry requested from marketing history',
          beforeSnapshot: { status: 'FAILED' },
          afterSnapshot: {
            status: 'SCHEDULED',
            retryRequestedAt: retriedAtIso,
            retrySource: 'history-ui-bulk',
          },
        },
      })
      retried.push(post.id)
    }

    return NextResponse.json({
      ok: true,
      retried,
      retriedCount: retried.length,
      skipped,
      skippedCount: skipped.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Bulk retry social posts error:', error)
    return NextResponse.json({ error: 'Failed to retry selected posts' }, { status: 500 })
  }
}

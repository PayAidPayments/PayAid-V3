import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { mediumPriorityQueue } from '@/lib/queue/bull'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

/**
 * POST /api/social/posts/[id]/retry
 * Re-queues one failed MarketingPost for immediate dispatch.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'marketing')
    const { id } = await params

    const post = await prisma.marketingPost.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, metadata: true },
    })
    if (!post) {
      return NextResponse.json({ error: 'Marketing post not found' }, { status: 404 })
    }

    const currentStatus = String(post.status || '').toUpperCase()
    if (currentStatus !== 'FAILED') {
      return NextResponse.json(
        { error: `Retry is only allowed for FAILED posts (current: ${currentStatus || 'UNKNOWN'}).` },
        { status: 400 }
      )
    }

    const retriedAtIso = new Date().toISOString()
    const beforeStatus = currentStatus
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
          retrySource: 'history-ui',
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
        changeSummary: 'Retry requested from marketing history',
        beforeSnapshot: {
          status: beforeStatus,
        },
        afterSnapshot: {
          status: 'SCHEDULED',
          retryRequestedAt: retriedAtIso,
          retrySource: 'history-ui',
        },
      },
    })

    return NextResponse.json({
      ok: true,
      id: post.id,
      status: 'SCHEDULED',
      message: 'Post re-queued for dispatch',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Retry social post error:', error)
    return NextResponse.json({ error: 'Failed to retry social post' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

const MENTION_ACTIONS = ['mention', 'tag', 'share', 'comment', 'reply', 'message', 'dm']

function mapEventToMention(row: {
  id: string
  platform: string
  action: string
  actorName: string | null
  actorHandle: string | null
  objectText: string | null
  eventAt: Date
  metadata: unknown
}) {
  const meta = row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : {}
  const sentiment =
    typeof meta.sentiment === 'string' ? meta.sentiment : row.action === 'comment' ? 'neutral' : 'positive'
  const requiresResponse = row.action === 'comment' || row.action === 'dm' || row.action === 'message'
  return {
    id: row.id,
    platform: row.platform,
    type: row.action,
    author: row.actorName || 'Unknown',
    authorHandle: row.actorHandle || undefined,
    content: row.objectText || '',
    sentiment,
    intent: requiresResponse ? 'high' : 'medium',
    engagement: {
      likes: typeof meta.likes === 'number' ? meta.likes : 0,
      shares: typeof meta.shares === 'number' ? meta.shares : 0,
      comments: typeof meta.comments === 'number' ? meta.comments : 0,
    },
    url: typeof meta.url === 'string' ? meta.url : undefined,
    timestamp: row.eventAt.toISOString(),
    requiresResponse,
    tags: [row.action, row.platform],
  }
}

// GET /api/marketing/social-listening/mentions — stored webhook events (SocialActivityEvent)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)))

    const rows = await prisma.socialActivityEvent
      .findMany({
        where: {
          tenantId,
          action: { in: MENTION_ACTIONS },
        },
        orderBy: { eventAt: 'desc' },
        take: limit,
      })
      .catch(() => [])

    const mentions = rows.map(mapEventToMention)

    return NextResponse.json({
      mentions,
      source: mentions.length > 0 ? 'social_activity_event' : 'empty',
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get mentions error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch mentions',
        message: error instanceof Error ? error.message : 'Unknown',
        mentions: [],
        source: 'error',
      },
      { status: 500 },
    )
  }
}

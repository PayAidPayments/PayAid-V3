import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

function mapChannelToPlatform(channel: string): string | null {
  switch (channel) {
    case 'FACEBOOK':
      return 'facebook'
    case 'INSTAGRAM':
      return 'instagram'
    case 'TWITTER':
      return 'twitter'
    case 'LINKEDIN':
      return 'linkedin'
    case 'YOUTUBE':
      return 'youtube'
    case 'WHATSAPP':
      return 'whatsapp'
    case 'EMAIL':
      return 'email'
    case 'SMS':
      return 'sms'
    default:
      return null
  }
}

/**
 * GET /api/social/posts/[id]/dispatch-audit
 * Returns dispatch/audit details for one MarketingPost, including:
 * - marketing post state + metadata (provider response summaries)
 * - best-effort related SocialPost rows (by tenant/platform/content/time window)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { id } = await params

    const marketingPost = await prisma.marketingPost.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        channel: true,
        content: true,
        mediaIds: true,
        status: true,
        scheduledFor: true,
        segmentId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!marketingPost) {
      return NextResponse.json({ error: 'Marketing post not found' }, { status: 404 })
    }

    const platform = mapChannelToPlatform(marketingPost.channel)
    let relatedSocialPosts: Array<{
      id: string
      platform: string
      status: string
      platformPostId: string | null
      errorMessage: string | null
      createdAt: string
      publishedAt: string | null
    }> = []

    if (platform) {
      const windowStart = new Date(marketingPost.createdAt.getTime() - 10 * 60_000)
      const rows = await prisma.socialPost.findMany({
        where: {
          tenantId,
          platform,
          content: marketingPost.content,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          platform: true,
          status: true,
          platformPostId: true,
          createdAt: true,
          publishedAt: true,
        },
      })
      relatedSocialPosts = rows.map((r) => ({
        id: r.id,
        platform: r.platform,
        status: r.status,
        platformPostId: r.platformPostId ?? null,
        // SocialPost model has no errorMessage; see marketingPost.metadata / ScheduledPost for failures
        errorMessage: null,
        createdAt: r.createdAt.toISOString(),
        publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      }))
    }

    return NextResponse.json({
      marketingPost: {
        ...marketingPost,
        createdAt: marketingPost.createdAt.toISOString(),
        updatedAt: marketingPost.updatedAt.toISOString(),
        scheduledFor: marketingPost.scheduledFor
          ? marketingPost.scheduledFor.toISOString()
          : null,
      },
      channelPlatform: platform,
      relatedSocialPosts,
      notes: [
        'relatedSocialPosts are matched by tenant + platform + content + recent time window.',
        'Provider-specific response payloads are available in marketingPost.metadata.',
      ],
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get social dispatch audit error:', error)
    return NextResponse.json({ error: 'Failed to load dispatch audit' }, { status: 500 })
  }
}


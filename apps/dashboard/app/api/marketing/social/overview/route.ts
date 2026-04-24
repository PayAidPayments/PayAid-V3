// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

function startOfLastNDays(days: number) {
  const d = new Date(Date.now() - days * 86400000)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const periodStart = startOfLastNDays(30)
    const socialActivity = (prisma as any).socialActivityEvent
    const canReadSocialActivity = Boolean(
      socialActivity && typeof socialActivity.findMany === 'function'
    )

    const [accounts, recentPosts, liveStream] = await Promise.all([
      prisma.socialMediaAccount.findMany({
        where: { tenantId, isConnected: true },
        select: {
          id: true,
          platform: true,
          accountName: true,
          followerCount: true,
          lastFollowerCount: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.socialPost.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          content: true,
          platform: true,
          status: true,
          createdAt: true,
          publishedAt: true,
          reach: true,
          impressions: true,
          engagement: true,
          likes: true,
          comments: true,
          shares: true,
          clicks: true,
          account: { select: { id: true, accountName: true, platform: true } },
        },
      }),
      canReadSocialActivity
        ? socialActivity
            .findMany({
              where: { tenantId },
              orderBy: { eventAt: 'desc' },
              take: 30,
            })
            .catch(() => [])
        : Promise.resolve([]),
    ])

    const posts30d = await prisma.socialPost.findMany({
      where: { tenantId, createdAt: { gte: periodStart } },
      select: {
        accountId: true,
        reach: true,
        impressions: true,
        engagement: true,
        likes: true,
        comments: true,
        shares: true,
        clicks: true,
      },
    })

    const byAccount: Record<
      string,
      {
        posts: number
        reach: number
        impressions: number
        engagement: number
        likes: number
        comments: number
        shares: number
        clicks: number
      }
    > = {}

    for (const p of posts30d) {
      const key = p.accountId
      if (!byAccount[key]) {
        byAccount[key] = {
          posts: 0,
          reach: 0,
          impressions: 0,
          engagement: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
        }
      }
      byAccount[key].posts += 1
      byAccount[key].reach += p.reach || 0
      byAccount[key].impressions += p.impressions || 0
      byAccount[key].engagement += p.engagement || 0
      byAccount[key].likes += p.likes || 0
      byAccount[key].comments += p.comments || 0
      byAccount[key].shares += p.shares || 0
      byAccount[key].clicks += p.clicks || 0
    }

    const brandHealth = accounts.map((a) => {
      const delta = (a.followerCount || 0) - (a.lastFollowerCount || 0)
      const agg = byAccount[a.id] || {
        posts: 0,
        reach: 0,
        impressions: 0,
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
      }
      return {
        accountId: a.id,
        platform: String(a.platform || '').toLowerCase(),
        accountName: a.accountName,
        followers: a.followerCount || 0,
        followerDelta: delta,
        posts: agg.posts,
        reach: agg.reach,
        engagements: agg.engagement,
      }
    })

    return NextResponse.json({
      period: { days: 30, start: periodStart.toISOString() },
      brandHealth,
      recentPosts: recentPosts.map((p) => ({
        id: p.id,
        platform: String(p.platform || '').toLowerCase(),
        accountName: p.account?.accountName || '—',
        createdAt: p.createdAt.toISOString(),
        status: p.status,
        contentPreview: p.content.slice(0, 280) + (p.content.length > 280 ? '…' : ''),
        metrics: {
          reach: p.reach || 0,
          engagement: p.engagement || 0,
          likes: p.likes || 0,
          comments: p.comments || 0,
          shares: p.shares || 0,
          clicks: p.clicks || 0,
        },
      })),
      liveStream: liveStream.map((e) => ({
        id: e.id,
        source: e.source,
        platform: e.platform,
        providerEventId: e.providerEventId,
        actorName: e.actorName,
        actorHandle: e.actorHandle,
        actorAvatar: e.actorAvatar,
        action: e.action,
        objectType: e.objectType,
        objectText: e.objectText,
        eventAt: e.eventAt.toISOString(),
        leadContactId: e.leadContactId,
      })),
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Marketing social overview error:', error)
    return NextResponse.json(
      { error: 'Failed to load social overview', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}


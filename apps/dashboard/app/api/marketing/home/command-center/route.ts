import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { fetchUnifiedInbox } from '@/lib/marketing/unified-inbox'

function dayStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}
function dayEnd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHourLabel(hour: number) {
  const h = hour % 12 || 12
  const suffix = hour < 12 ? 'AM' : 'PM'
  return `${h}:00 ${suffix}`
}

function computeBestTimeSlots(
  rows: { publishedAt: Date | null; engagement: number }[],
) {
  const buckets: Record<string, { count: number; engagement: number }> = {}
  for (const row of rows) {
    if (!row.publishedAt) continue
    const d = new Date(row.publishedAt)
    const key = `${d.getDay()}-${d.getHours()}`
    buckets[key] ||= { count: 0, engagement: 0 }
    buckets[key].count += 1
    buckets[key].engagement += row.engagement ?? 0
  }
  return Object.entries(buckets)
    .map(([key, v]) => {
      const [day, hour] = key.split('-').map(Number)
      return {
        dayOfWeek: day,
        dayLabel: DAY_LABELS[day] ?? '—',
        hour,
        hourLabel: formatHourLabel(hour),
        posts: v.count,
        avgEngagement: v.count > 0 ? Math.round(v.engagement / v.count) : 0,
        score: v.count > 0 ? v.engagement / v.count : 0,
      }
    })
    .filter((s) => s.posts >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...rest }) => rest)
}

async function safeCount(fn: () => Promise<number>) {
  try {
    return await fn()
  } catch {
    return 0
  }
}

async function compute(tenantId: string) {
  const now = new Date()
  const todayStart = dayStart(now)
  const todayEnd = dayEnd(now)
  const horizon = new Date(now)
  horizon.setDate(horizon.getDate() + 14)

  const [
    draftSocial,
    publishedTodaySocial,
    scheduledUpcoming,
    scheduledFailed,
    awaitingApprovalSocial,
    draftMarketing,
    scheduledMarketing,
    failedMarketing,
    publishedTodayMarketing,
    awaitingApprovalMarketing,
  ] = await Promise.all([
    safeCount(() => prisma.socialPost.count({ where: { tenantId, status: 'DRAFT' } })),
    safeCount(() => prisma.socialPost.count({ where: { tenantId, publishedAt: { gte: todayStart, lte: todayEnd } } })),
    safeCount(() => prisma.scheduledPost.count({ where: { tenantId, status: 'SCHEDULED', scheduledAt: { gte: now } } })),
    safeCount(() =>
      prisma.scheduledPost.count({
        where: { tenantId, OR: [{ status: 'FAILED' }, { errorMessage: { not: null } }] },
      }),
    ),
    safeCount(() =>
      prisma.socialPost.count({
        where: { tenantId, status: { in: ['AWAITING_APPROVAL', 'PENDING_APPROVAL'] } },
      }),
    ),
    safeCount(() => prisma.marketingPost.count({ where: { tenantId, status: 'DRAFT' } })),
    safeCount(() =>
      prisma.marketingPost.count({ where: { tenantId, status: 'SCHEDULED', scheduledFor: { gte: now } } }),
    ),
    safeCount(() => prisma.marketingPost.count({ where: { tenantId, status: 'FAILED' } })),
    safeCount(() =>
      prisma.marketingPost.count({
        where: { tenantId, status: 'SENT', updatedAt: { gte: todayStart, lte: todayEnd } },
      }),
    ),
    safeCount(() =>
      prisma.marketingPost.count({
        where: { tenantId, status: { in: ['AWAITING_APPROVAL', 'PENDING_APPROVAL'] } },
      }),
    ),
  ])

  const last14d = new Date(now)
  last14d.setDate(last14d.getDate() - 14)

  const channelPerfRows = await prisma.socialPost
    .findMany({
      where: { tenantId, publishedAt: { gte: last14d } },
      select: {
        platform: true,
        reach: true,
        impressions: true,
        engagement: true,
        likes: true,
        comments: true,
        shares: true,
        clicks: true,
      },
      take: 2000,
    })
    .catch(() => [])

  const byPlatform: Record<
    string,
    { posts: number; reach: number; impressions: number; engagement: number; clicks: number }
  > = {}
  for (const row of channelPerfRows) {
    const key = (row.platform || 'unknown').toLowerCase()
    byPlatform[key] ||= { posts: 0, reach: 0, impressions: 0, engagement: 0, clicks: 0 }
    byPlatform[key].posts += 1
    byPlatform[key].reach += row.reach ?? 0
    byPlatform[key].impressions += row.impressions ?? 0
    byPlatform[key].engagement += row.engagement ?? 0
    byPlatform[key].clicks += row.clicks ?? 0
  }

  const channelPerformance = Object.entries(byPlatform)
    .map(([platform, v]) => ({
      platform,
      posts: v.posts,
      reach: v.reach,
      impressions: v.impressions,
      engagement: v.engagement,
      clicks: v.clicks,
      engagementRate: v.impressions > 0 ? Math.round((v.engagement / v.impressions) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate)

  const [upcomingScheduledPosts, upcomingMarketingPosts, upcomingCampaigns, recentLaunches, publishedPosts90d, segments, unifiedInbox] =
    await Promise.all([
    prisma.scheduledPost
      .findMany({
        where: { tenantId, status: 'SCHEDULED', scheduledAt: { gte: now, lte: horizon } },
        orderBy: { scheduledAt: 'asc' },
        take: 8,
        select: { id: true, platform: true, content: true, scheduledAt: true, status: true },
      })
      .catch(() => []),
    prisma.marketingPost
      .findMany({
        where: { tenantId, status: 'SCHEDULED', scheduledFor: { gte: now, lte: horizon } },
        orderBy: { scheduledFor: 'asc' },
        take: 8,
        select: { id: true, channel: true, content: true, scheduledFor: true, status: true },
      })
      .catch(() => []),
    prisma.campaign
      .findMany({
        where: { tenantId, scheduledFor: { gte: now, lte: horizon } },
        orderBy: { scheduledFor: 'asc' },
        take: 8,
        select: { id: true, name: true, type: true, scheduledFor: true, status: true },
      })
      .catch(() => []),
    prisma.campaign
      .findMany({
        where: { tenantId, sentAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
        orderBy: { sentAt: 'desc' },
        take: 6,
        select: { id: true, name: true, type: true, sentAt: true, status: true },
      })
      .catch(() => []),
    prisma.socialPost
      .findMany({
        where: { tenantId, publishedAt: { gte: new Date(now.getTime() - 90 * 86400000) } },
        select: { publishedAt: true, engagement: true },
        take: 500,
      })
      .catch(() => []),
    prisma.segment
      .findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, criteria: true },
      })
      .catch(() => []),
    fetchUnifiedInbox(tenantId, { sinceDays: 7, limit: 12 }),
  ])

  type CalendarItem = {
    id: string
    kind: 'scheduled_post' | 'marketing_post' | 'campaign' | 'launch'
    title: string
    channel: string
    at: string
    status: string
  }

  const calendar: CalendarItem[] = [
    ...upcomingScheduledPosts.map((p) => ({
      id: p.id,
      kind: 'scheduled_post' as const,
      title: p.content.slice(0, 80) || 'Scheduled post',
      channel: p.platform,
      at: p.scheduledAt.toISOString(),
      status: p.status,
    })),
    ...upcomingMarketingPosts.map((p) => ({
      id: p.id,
      kind: 'marketing_post' as const,
      title: p.content.slice(0, 80) || 'Studio post',
      channel: p.channel,
      at: (p.scheduledFor ?? now).toISOString(),
      status: p.status,
    })),
    ...upcomingCampaigns.map((c) => ({
      id: c.id,
      kind: 'campaign' as const,
      title: c.name,
      channel: c.type,
      at: (c.scheduledFor ?? now).toISOString(),
      status: c.status,
    })),
    ...recentLaunches.map((c) => ({
      id: c.id,
      kind: 'launch' as const,
      title: c.name,
      channel: c.type,
      at: (c.sentAt ?? now).toISOString(),
      status: c.status,
    })),
  ]
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(0, 12)

  const bestTimeToPost = computeBestTimeSlots(publishedPosts90d)
  const audienceSegments = segments.map((s) => ({
    id: s.id,
    name: s.name,
    criteria: s.criteria,
  }))

  return {
    publishing: {
      drafts: draftSocial + draftMarketing,
      scheduled: scheduledUpcoming + scheduledMarketing,
      awaitingApproval: awaitingApprovalSocial + awaitingApprovalMarketing,
      publishedToday: publishedTodaySocial + publishedTodayMarketing,
      failed: scheduledFailed + failedMarketing,
    },
    channelPerformance,
    engagement: unifiedInbox.summary,
    unifiedInbox: unifiedInbox.items,
    calendar,
    bestTimeToPost,
    audienceSegments,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const data = await unstable_cache(() => compute(tenantId), ['marketing-command-center', tenantId], {
      revalidate: 30,
    })()
    const res = NextResponse.json(data)
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    res.headers.set('Vary', 'Authorization')
    return res
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Marketing command-center error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get command center data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** Cached stats fetcher (revalidate 30s). */
async function getCachedMarketingStats(tenantId: string) {
  return unstable_cache(
    async () => {
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      const [campaignsThisMonth, campaignsLastMonth, allSentCampaigns] = await Promise.all([
        prisma.campaign.findMany({
          where: {
            tenantId,
            status: 'sent',
            sentAt: { gte: thisMonthStart },
          },
        }),
        prisma.campaign.findMany({
          where: {
            tenantId,
            status: 'sent',
            sentAt: { gte: lastMonthStart, lte: lastMonthEnd },
          },
        }),
        prisma.campaign.findMany({
          where: { tenantId, status: 'sent' },
        }),
      ])

      const totalReach = allSentCampaigns.reduce((s, c) => s + c.sent, 0)
      const totalDelivered = allSentCampaigns.reduce((s, c) => s + c.delivered, 0)
      const totalOpened = allSentCampaigns.reduce((s, c) => s + c.opened, 0)
      const totalClicked = allSentCampaigns.reduce((s, c) => s + c.clicked, 0)

      const campaignsLaunched = allSentCampaigns.length
      const campaignsLaunchedThisMonth = campaignsThisMonth.length
      const campaignsLaunchedLastMonth = campaignsLastMonth.length
      const campaignsLaunchedGrowth =
        campaignsLaunchedLastMonth > 0
          ? Math.round(
              ((campaignsLaunchedThisMonth - campaignsLaunchedLastMonth) / campaignsLaunchedLastMonth) * 100
            )
          : campaignsLaunchedThisMonth > 0 ? 100 : 0

      const reachLastMonth = campaignsLastMonth.reduce((s, c) => s + c.sent, 0)
      const totalReachGrowth =
        reachLastMonth > 0
          ? Math.round(((totalReach - reachLastMonth) / reachLastMonth) * 100)
          : totalReach > 0 ? 100 : 0

      const engagementRate =
        totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100 * 10) / 10 : 0
      const conversionRate =
        totalDelivered > 0 ? Math.round((totalClicked / totalDelivered) * 100 * 10) / 10 : 0

      let socialPostsSent = 0
      try {
        const sentPosts = await prisma.marketingPost.count({
          where: { tenantId, status: 'SENT' },
        })
        socialPostsSent = sentPosts
      } catch {
        // MarketingPost may not exist in schema
      }

      const totalReachWithSocial = totalReach + socialPostsSent

      return {
        campaignsLaunched,
        campaignsLaunchedGrowth,
        totalReach: totalReachWithSocial,
        totalReachGrowth,
        engagementRate,
        conversionRate,
        totalOpened,
        totalClicked,
        totalDelivered,
        totalSent: allSentCampaigns.reduce((s, c) => s + c.sent, 0),
        socialPostsSent,
        roi: null as number | null,
      }
    },
    ['marketing-dashboard-stats', tenantId],
    { revalidate: 30 }
  )()
}

/**
 * GET /api/marketing/dashboard/stats
 * Real aggregates from Campaign + MarketingPost. No mock data.
 * ISR: revalidate 30s, Cache-Control for CDN/browser.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const data = await getCachedMarketingStats(tenantId)

    const res = NextResponse.json(data)
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    res.headers.set('Vary', 'Authorization')
    return res
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Marketing dashboard stats error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get dashboard stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

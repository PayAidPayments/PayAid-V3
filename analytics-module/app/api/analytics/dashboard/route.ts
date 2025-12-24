import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/analytics/dashboard - Get analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    // Check Analytics module license
    const { tenantId } = await requireAnalyticsAccess(request)

    const searchParams = request.nextUrl.searchParams
    const websiteId = searchParams.get('websiteId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 })
    }

    // Verify website belongs to tenant
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        tenantId: tenantId,
      },
    })

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: 30 days
    const end = endDate ? new Date(endDate) : new Date()

    // Get aggregated stats
    const [totalVisits, totalSessions, totalPageViews, uniqueVisitors] = await Promise.all([
      prisma.websiteVisit.count({
        where: {
          websiteId,
          visitedAt: { gte: start, lte: end },
        },
      }),
      prisma.websiteSession.count({
        where: {
          websiteId,
          startedAt: { gte: start, lte: end },
        },
      }),
      prisma.websiteSession.aggregate({
        where: {
          websiteId,
          startedAt: { gte: start, lte: end },
        },
        _sum: {
          pageViews: true,
        },
      }),
      prisma.websiteSession.groupBy({
        by: ['visitorId'],
        where: {
          websiteId,
          startedAt: { gte: start, lte: end },
          visitorId: { not: null },
        },
      }),
    ])

    // Calculate bounce rate
    const bounceSessions = await prisma.websiteSession.count({
      where: {
        websiteId,
        startedAt: { gte: start, lte: end },
        isBounce: true,
      },
    })
    const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0

    // Average session duration
    const sessionsWithDuration = await prisma.websiteSession.findMany({
      where: {
        websiteId,
        startedAt: { gte: start, lte: end },
        duration: { not: null },
      },
      select: { duration: true },
    })
    const avgDuration =
      sessionsWithDuration.length > 0
        ? sessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionsWithDuration.length
        : 0

    // Top pages
    const topPages = await prisma.websiteVisit.groupBy({
      by: ['pageId'],
      where: {
        websiteId,
        visitedAt: { gte: start, lte: end },
        pageId: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    const pageDetails = await Promise.all(
      topPages.map(async (tp) => {
        if (!tp.pageId) return null
        const page = await prisma.websitePage.findUnique({
          where: { id: tp.pageId },
          select: { path: true, title: true },
        })
        return {
          pageId: tp.pageId,
          path: page?.path,
          title: page?.title,
          visits: tp._count.id,
        }
      })
    )

    // Traffic sources
    const trafficSources = await prisma.websiteVisit.groupBy({
      by: ['referrer'],
      where: {
        websiteId,
        visitedAt: { gte: start, lte: end },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    // Device breakdown
    const deviceBreakdown = await prisma.websiteVisit.groupBy({
      by: ['device'],
      where: {
        websiteId,
        visitedAt: { gte: start, lte: end },
        device: { not: null },
      },
      _count: {
        id: true,
      },
    })

    // Browser breakdown
    const browserBreakdown = await prisma.websiteVisit.groupBy({
      by: ['browser'],
      where: {
        websiteId,
        visitedAt: { gte: start, lte: end },
        browser: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    // Daily visits (for chart)
    const dailyVisits = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE(visited_at) as date, COUNT(*)::bigint as count
      FROM website_visits
      WHERE website_id = ${websiteId}
        AND visited_at >= ${start}
        AND visited_at <= ${end}
      GROUP BY DATE(visited_at)
      ORDER BY date ASC
    `

    return NextResponse.json({
      summary: {
        totalVisits,
        totalSessions,
        totalPageViews: totalPageViews._sum.pageViews || 0,
        uniqueVisitors: uniqueVisitors.length,
        bounceRate: Math.round(bounceRate * 100) / 100,
        avgSessionDuration: Math.round(avgDuration),
      },
      topPages: pageDetails.filter((p) => p !== null),
      trafficSources: trafficSources.map((ts) => ({
        referrer: ts.referrer || 'Direct',
        visits: ts._count.id,
      })),
      deviceBreakdown: deviceBreakdown.map((d) => ({
        device: d.device || 'Unknown',
        visits: d._count.id,
      })),
      browserBreakdown: browserBreakdown.map((b) => ({
        browser: b.browser || 'Unknown',
        visits: Number(b._count.id),
      })),
      dailyVisits: dailyVisits.map((dv) => ({
        date: dv.date.toISOString().split('T')[0],
        count: Number(dv.count),
      })),
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get analytics dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics dashboard' },
      { status: 500 }
    )
  }
}

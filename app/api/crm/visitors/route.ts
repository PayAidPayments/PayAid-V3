import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

interface VisitorInsight {
  visitorId: string
  sessionCount: number
  totalPageViews: number
  firstVisit: string
  lastVisit: string
  averageSessionDuration: number
  totalDuration: number
  pages: Array<{
    path: string
    title: string
    views: number
    timeSpent: number
  }>
  device: string
  browser: string
  os: string
  country?: string
  city?: string
  referrer?: string
  intentScore: number
  isHighIntent: boolean
  events: Array<{
    type: string
    name: string
    count: number
    lastOccurred: string
    metadata?: any
  }>
  website?: {
    id: string
    name: string
    domain: string | null
  }
  contactId?: string
  contactName?: string
  contactEmail?: string
}

// Calculate intent score based on behavior
function calculateIntentScore(visitor: any): number {
  let score = 0

  // Page views (more = higher intent)
  if (visitor.totalPageViews >= 10) score += 30
  else if (visitor.totalPageViews >= 5) score += 20
  else if (visitor.totalPageViews >= 3) score += 10

  // Session count (returning visitor = higher intent)
  if (visitor.sessionCount >= 3) score += 25
  else if (visitor.sessionCount >= 2) score += 15

  // Time on site (engaged = higher intent)
  const avgDuration = visitor.averageSessionDuration || 0
  if (avgDuration >= 300) score += 20 // 5+ minutes
  else if (avgDuration >= 120) score += 15 // 2+ minutes
  else if (avgDuration >= 60) score += 10 // 1+ minute

  // High-intent events
  const highIntentEvents = visitor.events?.filter((e: any) =>
    ['form_submit', 'high_intent_click', 'scroll_depth'].includes(e.name)
  ) || []
  score += highIntentEvents.length * 10

  // Scroll depth (engaged = higher intent)
  const scrollEvents = visitor.events?.filter((e: any) => e.name === 'scroll_depth') || []
  const maxScroll = Math.max(...scrollEvents.map((e: any) => e.metadata?.depth || 0), 0)
  if (maxScroll >= 100) score += 15
  else if (maxScroll >= 75) score += 10
  else if (maxScroll >= 50) score += 5

  // Time on page events
  const timeOnPageEvents = visitor.events?.filter((e: any) => e.name === 'time_on_page_30s') || []
  score += timeOnPageEvents.length * 5

  return Math.min(100, score)
}

// GET /api/crm/visitors - Get anonymous visitors with intelligence
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const websiteId = searchParams.get('websiteId')
    const highIntentOnly = searchParams.get('highIntentOnly') === 'true'

    // Get all websites for this tenant
    const websites = await prisma.website.findMany({
      where: { tenantId },
      select: { id: true, name: true, domain: true },
    })

    if (websites.length === 0) {
      return NextResponse.json({ visitors: [], stats: null })
    }

    const websiteIds = websiteId
      ? [websiteId]
      : websites.map(w => w.id)

    // Get all sessions grouped by visitor
    const sessions = await prisma.websiteSession.findMany({
      where: {
        websiteId: { in: websiteIds },
        tenantId,
      },
      include: {
        visits: {
          include: {
            page: {
              select: {
                id: true,
                path: true,
                title: true,
              },
            },
          },
          orderBy: {
            visitedAt: 'desc',
          },
        },
        events: {
          orderBy: {
            occurredAt: 'desc',
          },
        },
        website: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    // Group sessions by visitorId
    const visitorMap = new Map<string, any>()

    sessions.forEach(session => {
      const visitorId = session.visitorId || 'unknown'
      
      if (!visitorMap.has(visitorId)) {
        visitorMap.set(visitorId, {
          visitorId,
          sessions: [],
          totalPageViews: 0,
          totalDuration: 0,
          pages: new Map(),
          events: new Map(),
          firstVisit: session.startedAt,
          lastVisit: session.startedAt,
          device: session.visits[0]?.device || 'unknown',
          browser: session.visits[0]?.browser || 'unknown',
          os: session.visits[0]?.os || 'unknown',
          country: session.visits[0]?.country,
          city: session.visits[0]?.city,
          referrer: session.visits[0]?.referrer,
          website: session.website,
        })
      }

      const visitor = visitorMap.get(visitorId)!
      visitor.sessions.push(session)
      visitor.totalPageViews += session.pageViews
      visitor.totalDuration += session.duration || 0
      
      if (session.startedAt < visitor.firstVisit) {
        visitor.firstVisit = session.startedAt
      }
      if (session.startedAt > visitor.lastVisit) {
        visitor.lastVisit = session.startedAt
      }

      // Aggregate pages
      session.visits.forEach(visit => {
        if (visit.page) {
          const pageKey = visit.page.path
          if (!visitor.pages.has(pageKey)) {
            visitor.pages.set(pageKey, {
              path: pageKey,
              title: visit.page.title,
              views: 0,
              timeSpent: 0,
            })
          }
          const page = visitor.pages.get(pageKey)!
          page.views += 1
        }
      })

      // Aggregate events
      session.events.forEach(event => {
        const eventKey = `${event.eventType}_${event.eventName}`
        if (!visitor.events.has(eventKey)) {
          visitor.events.set(eventKey, {
            type: event.eventType,
            name: event.eventName,
            count: 0,
            lastOccurred: event.occurredAt.toISOString(),
            metadata: event.metadata,
          })
        }
        const eventData = visitor.events.get(eventKey)!
        eventData.count += 1
        if (event.occurredAt > new Date(eventData.lastOccurred)) {
          eventData.lastOccurred = event.occurredAt.toISOString()
        }
      })
    })

    // Transform to insights
    const visitors: VisitorInsight[] = Array.from(visitorMap.values()).map(visitor => {
      const sessionCount = visitor.sessions.length
      const averageSessionDuration = sessionCount > 0
        ? Math.round(visitor.totalDuration / sessionCount)
        : 0

      const intentScore = calculateIntentScore({
        totalPageViews: visitor.totalPageViews,
        sessionCount,
        averageSessionDuration,
        events: Array.from(visitor.events.values()),
      })

      return {
        visitorId: visitor.visitorId,
        sessionCount,
        totalPageViews: visitor.totalPageViews,
        firstVisit: visitor.firstVisit.toISOString(),
        lastVisit: visitor.lastVisit.toISOString(),
        averageSessionDuration,
        totalDuration: visitor.totalDuration,
        pages: Array.from(visitor.pages.values()),
        device: visitor.device,
        browser: visitor.browser,
        os: visitor.os,
        country: visitor.country,
        city: visitor.city,
        referrer: visitor.referrer,
        intentScore,
        isHighIntent: intentScore >= 50,
        events: Array.from(visitor.events.values()),
        website: visitor.website,
      } as VisitorInsight
    })

    // Filter high-intent only if requested
    const filteredVisitors = highIntentOnly
      ? visitors.filter(v => v.isHighIntent)
      : visitors

    // Calculate stats
    const stats = {
      totalVisitors: visitors.length,
      highIntentVisitors: visitors.filter(v => v.isHighIntent).length,
      totalSessions: visitors.reduce((sum, v) => sum + v.sessionCount, 0),
      totalPageViews: visitors.reduce((sum, v) => sum + v.totalPageViews, 0),
      averageIntentScore: visitors.length > 0
        ? visitors.reduce((sum, v) => sum + v.intentScore, 0) / visitors.length
        : 0,
      topCountries: Array.from(
        new Map(
          visitors
            .filter(v => v.country)
            .map(v => [v.country, (visitors.filter(v2 => v2.country === v.country).length)])
        ).entries()
      )
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    }

    // Sort by intent score (highest first)
    filteredVisitors.sort((a, b) => b.intentScore - a.intentScore)

    return NextResponse.json({
      visitors: filteredVisitors,
      stats,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get visitors error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visitors', message: error?.message },
      { status: 500 }
    )
  }
}

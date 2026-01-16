import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/websites/[id]/funnel - Get funnel analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id: websiteId } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    })

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.visitedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Get all visits
    const visits = await prisma.websiteVisit.findMany({
      where: {
        websiteId,
        ...dateFilter,
      },
      include: { session: true },
    })

    // Get sessions
    const sessions = await prisma.websiteSession.findMany({
      where: {
        websiteId,
        ...(startDate && endDate
          ? {
              startedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
    })

    // Calculate funnel steps
    const totalVisitors = new Set(sessions.map((s) => s.visitorId)).size
    const visitorsWithPageView = new Set(visits.map((v) => v.visitorId)).size
    const visitorsWithMultiplePages = sessions.filter((s) => s.pageViews > 1).length
    const visitorsWithEvent = new Set(
      (
        await prisma.websiteEvent.findMany({
          where: {
            websiteId,
            eventType: 'form_submit',
            ...(startDate && endDate
              ? {
                  occurredAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                  },
                }
              : {}),
          },
          select: { sessionId: true },
        })
      ).map((e) => e.sessionId)
    ).size

    // Get page-specific funnels
    const pageFunnels: Record<string, { views: number; unique: number }> = {}
    visits.forEach((visit) => {
      const path = visit.path
      if (!pageFunnels[path]) {
        pageFunnels[path] = { views: 0, unique: new Set() }
      }
      pageFunnels[path].views++
      if (visit.visitorId) {
        pageFunnels[path].unique.add(visit.visitorId)
      }
    })

    const pageFunnelData = Object.entries(pageFunnels)
      .map(([path, data]) => ({
        path,
        views: data.views,
        unique: data.unique.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    return NextResponse.json({
      funnel: {
        totalVisitors,
        visitorsWithPageView,
        visitorsWithMultiplePages,
        visitorsWithEvent,
        conversionRate: totalVisitors > 0 ? (visitorsWithEvent / totalVisitors) * 100 : 0,
      },
      pageFunnels: pageFunnelData,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get funnel error:', error)
    return NextResponse.json(
      { error: 'Failed to get funnel data' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/websites/[id]/analytics - Get website analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const website = await prisma.website.findFirst({
      where: { id, tenantId },
    })

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    // Get visits
    const visits = await prisma.websiteVisit.findMany({
      where: { websiteId: id },
      include: { session: true },
    })

    // Get sessions
    const sessions = await prisma.websiteSession.findMany({
      where: { websiteId: id },
    })

    // Calculate statistics
    const totalVisits = visits.length
    const uniqueVisitors = new Set(visits.map((v) => v.visitorId)).size
    const totalSessions = sessions.length

    // Average session duration
    const sessionDurations = sessions
      .filter((s) => s.lastActivityAt && s.startedAt)
      .map((s) => {
        const start = new Date(s.startedAt).getTime()
        const end = new Date(s.lastActivityAt!).getTime()
        return end - start
      })
    const averageSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0

    // Bounce rate (sessions with only 1 visit)
    const singleVisitSessions = sessions.filter(
      (s) => visits.filter((v) => v.sessionId === s.id).length === 1
    ).length
    const bounceRate = totalSessions > 0 ? (singleVisitSessions / totalSessions) * 100 : 0

    // Top pages
    const pageCounts: Record<string, number> = {}
    visits.forEach((v) => {
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1
    })
    const topPages = Object.entries(pageCounts)
      .map(([path, visits]) => ({ path, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10)

    // Referrers
    const referrerCounts: Record<string, number> = {}
    visits.forEach((v) => {
      const ref = v.referrer || 'Direct'
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1
    })
    const referrers = Object.entries(referrerCounts)
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5)

    // Devices (from user agent - simplified)
    const deviceCounts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 }
    sessions.forEach((s) => {
      const ua = s.userAgent || ''
      if (/mobile/i.test(ua)) deviceCounts.Mobile++
      else if (/tablet/i.test(ua)) deviceCounts.Tablet++
      else deviceCounts.Desktop++
    })
    const devices = Object.entries(deviceCounts).map(([device, visits]) => ({
      device,
      visits,
    }))

    // Daily visits (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentVisits = visits.filter(
      (v) => new Date(v.visitedAt) >= thirtyDaysAgo
    )
    const dailyCounts: Record<string, { visits: number; unique: Set<string> }> = {}
    recentVisits.forEach((v) => {
      const date = new Date(v.visitedAt).toISOString().split('T')[0]
      if (!dailyCounts[date]) {
        dailyCounts[date] = { visits: 0, unique: new Set() }
      }
      dailyCounts[date].visits++
      dailyCounts[date].unique.add(v.visitorId)
    })
    const dailyVisits = Object.entries(dailyCounts)
      .map(([date, data]) => ({
        date,
        visits: data.visits,
        unique: data.unique.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      totalVisits,
      uniqueVisitors,
      totalSessions,
      averageSessionDuration,
      bounceRate,
      topPages,
      referrers,
      devices,
      dailyVisits,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get website analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get website analytics' },
      { status: 500 }
    )
  }
}


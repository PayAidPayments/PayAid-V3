import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/auth'

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(23, 59, 59, 999)
  return x
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || undefined
    const campaignId = searchParams.get('campaignId') || undefined
    const language = searchParams.get('language') || undefined
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const period = searchParams.get('period') || 'today' // today | week | month | custom

    const now = new Date()
    let startDate = startOfDay(now)
    let endDate = endOfDay(now)
    if (period === 'week') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
      startDate = startOfDay(startDate)
    } else if (period === 'month') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
      startDate = startOfDay(startDate)
    } else if (startDateParam || endDateParam) {
      if (startDateParam) startDate = new Date(startDateParam)
      if (endDateParam) endDate = endOfDay(new Date(endDateParam))
    }

    type Where = { tenantId: string; agentId?: string; languageUsed?: string; id?: { in: string[] }; createdAt?: { gte: Date; lte: Date } }
    const where: Where = {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
    }
    if (agentId) where.agentId = agentId
    if (language) where.languageUsed = language

    if (campaignId) {
      const contactCallIds = await prisma.voiceAgentCampaignContact.findMany({
        where: { campaignId, callId: { not: null } },
        select: { callId: true },
      })
      const ids = contactCallIds.map((c) => c.callId).filter(Boolean) as string[]
      if (ids.length === 0) {
        return NextResponse.json({
          analytics: {
            overview: { totalCalls: 0, completedCalls: 0, answeredCalls: 0, answeredRate: 0, conversionRate: 0, averageDuration: 0, totalCost: 0, revenueGenerated: 0 },
            sentiment: { averageScore: 0, analyzedCalls: 0, positivePercent: 0 },
            callsByStatus: [], callsByLanguage: [], hourlyVolume: [], conversionFunnel: [], agentPerformance: [], conversionByAgent: [], topPerformers: [],
          },
        })
      }
      where.id = { in: ids }
    }

    const [
      totalCalls,
      completedCalls,
      answeredCalls,
      totalDuration,
      totalCost,
      callsByStatus,
      callsByLanguage,
      sentimentStats,
      positiveSentimentCount,
      callsWithMetadata,
      hourlyCalls,
      callsByAgent,
    ] = await Promise.all([
      prisma.voiceAgentCall.count({ where }),
      prisma.voiceAgentCall.count({
        where: { ...where, status: 'completed' },
      }),
      prisma.voiceAgentCall.count({
        where: {
          ...where,
          status: { in: ['completed', 'in-progress'] },
        },
      }),
      prisma.voiceAgentCall.aggregate({
        where: { ...where, durationSeconds: { not: null } },
        _sum: { durationSeconds: true },
      }),
      prisma.voiceAgentCall.aggregate({
        where: { ...where, costRupees: { not: null } },
        _sum: { costRupees: true },
      }),
      prisma.voiceAgentCall.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.voiceAgentCall.groupBy({
        by: ['languageUsed'],
        where: { ...where, languageUsed: { not: null } },
        _count: true,
      }),
      prisma.voiceAgentCallMetadata.aggregate({
        where: { call: { tenantId, createdAt: where.createdAt, ...(agentId ? { agentId } : {}) } },
        _avg: { sentimentScore: true },
        _count: true,
      }),
      prisma.voiceAgentCallMetadata.count({
        where: {
          call: { tenantId, createdAt: where.createdAt, ...(agentId ? { agentId } : {}) },
          sentiment: 'positive',
        },
      }),
      prisma.voiceAgentCall.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          status: true,
          durationSeconds: true,
          metadata: { select: { sentiment: true, sentimentScore: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.voiceAgentCall.groupBy({
        by: ['agentId'],
        where,
        _count: true,
        _avg: { durationSeconds: true },
      }),
    ])

    const totalDurationSec = totalDuration._sum.durationSeconds || 0
    const avgDurationSec = answeredCalls > 0 ? totalDurationSec / answeredCalls : 0
    const answeredRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0
    const conversionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0
    const sentimentTotal = sentimentStats._count || 0
    const positivePct = sentimentTotal > 0 ? (positiveSentimentCount / sentimentTotal) * 100 : 0

    const hourlyMap: Record<number, number> = {}
    for (let h = 0; h < 24; h++) hourlyMap[h] = 0
    callsWithMetadata.forEach((c) => {
      const h = new Date(c.createdAt).getHours()
      hourlyMap[h] = (hourlyMap[h] || 0) + 1
    })
    const hourlyVolume = Object.entries(hourlyMap).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count,
      hourNum: Number(hour),
    })).sort((a, b) => a.hourNum - b.hourNum)

    const agentIds = [...new Set(callsByAgent.map((a) => a.agentId))]
    const agents = agentIds.length
      ? await prisma.voiceAgent.findMany({
          where: { id: { in: agentIds } },
          select: { id: true, name: true },
        })
      : []
    const agentNameMap = Object.fromEntries(agents.map((a) => [a.id, a.name]))

    const completedByAgent = await prisma.voiceAgentCall.groupBy({
      by: ['agentId'],
      where: { ...where, status: 'completed' },
      _count: true,
    })
    const completedMap = Object.fromEntries(completedByAgent.map((a) => [a.agentId, a._count]))

    const agentPerformance = callsByAgent.map((a) => {
      const completed = completedMap[a.agentId] ?? 0
      const convRate = a._count > 0 ? Math.round((completed / a._count) * 100) : 0
      return {
        agentId: a.agentId,
        agentName: agentNameMap[a.agentId] || a.agentId,
        calls: a._count,
        avgDurationSeconds: a._avg.durationSeconds ?? 0,
        conversionRate: convRate,
        completedCalls: completed,
      }
    })

    const conversionByAgent = agentPerformance.map((a) => ({
      agent: a.agentName,
      conversionRate: a.conversionRate,
      calls: a.calls,
    }))

    const revenueGenerated = 0

    const topPerformers = agentPerformance.map((a) => ({
      agentId: a.agentId,
      agentName: a.agentName,
      calls: a.calls,
      conversionRate: a.conversionRate,
      revenueRupees: 0,
    }))

    return NextResponse.json({
      analytics: {
        overview: {
          totalCalls,
          completedCalls,
          answeredCalls,
          successRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
          answeredRate,
          conversionRate,
          totalDuration: totalDurationSec,
          totalCost: Number(totalCost._sum.costRupees || 0),
          averageDuration: avgDurationSec,
          revenueGenerated,
          period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        sentiment: {
          averageScore: Number(sentimentStats._avg.sentimentScore || 0),
          analyzedCalls: sentimentTotal,
          positivePercent: positivePct,
        },
        callsByStatus: callsByStatus.map((item: { status: string; _count: number }) => ({
          status: item.status,
          count: item._count,
        })),
        callsByLanguage: (callsByLanguage || []).map((item: { languageUsed: string | null; _count: number }) => ({
          language: item.languageUsed || 'unknown',
          count: item._count,
        })),
        hourlyVolume,
        conversionFunnel: [
          { stage: 'Total', count: totalCalls },
          { stage: 'Answered', count: answeredCalls },
          { stage: 'Completed', count: completedCalls },
        ],
        agentPerformance,
        conversionByAgent,
        topPerformers,
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}


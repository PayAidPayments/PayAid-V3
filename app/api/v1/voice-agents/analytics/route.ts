import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query
    const where: any = { tenantId }
    if (agentId) {
      where.voiceAgentId = agentId
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Get call statistics
    const [
      totalCalls,
      completedCalls,
      failedCalls,
      totalDuration,
      totalCost,
      callsByStatus,
      callsByLanguage,
      sentimentStats,
    ] = await Promise.all([
      // Total calls
      prisma.voiceAgentCall.count({ where }),

      // Completed calls
      prisma.voiceAgentCall.count({
        where: { ...where, status: 'completed' },
      }),

      // Failed calls
      prisma.voiceAgentCall.count({
        where: { ...where, status: 'failed' },
      }),

      // Total duration
      prisma.voiceAgentCall.aggregate({
        where: { ...where, durationSeconds: { not: null } },
        _sum: { durationSeconds: true },
      }),

      // Total cost
      prisma.voiceAgentCall.aggregate({
        where: { ...where, costRupees: { not: null } },
        _sum: { costRupees: true },
      }),

      // Calls by status
      prisma.voiceAgentCall.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      // Calls by language
      prisma.voiceAgentCall.groupBy({
        by: ['languageUsed'],
        where: { ...where, languageUsed: { not: null } },
        _count: true,
      }),

      // Sentiment statistics - TODO: VoiceAgentCallTranscript model not yet in schema
      // Return empty stats until model is added
      Promise.resolve({
        _avg: { sentimentScore: null },
        _count: 0,
      }),
    ])

    return NextResponse.json({
      analytics: {
        overview: {
          totalCalls,
          completedCalls,
          failedCalls,
          successRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
          totalDuration: totalDuration._sum.durationSeconds || 0,
          totalCost: totalCost._sum.costRupees || 0,
          averageDuration:
            completedCalls > 0
              ? (totalDuration._sum.durationSeconds || 0) / completedCalls
              : 0,
        },
        callsByStatus: callsByStatus.map((item: any) => ({
          status: item.status,
          count: item._count,
        })),
        callsByLanguage: callsByLanguage.map((item: any) => ({
          language: item.languageUsed,
          count: item._count,
        })),
        sentiment: {
          averageScore: sentimentStats._avg.sentimentScore || 0,
          analyzedCalls: sentimentStats._count,
        },
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


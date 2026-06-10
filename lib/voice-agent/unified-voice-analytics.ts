/**
 * Unified voice analytics — telephony (VoiceAgentCall) + browser-live demo sessions.
 * Blueprint Phase 1.5 / Phase 3: single operator view across channels.
 */
import type { PrismaClient } from '@prisma/client'
import {
  aggregateDemoSessionAnalytics,
  type DemoSessionAnalytics,
} from '@/lib/voice-agent/demo-session-analytics'

export type UnifiedVoiceAnalyticsInput = {
  tenantId: string
  agentId?: string
  startDate?: Date
  endDate?: Date
}

export type UnifiedVoiceAnalytics = {
  telephony: {
    totalCalls: number
    completedCalls: number
    answeredCalls: number
    answeredRate: number
    avgDurationSeconds: number
  }
  browserLive: DemoSessionAnalytics
  combined: {
    totalInteractions: number
    bargeInSessions: number
    followUpTasksCreated: number
    routing: Record<string, number>
    topObjectionTags: { tag: string; count: number }[]
  }
}

function topTags(tags: Record<string, number>, limit = 8): { tag: string; count: number }[] {
  return Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}

export async function loadUnifiedVoiceAnalytics(
  prisma: PrismaClient,
  input: UnifiedVoiceAnalyticsInput,
): Promise<UnifiedVoiceAnalytics> {
  const callWhere = {
    tenantId: input.tenantId,
    ...(input.agentId ? { agentId: input.agentId } : {}),
    ...(input.startDate || input.endDate
      ? {
          createdAt: {
            ...(input.startDate ? { gte: input.startDate } : {}),
            ...(input.endDate ? { lte: input.endDate } : {}),
          },
        }
      : {}),
  }

  const [totalCalls, completedCalls, answeredCalls, durationAgg] = await Promise.all([
    prisma.voiceAgentCall.count({ where: callWhere }),
    prisma.voiceAgentCall.count({ where: { ...callWhere, status: 'completed' } }),
    prisma.voiceAgentCall.count({
      where: { ...callWhere, status: { in: ['completed', 'in-progress'] } },
    }),
    prisma.voiceAgentCall.aggregate({
      where: { ...callWhere, durationSeconds: { not: null } },
      _avg: { durationSeconds: true },
      _count: { durationSeconds: true },
    }),
  ])

  const browserLive = await aggregateDemoSessionAnalytics(prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    limit: 500,
    startDate: input.startDate,
    endDate: input.endDate,
  })

  const telephonyBargeIn = await prisma.voiceAgentCall.aggregate({
    where: callWhere,
    _sum: { bargeInCount: true },
  })

  const answeredRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0
  const routing = { ...browserLive.routing }
  if (totalCalls > 0) {
    routing.telephony_call = (routing.telephony_call || 0) + totalCalls
  }

  return {
    telephony: {
      totalCalls,
      completedCalls,
      answeredCalls,
      answeredRate,
      avgDurationSeconds: Number(durationAgg._avg.durationSeconds || 0),
    },
    browserLive,
    combined: {
      totalInteractions: totalCalls + browserLive.endedCount,
      bargeInSessions: browserLive.bargeInSessions + (telephonyBargeIn._sum.bargeInCount ?? 0),
      followUpTasksCreated: browserLive.followUpTasksCreated,
      routing,
      topObjectionTags: topTags(browserLive.objectionTags),
    },
  }
}

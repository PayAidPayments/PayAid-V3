/**
 * Aggregate post-call intelligence from ended browser-live demo sessions.
 */

import type { PrismaClient } from '@prisma/client'

export type DemoSessionAnalytics = {
  sessionCount: number
  endedCount: number
  routing: Record<string, number>
  sentiment: {
    positive: number
    negative: number
    neutral: number
    averageScore: number
  }
  objectionTags: Record<string, number>
  followUpTasksCreated: number
  avgTurnCount: number
  bargeInSessions: number
}

function readPostCall(metadataJson: unknown): {
  routing?: string
  sentiment?: { sentiment?: string; score?: number }
  objectionTags?: string[]
  entities?: { turnCount?: number }
  crm?: { followUpTaskIds?: string[] }
} | null {
  if (!metadataJson || typeof metadataJson !== 'object' || Array.isArray(metadataJson)) return null
  const meta = metadataJson as Record<string, unknown>
  const postCall = meta.postCall
  if (!postCall || typeof postCall !== 'object' || Array.isArray(postCall)) return null
  return postCall as ReturnType<typeof readPostCall>
}

export async function aggregateDemoSessionAnalytics(
  prisma: PrismaClient,
  input: {
    tenantId: string
    agentId?: string
    limit?: number
    startDate?: Date
    endDate?: Date
  },
): Promise<DemoSessionAnalytics> {
  const sessions = await prisma.voiceDemoSession.findMany({
    where: {
      tenantId: input.tenantId,
      ...(input.agentId ? { voiceAgentId: input.agentId } : {}),
      status: 'ended',
      ...(input.startDate || input.endDate
        ? {
            endedAt: {
              ...(input.startDate ? { gte: input.startDate } : {}),
              ...(input.endDate ? { lte: input.endDate } : {}),
            },
          }
        : {}),
    },
    select: { metadataJson: true },
    orderBy: { endedAt: 'desc' },
    take: input.limit ?? 200,
  })

  const routing: Record<string, number> = {}
  const objectionTags: Record<string, number> = {}
  let positive = 0
  let negative = 0
  let neutral = 0
  let scoreSum = 0
  let scoreCount = 0
  let turnSum = 0
  let followUpTasksCreated = 0
  let bargeInSessions = 0

  for (const session of sessions) {
    const postCall = readPostCall(session.metadataJson)
    if (!postCall) continue

    const r = postCall.routing || 'unknown'
    routing[r] = (routing[r] || 0) + 1

    const s = postCall.sentiment?.sentiment
    if (s === 'positive') positive += 1
    else if (s === 'negative') negative += 1
    else neutral += 1

    if (typeof postCall.sentiment?.score === 'number') {
      scoreSum += postCall.sentiment.score
      scoreCount += 1
    }

    for (const tag of postCall.objectionTags || []) {
      objectionTags[tag] = (objectionTags[tag] || 0) + 1
    }

    turnSum += postCall.entities?.turnCount ?? 0
    followUpTasksCreated += postCall.crm?.followUpTaskIds?.length ?? 0

    const meta = session.metadataJson as Record<string, unknown> | null
    if (typeof meta?.bargeInCount === 'number' && meta.bargeInCount > 0) {
      bargeInSessions += 1
    }
  }

  const endedCount = sessions.length

  return {
    sessionCount: endedCount,
    endedCount,
    routing,
    sentiment: {
      positive,
      negative,
      neutral,
      averageScore: scoreCount ? scoreSum / scoreCount : 0,
    },
    objectionTags,
    followUpTasksCreated,
    avgTurnCount: endedCount ? turnSum / endedCount : 0,
    bargeInSessions,
  }
}

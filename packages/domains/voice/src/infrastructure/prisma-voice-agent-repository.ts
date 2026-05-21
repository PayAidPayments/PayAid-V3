import { prisma } from '@payaid/db'
import type { CreateVoiceAgentInput, ListVoiceAgentsInput } from '../domain/schemas'
import type { VoiceAgentsOverview, VoiceAgentWithStats } from '../domain/stats-types'
import type { VoiceAgentListResult, VoiceAgentRecord } from '../domain/types'
import type { VoiceAgentRepository } from '../ports/voice-agent-repository'

function toRecord(row: {
  id: string
  tenantId: string
  name: string
  description: string | null
  language: string
  voiceId: string | null
  voiceTone: string | null
  systemPrompt: string
  phoneNumber: string | null
  status: string
  workflow: unknown
  createdAt: Date
  updatedAt: Date
}): VoiceAgentRecord {
  return { ...row }
}

/** Prisma adapter — swap for VoiceServiceHttpClient when extracted. */
export class PrismaVoiceAgentRepository implements VoiceAgentRepository {
  async create(input: CreateVoiceAgentInput): Promise<VoiceAgentRecord> {
    const agent = await prisma.voiceAgent.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        description: input.description ?? null,
        language: input.language,
        voiceId: input.voiceId ?? null,
        voiceTone: input.voiceTone ?? null,
        systemPrompt: input.systemPrompt,
        phoneNumber: input.phoneNumber ?? null,
        status: 'active',
        workflow: (input.workflow ?? undefined) as any,
      },
    })
    return toRecord(agent)
  }

  async list(input: ListVoiceAgentsInput): Promise<VoiceAgentListResult> {
    const where: { tenantId: string; status?: string; language?: string } = {
      tenantId: input.tenantId,
    }
    if (input.status) where.status = input.status
    if (input.language) where.language = input.language

    const [agents, total] = await Promise.all([
      prisma.voiceAgent.findMany({
        where,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.voiceAgent.count({ where }),
    ])

    return {
      agents: agents.map(toRecord),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit) || 0,
      },
    }
  }

  async resolveListTenantId(params: {
    jwtTenantId: string
    queryTenantId: string | null
    userId: string
  }): Promise<string> {
    const { jwtTenantId, queryTenantId, userId } = params
    if (!queryTenantId) return jwtTenantId
    if (queryTenantId === jwtTenantId) return queryTenantId
    if (userId) {
      const member = await prisma.tenantMember.findFirst({
        where: { userId, tenantId: queryTenantId },
      })
      if (member) return queryTenantId
    }
    if (queryTenantId) return queryTenantId
    return jwtTenantId
  }

  async enrichAgentsWithCallStats(
    tenantId: string,
    agents: VoiceAgentRecord[],
    totalAgentCount: number
  ): Promise<{ agents: VoiceAgentWithStats[]; overview: VoiceAgentsOverview }> {
    const tenantWhere = { tenantId }
    const agentIds = agents.map((a) => a.id)
    const [
      callCountsByAgent,
      completedByAgent,
      durationByAgent,
      totalCalls,
      totalCompleted,
      totalDurationAgg,
    ] = await Promise.all([
      agentIds.length > 0
        ? prisma.voiceAgentCall.groupBy({
            by: ['agentId'],
            where: { agentId: { in: agentIds } },
            _count: true,
          })
        : Promise.resolve([]),
      agentIds.length > 0
        ? prisma.voiceAgentCall.groupBy({
            by: ['agentId'],
            where: { agentId: { in: agentIds }, status: 'completed' },
            _count: true,
          })
        : Promise.resolve([]),
      agentIds.length > 0
        ? prisma.voiceAgentCall.groupBy({
            by: ['agentId'],
            where: { agentId: { in: agentIds }, durationSeconds: { not: null } },
            _sum: { durationSeconds: true },
          })
        : Promise.resolve([]),
      prisma.voiceAgentCall.count({ where: tenantWhere }),
      prisma.voiceAgentCall.count({ where: { ...tenantWhere, status: 'completed' } }),
      prisma.voiceAgentCall.aggregate({
        where: { ...tenantWhere, durationSeconds: { not: null } },
        _sum: { durationSeconds: true },
      }),
    ])

    const totalDurationSec = Number(totalDurationAgg._sum?.durationSeconds ?? 0)
    const overview: VoiceAgentsOverview = {
      totalAgents: totalAgentCount,
      totalCalls,
      totalMinutes: Math.round(totalDurationSec / 60),
      conversionRate: totalCalls > 0 ? Math.round((totalCompleted / totalCalls) * 100) : 0,
    }

    if (agents.length === 0) {
      return { agents: [], overview }
    }

    const countMap = Object.fromEntries(
      (callCountsByAgent as { agentId: string; _count: number }[]).map((c) => [c.agentId, c._count])
    )
    const completedMap = Object.fromEntries(
      (completedByAgent as { agentId: string; _count: number }[]).map((c) => [c.agentId, c._count])
    )
    const durationMap = Object.fromEntries(
      (durationByAgent as { agentId: string; _sum: { durationSeconds: number | null } }[]).map((c) => [
        c.agentId,
        c._sum.durationSeconds ?? 0,
      ])
    )

    const agentsWithStats: VoiceAgentWithStats[] = agents.map((a) => {
      const calls = countMap[a.id] ?? 0
      const completed = completedMap[a.id] ?? 0
      return {
        ...a,
        callCount: calls,
        completedCallCount: completed,
        conversionRate: calls > 0 ? Math.round((completed / calls) * 100) : 0,
        totalMinutes: Math.round((durationMap[a.id] ?? 0) / 60),
      }
    })

    return { agents: agentsWithStats, overview }
  }
}

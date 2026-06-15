import { createVoiceAgent } from './application/create-voice-agent'
import { enrichVoiceAgentsWithStats } from './application/enrich-voice-agents-stats'
import { listVoiceAgents } from './application/list-voice-agents'
import type { CreateVoiceAgentInput, ListVoiceAgentsInput } from './domain/schemas'
import type { VoiceAgentRecord } from './domain/types'
import { PrismaVoiceAgentRepository } from './infrastructure/prisma-voice-agent-repository'

export { createVoiceAgent } from './application/create-voice-agent'
export { listVoiceAgents } from './application/list-voice-agents'
export { enrichVoiceAgentsWithStats } from './application/enrich-voice-agents-stats'
export { createVoiceAgentInputSchema } from './domain/schemas'
export type { CreateVoiceAgentInput, ListVoiceAgentsInput } from './domain/schemas'
export type { VoiceAgentRecord, VoiceAgentListResult } from './domain/types'
export type { VoiceAgentRepository } from './ports/voice-agent-repository'
export { PrismaVoiceAgentRepository } from './infrastructure/prisma-voice-agent-repository'

/**
 * Default in-process wiring for Next.js API routes (modular monolith).
 * Replace repository with HTTP client when Voice service is extracted.
 */
export function createVoiceDomainDeps() {
  const voiceAgentRepository = new PrismaVoiceAgentRepository()
  return {
    voiceAgentRepository,
    createVoiceAgent: (input: CreateVoiceAgentInput) =>
      createVoiceAgent(input, { voiceAgentRepository }),
    listVoiceAgents: (input: ListVoiceAgentsInput) =>
      listVoiceAgents(input, { voiceAgentRepository }),
    enrichVoiceAgentsWithStats: (tenantId: string, agents: VoiceAgentRecord[], totalAgentCount: number) =>
      enrichVoiceAgentsWithStats(tenantId, agents, totalAgentCount, { voiceAgentRepository }),
    resolveListTenantId: voiceAgentRepository.resolveListTenantId.bind(voiceAgentRepository),
  }
}

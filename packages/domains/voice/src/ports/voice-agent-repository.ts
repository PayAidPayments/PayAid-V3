import type { CreateVoiceAgentInput, ListVoiceAgentsInput } from '../domain/schemas'
import type { VoiceAgentsOverview, VoiceAgentWithStats } from '../domain/stats-types'
import type { VoiceAgentListResult, VoiceAgentRecord } from '../domain/types'

/**
 * Persistence port for Voice domain.
 * Future microservice: replace with HTTP client implementing this interface.
 */
export interface VoiceAgentRepository {
  create(input: CreateVoiceAgentInput): Promise<VoiceAgentRecord>
  list(input: ListVoiceAgentsInput): Promise<VoiceAgentListResult>
  resolveListTenantId(params: {
    jwtTenantId: string
    queryTenantId: string | null
    userId: string
  }): Promise<string>
  enrichAgentsWithCallStats(
    tenantId: string,
    agents: VoiceAgentRecord[],
    totalAgentCount: number
  ): Promise<{ agents: VoiceAgentWithStats[]; overview: VoiceAgentsOverview }>
}

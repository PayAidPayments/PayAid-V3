import type { VoiceAgentsOverview, VoiceAgentWithStats } from '../domain/stats-types'
import type { VoiceAgentRecord } from '../domain/types'
import type { VoiceAgentRepository } from '../ports/voice-agent-repository'

export async function enrichVoiceAgentsWithStats(
  tenantId: string,
  agents: VoiceAgentRecord[],
  totalAgentCount: number,
  deps: { voiceAgentRepository: VoiceAgentRepository }
): Promise<{ agents: VoiceAgentWithStats[]; overview: VoiceAgentsOverview }> {
  return deps.voiceAgentRepository.enrichAgentsWithCallStats(tenantId, agents, totalAgentCount)
}

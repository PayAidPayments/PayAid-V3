import type { ListVoiceAgentsInput } from '../domain/schemas'
import type { VoiceAgentListResult } from '../domain/types'
import type { VoiceAgentRepository } from '../ports/voice-agent-repository'

export type ListVoiceAgentsDeps = {
  voiceAgentRepository: VoiceAgentRepository
}

export async function listVoiceAgents(
  input: ListVoiceAgentsInput,
  deps: ListVoiceAgentsDeps
): Promise<VoiceAgentListResult> {
  return deps.voiceAgentRepository.list(input)
}

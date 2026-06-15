import { createVoiceAgentInputSchema, type CreateVoiceAgentInput } from '../domain/schemas'
import type { VoiceAgentRecord } from '../domain/types'
import type { VoiceAgentRepository } from '../ports/voice-agent-repository'

export type CreateVoiceAgentDeps = {
  voiceAgentRepository: VoiceAgentRepository
}

export async function createVoiceAgent(
  rawInput: CreateVoiceAgentInput,
  deps: CreateVoiceAgentDeps
): Promise<VoiceAgentRecord> {
  const input = createVoiceAgentInputSchema.parse(rawInput)
  return deps.voiceAgentRepository.create(input)
}

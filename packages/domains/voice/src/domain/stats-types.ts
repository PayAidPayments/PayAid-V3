import type { VoiceAgentRecord } from './types'

export type VoiceAgentWithStats = VoiceAgentRecord & {
  callCount: number
  completedCallCount: number
  conversionRate: number
  totalMinutes: number
}

export type VoiceAgentsOverview = {
  totalAgents: number
  totalCalls: number
  totalMinutes: number
  conversionRate: number
}

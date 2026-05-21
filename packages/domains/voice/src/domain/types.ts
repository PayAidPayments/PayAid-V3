/** Domain-facing voice agent record (maps from Prisma; no ORM types in application layer). */
export type VoiceAgentRecord = {
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
}

export type VoiceAgentListResult = {
  agents: VoiceAgentRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

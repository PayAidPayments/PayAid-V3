import { z } from 'zod'

export const createVoiceAgentInputSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  language: z.string().min(2).max(10).default('hi'),
  voiceId: z.string().optional().nullable(),
  voiceTone: z.string().optional().nullable(),
  systemPrompt: z.string().min(1),
  phoneNumber: z.string().optional().nullable(),
  workflow: z.record(z.unknown()).optional().nullable(),
})

export type CreateVoiceAgentInput = z.infer<typeof createVoiceAgentInputSchema>

export type ListVoiceAgentsInput = {
  tenantId: string
  status?: string | null
  language?: string | null
  page: number
  limit: number
}

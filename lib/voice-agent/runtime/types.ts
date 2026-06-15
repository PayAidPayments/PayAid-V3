/**
 * Shared runtime types for the voice-agent real-time stack.
 * See docs/VOICE_AGENT_BOLNA_INTEGRATION_PLAN.md for the architecture.
 */

export type VoiceRuntime = 'native' | 'bolna'

export interface VoiceAgentRow {
  id: string
  tenantId: string
  name: string
  description?: string | null
  language: string
  voiceId?: string | null
  voiceTone?: string | null
  systemPrompt: string
  phoneNumber?: string | null
  status: string
  knowledgeBase?: unknown
  functions?: unknown
  workflow?: unknown
  compliance?: unknown
  voiceRuntime?: string | null
  bolnaAgentId?: string | null
  runtimeSyncedAt?: Date | null
  /** Optional approved pack merged into LLM system context (loaded by callers; not a DB column on row). */
  trainingPackApproved?: import('../training-pack-types').TrainingPackApprovedSnapshot | null
}

export interface BolnaSimpleLlmConfig {
  provider: string
  model: string
  temperature?: number
  max_tokens?: number
  family?: string
  /** Full system prompt aligned with HTTP demo / training pack merge. */
  system_prompt?: string
}

export interface BolnaTranscriberConfig {
  provider: 'deepgram' | 'sarvam' | 'azure'
  model?: string
  language?: string
  stream?: boolean
  endpointing?: number
  smart_format?: boolean
}

export interface BolnaSynthesizerConfig {
  provider: 'elevenlabs' | 'cartesia' | 'smallest' | 'deepgram' | 'openai' | 'polly' | 'sarvam'
  provider_config: Record<string, unknown>
  stream?: boolean
  audio_format?: 'mulaw' | 'wav' | 'pcm' | 'mp3'
  sampling_rate?: number
}

export interface BolnaToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  webhook: {
    url: string
    method: 'POST'
    headers?: Record<string, string>
  }
}

export interface BolnaTaskConfig {
  task_type: 'conversation'
  toolchain: {
    execution: 'parallel' | 'sequential'
    pipelines: string[][]
  }
  tools_config: {
    transcriber?: BolnaTranscriberConfig
    llm_agent: {
      agent_type: 'simple_llm_agent'
      agent_flow_type: 'streaming'
      llm_config: BolnaSimpleLlmConfig
    }
    synthesizer?: BolnaSynthesizerConfig
    input?: { provider: 'twilio' | 'plivo' | 'web' }
    output?: { provider: 'twilio' | 'plivo' | 'web' }
  }
  tools?: BolnaToolDefinition[]
}

export interface BolnaAgentConfig {
  agent_name: string
  agent_welcome_message: string
  agent_type: 'streaming'
  tasks: BolnaTaskConfig[]
}

export interface BolnaCallJwtClaims {
  tenantId: string
  agentId: string
  callSid: string
  /** Issued-at (seconds since epoch) */
  iat?: number
  /** Expiry (seconds since epoch). Default 1 hour after `iat`. */
  exp?: number
}

export interface StartBolnaCallArgs {
  agent: VoiceAgentRow
  /** Twilio CallSid for the live call. */
  callSid: string
  /** E.164 caller number. */
  from: string
  /** E.164 destination number (PayAid-owned for inbound, customer for outbound). */
  to: string
  /** Origin of the PayAid app, used to build the public stream URL. */
  payaidOrigin: string
}

export interface StartBolnaCallResult {
  streamUrl: string
  jwt: string
  expiresAt: Date
}

export interface SyncBolnaAgentResult {
  bolnaAgentId: string
  syncedAt: Date
}

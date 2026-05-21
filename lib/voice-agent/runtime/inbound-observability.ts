/**
 * Structured observability for inbound Twilio → Bolna cutover (Phase 1).
 */

export const VOICE_INBOUND_EVENTS = {
  RECEIVED: 'voice.inbound.received',
  AGENT_RESOLVED: 'voice.inbound.agent_resolved',
  BOLNA_ATTEMPT: 'voice.inbound.bolna.attempt',
  BOLNA_SYNC_OK: 'voice.inbound.bolna.sync_ok',
  BOLNA_SYNC_FAILED: 'voice.inbound.bolna.sync_failed',
  BOLNA_STREAM_MINTED: 'voice.inbound.bolna.stream_minted',
  BOLNA_STREAM_MINT_FAILED: 'voice.inbound.bolna.stream_mint_failed',
  BOLNA_CONNECT_STREAM: 'voice.inbound.bolna.connect_stream',
  BOLNA_FALLBACK_GATHER: 'voice.inbound.bolna.fallback_gather',
  BOLNA_STREAM_STARTED: 'voice.inbound.bolna.stream_started',
  BOLNA_STREAM_FAILED: 'voice.inbound.bolna.stream_failed',
  BOLNA_SILENT_FAILURE: 'voice.inbound.bolna.silent_failure',
  NATIVE_GATHER: 'voice.inbound.native.gather',
} as const

export type VoiceInboundEvent = (typeof VOICE_INBOUND_EVENTS)[keyof typeof VOICE_INBOUND_EVENTS]

/** Persisted on VoiceAgentCall.runtime */
export const VOICE_CALL_RUNTIME = {
  BOLNA: 'bolna',
  NATIVE: 'native',
  BOLNA_FALLBACK_GATHER: 'bolna-fallback-gather',
  BOLNA_STREAM_FAILED: 'bolna-stream-failed',
} as const

export type VoiceCallRuntime = (typeof VOICE_CALL_RUNTIME)[keyof typeof VOICE_CALL_RUNTIME]

export const BOLNA_FALLBACK_REASONS = {
  ENV_DISABLED: 'env_disabled',
  MISSING_BOLNA_HOST: 'missing_bolna_host',
  MISSING_BRIDGE_SECRET: 'missing_bridge_secret',
  MISSING_BRIDGE_BASE_URL: 'missing_bridge_base_url',
  SYNC_HTTP_ERROR: 'sync_http_error',
  MISSING_BOLNA_AGENT_ID: 'missing_bolna_agent_id',
  STREAM_URL_ERROR: 'stream_url_error',
  STREAM_CONNECT_FAILED: 'stream_connect_failed',
  SILENT_NO_CALL_STARTED: 'silent_no_call_started',
} as const

export type BolnaFallbackReason = (typeof BOLNA_FALLBACK_REASONS)[keyof typeof BOLNA_FALLBACK_REASONS]

export interface VoiceInboundLogContext {
  callSid?: string
  agentId?: string
  tenantId?: string
  runtime?: string
  reason?: BolnaFallbackReason
  detail?: string
}

export function logVoiceInbound(
  event: VoiceInboundEvent,
  ctx: VoiceInboundLogContext,
): void {
  console.log(
    JSON.stringify({
      event,
      ts: new Date().toISOString(),
      ...ctx,
    }),
  )
}

export function bolnaFallbackAuditEntry(reason: BolnaFallbackReason) {
  return { action: 'bolna_fallback', reason, at: new Date().toISOString() }
}

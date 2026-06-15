/**
 * Fallback agent config when DB is unreachable (local investor prep only).
 * Set BROWSER_LIVE_OFFLINE_REAL=1 on sidecar. Does not affect BrowserDemoV1.
 */

export type OfflineVoiceAgentConfig = {
  id: string
  tenantId: string
  name: string
  description: string | null
  language: string
  voiceTone: string | null
  voiceId: string | null
  systemPrompt: string | null
  workflow: unknown
  knowledgeBase: unknown
  functions: unknown
  compliance: unknown
}

export function getOfflineSmokeAgent(
  agentId: string,
  tenantId: string,
): OfflineVoiceAgentConfig {
  return {
    id: agentId,
    tenantId,
    name: process.env.BROWSER_LIVE_OFFLINE_AGENT_NAME || 'PayAid Voice Demo',
    description: 'Browser live voice offline-real fallback agent',
    language: process.env.BROWSER_LIVE_OFFLINE_AGENT_LANG || 'en',
    voiceTone: 'warm',
    voiceId: null,
    systemPrompt:
      process.env.BROWSER_LIVE_OFFLINE_SYSTEM_PROMPT ||
      'You are a helpful PayAid voice assistant. Keep replies concise (2-3 sentences) for spoken demo.',
    workflow: { voiceBehavior: { verbosityPreset: 'brief', pacePreset: 'normal' } },
    knowledgeBase: null,
    functions: null,
    compliance: null,
  }
}

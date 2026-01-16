/**
 * Voice Agent Module
 * Main entry point for voice agent functionality
 */

export * from './orchestrator'
export * from './stt'
export * from './tts'
export * from './llm'
export * from './knowledge-base'
export * from './vad'
export * from './tool-executor'
export * from './service-manager'
export * from './squad-router'
export * from './ab-testing'
export * from './webrtc'
export * from './telephony'
export * from './dnd-checker'
export * from './sentiment-analysis'

// Export specific functions from bhashini-tts and indicparler-tts to avoid conflicts
export { 
  synthesizeWithBhashini,
  isBhashiniConfigured,
  isLanguageSupported as isBhashiniLanguageSupported,
  getAvailableVoices as getBhashiniVoices
} from './bhashini-tts'

export {
  synthesizeWithIndicParler,
  isIndicParlerAvailable,
  isLanguageSupported as isIndicParlerLanguageSupported
} from './indicparler-tts'

export { VoiceAgentOrchestrator } from './orchestrator'
export type { ConversationTurn, VoiceAgentConfig } from './orchestrator'
export type { STTResult } from './stt'
export type { TTSOptions } from './tts'
export type { ConversationMessage } from './llm'
export type { KnowledgeBaseDocument } from './knowledge-base'
export type { BhashiniTTSOptions, BhashiniTTSResponse } from './bhashini-tts'
export type { IndicParlerTTSOptions, IndicParlerTTSResponse } from './indicparler-tts'


/**
 * Browser live voice demo — wire protocol (M1 WSS).
 * Transport-agnostic: same events can map to WebRTC data channel later.
 */

import type { VoiceBehaviorConfig, VoiceTonePreset } from '@/lib/voice-agent/voice-behavior-config'
import type { TranscriptRouting } from '@/lib/voice-agent/browser-live/transcript-routing'

export type BrowserLiveSessionPhase =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error'

export type BrowserLiveVoiceBehaviorOverride = Partial<
  Pick<VoiceBehaviorConfig, 'tonePreset' | 'pacePreset' | 'verbosityPreset'>
>

export type BrowserLivePostCallArtifacts = {
  routing: TranscriptRouting
  disposition: string
  summary: string
  sentiment?: {
    sentiment: 'positive' | 'negative' | 'neutral'
    score: number
    confidence: number
  }
  objectionTags?: string[]
  entities: {
    phones: string[]
    emails: string[]
    turnCount: number
  }
  recording?: {
    mime: string
    data: string
    truncated?: boolean
  }
  crm?: {
    contactId?: string
    interactionId?: string
    leadCreated?: boolean
    voiceLeadUnverified?: boolean
    inboxOnly?: boolean
    followUpTaskIds?: string[]
    followUpTaskTitles?: string[]
  }
}

/** Client → server */
export type BrowserLiveClientMessage =
  | {
      type: 'session.start'
      agentId: string
      tenantId: string
      callerPhone?: string
      crmWritebackEnabled?: boolean
      voiceBehavior?: BrowserLiveVoiceBehaviorOverride
    }
  | {
      type: 'session.end'
      recordingMime?: string
      recordingData?: string
    }
  | { type: 'ping' }
  | { type: 'speech.started'; at?: number }
  | { type: 'speech.stopped'; at?: number; durationMs?: number }
  | { type: 'utterance.final'; text: string; turnId: string; at?: number }
  | {
      type: 'utterance.audio'
      turnId: string
      mime: string
      data: string
      at?: number
      /** Optional hint when browser also ran Web Speech */
      clientTextHint?: string
    }
  | { type: 'interrupt'; turnId?: string; at?: number }
  | { type: 'transfer.request'; supervisorPhone?: string; at?: number }

/** Server → client */
export type BrowserLiveServerMessage =
  | {
      type: 'session.ready'
      sessionId: string
      agentId: string
      stubMode?: boolean
      offlineReal?: boolean
    }
  | {
      type: 'session.ended'
      sessionId: string
      artifacts?: BrowserLivePostCallArtifacts
    }
  | { type: 'pong' }
  | { type: 'transcript.final'; text: string; turnId: string }
  | { type: 'agent.text'; text: string; turnId: string }
  | {
      type: 'agent.audio.chunk'
      turnId: string
      seq: number
      mime: string
      data: string
      final?: boolean
    }
  | { type: 'turn.complete'; turnId: string }
  | { type: 'turn.cancelled'; turnId: string; reason: 'interrupt' | 'error' | 'superseded' }
  | {
      type: 'interrupt.ack'
      bargeInCount: number
      cancelledTurnId?: string
      at: number
    }
  | {
      type: 'transfer.initiated'
      mode: 'stub' | 'twilio'
      conferenceName: string
      supervisorPhone: string
    }
  | {
      type: 'tool.draft'
      turnId: string
      toolName: string
      draft: Record<string, unknown>
    }
  | {
      type: 'tool.executed'
      turnId: string
      toolName: string
      result: unknown
      error?: string
    }
  | { type: 'error'; message: string; code?: string }

export type BrowserLiveLatencyEvent = {
  at: number
  event:
    | 'speech_stopped'
    | 'utterance_sent'
    | 'utterance_audio_sent'
    | 'stt_complete'
    | 'transcript_final'
    | 'agent_text'
    | 'audio_first_byte'
    | 'audio_chunk'
    | 'turn_complete'
    | 'turn_cancelled'
    | 'interrupt'
    | 'interrupt_ack'
    | 'interrupt_silence'
    | 'tts_missing'
    | 'connection_lost'
    | 'connection_restored'
    | 'phase_watchdog'
  turnId?: string
  meta?: Record<string, unknown>
}

export const BROWSER_LIVE_TONE_PRESETS: { value: VoiceTonePreset; label: string }[] = [
  { value: 'calm_warm', label: 'Calm & warm' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'neutral', label: 'Neutral professional' },
]

export function parseBrowserLiveClientMessage(raw: string): BrowserLiveClientMessage | null {
  try {
    const msg = JSON.parse(raw) as BrowserLiveClientMessage
    if (!msg || typeof msg !== 'object' || !('type' in msg)) return null
    return msg
  } catch {
    return null
  }
}

export function parseBrowserLiveServerMessage(raw: string): BrowserLiveServerMessage | null {
  try {
    const msg = JSON.parse(raw) as BrowserLiveServerMessage
    if (!msg || typeof msg !== 'object' || !('type' in msg)) return null
    return msg
  } catch {
    return null
  }
}

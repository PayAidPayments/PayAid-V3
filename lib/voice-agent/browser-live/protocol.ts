/**
 * Browser live voice demo — wire protocol (M1 WSS).
 * Transport-agnostic: same events can map to WebRTC data channel later.
 */

export type BrowserLiveSessionPhase =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error'

/** Client → server */
export type BrowserLiveClientMessage =
  | { type: 'session.start'; agentId: string; tenantId: string }
  | { type: 'session.end' }
  | { type: 'ping' }
  | { type: 'speech.started'; at?: number }
  | { type: 'speech.stopped'; at?: number; durationMs?: number }
  | { type: 'utterance.final'; text: string; turnId: string; at?: number }
  | { type: 'interrupt'; turnId?: string; at?: number }

/** Server → client */
export type BrowserLiveServerMessage =
  | { type: 'session.ready'; sessionId: string; agentId: string; stubMode?: boolean }
  | { type: 'pong' }
  | { type: 'transcript.final'; text: string; turnId: string }
  | { type: 'agent.text'; text: string; turnId: string }
  | { type: 'agent.audio.chunk'; turnId: string; seq: number; mime: string; data: string }
  | { type: 'turn.complete'; turnId: string }
  | { type: 'turn.cancelled'; turnId: string; reason: 'interrupt' | 'error' | 'superseded' }
  | { type: 'error'; message: string; code?: string }

export type BrowserLiveLatencyEvent = {
  at: number
  event:
    | 'speech_stopped'
    | 'utterance_sent'
    | 'transcript_final'
    | 'agent_text'
    | 'audio_first_byte'
    | 'turn_complete'
    | 'interrupt'
    | 'interrupt_silence'
  turnId?: string
  meta?: Record<string, unknown>
}

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

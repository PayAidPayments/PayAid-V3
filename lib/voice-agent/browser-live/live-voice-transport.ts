/**
 * Transport abstraction for browser live voice — WSS today, WebRTC later.
 */

import type { BrowserLiveClientMessage, BrowserLiveServerMessage } from './protocol'

export type LiveVoiceTransportHandlers = {
  onOpen?: () => void
  onClose?: (code?: number, reason?: string) => void
  onError?: (message: string) => void
  onMessage?: (msg: BrowserLiveServerMessage) => void
}

export interface LiveVoiceTransport {
  connect(): Promise<void>
  disconnect(): void
  send(msg: BrowserLiveClientMessage): void
  isConnected(): boolean
}

export function resolveLiveWsUrl(): string {
  if (typeof window === 'undefined') return ''
  const fromEnv = process.env.NEXT_PUBLIC_VOICE_LIVE_WS_URL?.trim()
  if (fromEnv) return fromEnv
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.hostname
  const port = process.env.NEXT_PUBLIC_VOICE_LIVE_WS_PORT || '3002'
  return `${proto}//${host}:${port}`
}

/**
 * WSS transport for browser live voice (M1).
 */

import {
  parseBrowserLiveServerMessage,
  type BrowserLiveClientMessage,
  type BrowserLiveServerMessage,
} from './protocol'
import type { LiveVoiceTransport, LiveVoiceTransportHandlers } from './live-voice-transport'

export type WssLiveVoiceTransportOptions = {
  wsUrl: string
  token: string
  handlers: LiveVoiceTransportHandlers
}

export class WssLiveVoiceTransport implements LiveVoiceTransport {
  private ws: WebSocket | null = null
  private handlers: LiveVoiceTransportHandlers

  constructor(private options: WssLiveVoiceTransportOptions) {
    this.handlers = options.handlers
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  connect(): Promise<void> {
    const { wsUrl, token } = this.options
    const url = new URL(wsUrl)
    url.searchParams.set('token', token)
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url.toString())
      } catch (e) {
        reject(e)
        return
      }
      this.ws.onopen = () => {
        this.handlers.onOpen?.()
        resolve()
      }
      this.ws.onerror = () => {
        this.handlers.onError?.('WebSocket connection failed')
        reject(new Error('WebSocket connection failed'))
      }
      this.ws.onclose = (ev) => {
        this.handlers.onClose?.(ev.code, ev.reason)
      }
      this.ws.onmessage = (ev) => {
        if (typeof ev.data !== 'string') return
        const msg = parseBrowserLiveServerMessage(ev.data)
        if (msg) this.handlers.onMessage?.(msg)
      }
    })
  }

  disconnect() {
    try {
      this.ws?.close()
    } catch {
      /* ignore */
    }
    this.ws = null
  }

  send(msg: BrowserLiveClientMessage) {
    if (!this.isConnected()) return
    this.ws!.send(JSON.stringify(msg))
  }
}

export type { BrowserLiveServerMessage }

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

  /** One automatic reconnect on abnormal close while live. */

  reconnectOnce?: boolean

}



export class WssLiveVoiceTransport implements LiveVoiceTransport {

  private ws: WebSocket | null = null

  private handlers: LiveVoiceTransportHandlers

  private reconnectUsed = false

  private intentionalClose = false



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

    this.intentionalClose = false

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

        const code = ev.code

        this.handlers.onClose?.(code, ev.reason)

        if (

          this.options.reconnectOnce &&

          !this.reconnectUsed &&

          !this.intentionalClose &&

          code !== 1000

        ) {

          this.reconnectUsed = true

          void this.connect().catch(() => {

            this.handlers.onError?.('Could not reconnect to live voice sidecar')

          })

        }

      }

      this.ws.onmessage = (ev) => {

        if (typeof ev.data !== 'string') return

        const msg = parseBrowserLiveServerMessage(ev.data)

        if (msg) this.handlers.onMessage?.(msg)

      }

    })

  }



  disconnect() {

    this.intentionalClose = true

    try {

      this.ws?.close(1000, 'client end')

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



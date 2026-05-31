'use client'

/**
 * Latency evidence buffer — export for investor / QA runs.
 */

import type { BrowserLiveLatencyEvent } from '@/lib/voice-agent/browser-live/protocol'

const MAX_EVENTS = 200

export class LiveLatencyRecorder {
  private events: BrowserLiveLatencyEvent[] = []

  record(event: BrowserLiveLatencyEvent['event'], turnId?: string, meta?: Record<string, unknown>) {
    this.events.push({ at: Date.now(), event, turnId, meta })
    if (this.events.length > MAX_EVENTS) {
      this.events.shift()
    }
  }

  snapshot() {
    return { recordedAt: new Date().toISOString(), events: [...this.events] }
  }

  clear() {
    this.events = []
  }

  downloadJson(filename = 'browser-live-latency.json') {
    const blob = new Blob([JSON.stringify(this.snapshot(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}

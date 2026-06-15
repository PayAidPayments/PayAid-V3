'use client'

/**
 * Latency evidence buffer — export for investor / QA runs.
 */

import type { BrowserLiveLatencyEvent } from '@/lib/voice-agent/browser-live/protocol'
import {
  buildLatencyEvidenceReport,
  type LatencyEvidenceReport,
} from '@/lib/voice-agent/browser-live/latency-evidence'

const MAX_EVENTS = 400

export type BrowserLiveLatencySummary = LatencyEvidenceReport

export class LiveLatencyRecorder {
  private events: BrowserLiveLatencyEvent[] = []
  private mode: LatencyEvidenceReport['mode'] = 'unknown'

  setMode(mode: LatencyEvidenceReport['mode']) {
    this.mode = mode
  }

  record(event: BrowserLiveLatencyEvent['event'], turnId?: string, meta?: Record<string, unknown>) {
    this.events.push({ at: Date.now(), event, turnId, meta })
    if (this.events.length > MAX_EVENTS) {
      this.events.shift()
    }
  }

  snapshot(): BrowserLiveLatencySummary {
    return buildLatencyEvidenceReport(this.events, { mode: this.mode })
  }

  summary() {
    const s = this.snapshot()
    return {
      bargeInCount: s.bargeInCount,
      turnCount: s.sampleTurns,
      medianSpeechToFirstAudioMs: s.speechToFirstAudioMs.p50,
      medianInterruptSilenceMs: s.interruptSilenceMs.p50,
      p95SpeechToFirstAudioMs: s.speechToFirstAudioMs.p95,
      p95InterruptSilenceMs: s.interruptSilenceMs.p95,
      passes: s.passes,
    }
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

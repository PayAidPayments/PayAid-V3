import { describe, expect, it } from 'vitest'
import { buildLatencyEvidenceReport, percentile } from '@/lib/voice-agent/browser-live/latency-evidence'
import { shouldTriggerBargeIn } from '@/lib/voice-agent/browser-live/interrupt-policy'

describe('browser-live latency evidence', () => {
  it('computes p50/p95 speech-to-audio', () => {
    expect(percentile([100, 200, 300, 400, 500], 50)).toBe(300)
    expect(percentile([100, 200, 300, 400, 500], 95)).toBe(500)
  })

  it('builds report with turn completion rate', () => {
    const events = [
      { at: 1000, event: 'speech_stopped' as const, turnId: 't1' },
      { at: 1500, event: 'audio_first_byte' as const, turnId: 't1' },
      { at: 3000, event: 'turn_complete' as const, turnId: 't1' },
      { at: 4000, event: 'interrupt' as const, turnId: 't2' },
      { at: 4100, event: 'turn_cancelled' as const, turnId: 't2' },
      { at: 5000, event: 'speech_stopped' as const, turnId: 't3' },
      { at: 7000, event: 'turn_complete' as const, turnId: 't3' },
    ]
    const report = buildLatencyEvidenceReport(events, { mode: 'real' })
    expect(report.speechToFirstAudioMs.p50).toBe(500)
    expect(report.sampleTurns).toBe(2)
    expect(report.turnCompletionRate).toBe(1)
    expect(report.bargeInCount).toBeGreaterThanOrEqual(1)
  })
})

describe('interrupt policy', () => {
  it('suppresses filler backchannels', () => {
    expect(shouldTriggerBargeIn('um')).toBe(false)
    expect(shouldTriggerBargeIn('wait stop')).toBe(true)
  })
})

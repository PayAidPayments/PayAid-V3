import { describe, it, expect } from '@jest/globals'
import {
  appendBolnaTranscript,
  computeFirstAudioPercentiles,
  pickFirstAudioMs,
  pickTtsLatencyMs,
} from '@/lib/voice-agent/runtime/bolna-events'

describe('appendBolnaTranscript', () => {
  it('appends user and assistant turns', () => {
    const a = appendBolnaTranscript(null, { role: 'user', content: 'Hello' })
    const b = appendBolnaTranscript(a, { role: 'assistant', content: 'Hi there' })
    const parsed = JSON.parse(b) as Array<{ role: string; content: string }>
    expect(parsed).toHaveLength(2)
    expect(parsed[0].role).toBe('user')
    expect(parsed[1].content).toBe('Hi there')
  })
})

describe('latency helpers', () => {
  it('pickFirstAudioMs prefers first_audio_ms', () => {
    expect(pickFirstAudioMs({ first_audio_ms: 500, tts_first_chunk_ms: 700 })).toBe(500)
  })

  it('pickTtsLatencyMs uses chunk timing', () => {
    expect(pickTtsLatencyMs({ tts_first_chunk_ms: 640 })).toBe(640)
  })

  it('computes percentiles', () => {
    const stats = computeFirstAudioPercentiles([
      { firstAudioMs: 500, runtime: 'bolna' },
      { firstAudioMs: 1500, runtime: 'bolna' },
    ])
    expect(stats.samples).toBe(2)
    expect(stats.p50Bolna).toBe(1500)
  })
})

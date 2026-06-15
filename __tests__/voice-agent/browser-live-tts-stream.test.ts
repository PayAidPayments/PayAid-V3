import { describe, expect, it } from 'vitest'
import { splitTextForStreamingTts } from '@/lib/voice-agent/browser-live/tts-stream'

describe('splitTextForStreamingTts', () => {
  it('splits on sentence boundaries', () => {
    const chunks = splitTextForStreamingTts('Hello there. How can I help? Great.')
    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks.join(' ')).toContain('Hello')
    expect(chunks.join(' ')).toContain('help')
  })

  it('returns single chunk for short text', () => {
    const chunks = splitTextForStreamingTts('Hi!')
    expect(chunks).toEqual(['Hi!'])
  })

  it('handles empty input', () => {
    expect(splitTextForStreamingTts('')).toEqual([])
  })
})

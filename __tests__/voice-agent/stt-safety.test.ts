import { assessSttSafety } from '@/lib/voice-agent/browser-live/stt-safety'

describe('assessSttSafety', () => {
  it('rejects empty transcript', () => {
    const r = assessSttSafety('')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('empty')
  })

  it('accepts normal utterance', () => {
    const r = assessSttSafety('Hello, I need help with my invoice please.', 12000)
    expect(r.ok).toBe(true)
    expect(r.confidence).toBeGreaterThan(0.4)
  })

  it('rejects filler-only transcript', () => {
    const r = assessSttSafety('um', 500)
    expect(r.ok).toBe(false)
  })
})

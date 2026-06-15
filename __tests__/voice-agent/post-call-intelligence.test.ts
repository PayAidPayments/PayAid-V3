import {
  analyzeTranscriptSentiment,
  extractObjectionTags,
} from '@/lib/voice-agent/browser-live/post-call-intelligence'

const transcript = [
  { role: 'user' as const, content: 'Thanks, this is great and very helpful!', timestamp: 't1' },
  { role: 'assistant' as const, content: 'Glad to help.', timestamp: 't2' },
]

const objectionTranscript = [
  { role: 'user' as const, content: 'Too expensive. Talk to my manager please.', timestamp: 't1' },
]

describe('post-call intelligence', () => {
  it('detects positive sentiment from user turns', () => {
    const s = analyzeTranscriptSentiment(transcript)
    expect(s.sentiment).toBe('positive')
    expect(s.score).toBeGreaterThan(0)
  })

  it('extracts objection tags', () => {
    const tags = extractObjectionTags(objectionTranscript)
    expect(tags).toContain('price_objection')
    expect(tags).toContain('escalation_request')
  })

  it('returns neutral sentiment for empty transcript', () => {
    const s = analyzeTranscriptSentiment([])
    expect(s.sentiment).toBe('neutral')
    expect(s.confidence).toBe(0)
  })
})

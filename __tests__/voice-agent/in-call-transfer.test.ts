import { userRequestsEscalation } from '@/lib/voice-agent/in-call-transfer'

describe('userRequestsEscalation', () => {
  it('detects manager handoff phrases', () => {
    expect(userRequestsEscalation('Too expensive. Talk to my manager please.')).toBe(true)
  })

  it('ignores neutral utterances', () => {
    expect(userRequestsEscalation('Thanks, that helps.')).toBe(false)
  })
})

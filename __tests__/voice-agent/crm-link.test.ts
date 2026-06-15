import { markLastAssistantTurnInterrupted } from '@/lib/voice-agent/demo-transcript'

describe('voice CRM link helpers', () => {
  it('markLastAssistantTurnInterrupted flags only the latest assistant turn', () => {
    const turns = markLastAssistantTurnInterrupted([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'first reply' },
      { role: 'user', content: 'wait' },
      { role: 'assistant', content: 'second reply' },
    ])
    expect(turns[1].interruptedFlag).toBeUndefined()
    expect(turns[3].interruptedFlag).toBe(true)
  })

  it('markLastAssistantTurnInterrupted is a no-op without assistant turns', () => {
    const turns = markLastAssistantTurnInterrupted([{ role: 'user', content: 'only user' }])
    expect(turns[0].interruptedFlag).toBeUndefined()
  })
})

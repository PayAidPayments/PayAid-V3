import { describe, it, expect } from '@jest/globals'
import { resolveGreeting } from '@/lib/voice-agent/runtime/bolna'
import type { VoiceAgentRow } from '@/lib/voice-agent/runtime/types'

const base: VoiceAgentRow = {
  id: 'a1',
  tenantId: 't1',
  name: 'PayAid Demo',
  language: 'en',
  systemPrompt: 'You are helpful.',
  status: 'active',
}

describe('resolveGreeting', () => {
  it('prefers workflow.greeting', () => {
    const text = resolveGreeting({
      ...base,
      workflow: { greeting: 'Welcome from workflow' },
      description: 'Other',
    })
    expect(text).toBe('Welcome from workflow')
  })

  it('uses greeting node when workflow.greeting missing', () => {
    const text = resolveGreeting({
      ...base,
      workflow: {
        nodes: [{ type: 'greeting', data: { text: 'Node hello' } }],
      },
    })
    expect(text).toBe('Node hello')
  })

  it('prepends compliance introText once', () => {
    const text = resolveGreeting({
      ...base,
      compliance: { introText: 'This call may be recorded.' },
      workflow: { greeting: 'Hi there' },
    })
    expect(text).toBe('This call may be recorded. Hi there')
  })
})

import { prependOutboundDisclosure } from '@/lib/voice-agent/runtime-compliance'

describe('runtime compliance helpers', () => {
  it('prepends outbound disclosure when missing from greeting', () => {
    const out = prependOutboundDisclosure(
      'Hello, how can I help?',
      'This call may be recorded for quality purposes.',
    )
    expect(out).toContain('recorded')
    expect(out).toContain('Hello')
  })

  it('does not duplicate disclosure already in greeting', () => {
    const greeting = 'This call may be recorded. Welcome to PayAid.'
    const out = prependOutboundDisclosure(greeting, 'This call may be recorded for quality.')
    expect(out).toBe(greeting)
  })
})

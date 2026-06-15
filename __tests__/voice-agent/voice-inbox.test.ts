import { isVoiceInboxSession } from '@/lib/voice-agent/voice-inbox'

describe('voice inbox routing', () => {
  it('includes no_crm_inbox sessions', () => {
    expect(
      isVoiceInboxSession({
        postCall: { routing: 'no_crm_inbox', disposition: 'spoken_demo_inbox' },
      }),
    ).toBe(true)
  })

  it('includes inboxOnly CRM flag', () => {
    expect(
      isVoiceInboxSession({
        postCall: { routing: 'matched_contact', crm: { inboxOnly: true } },
      }),
    ).toBe(true)
  })

  it('excludes unmatched_lead with CRM writeback', () => {
    expect(
      isVoiceInboxSession({
        postCall: { routing: 'unmatched_lead', crm: { leadCreated: true } },
      }),
    ).toBe(false)
  })

  it('excludes sessions without postCall', () => {
    expect(isVoiceInboxSession({})).toBe(false)
  })
})

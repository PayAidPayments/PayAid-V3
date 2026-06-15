import {
  decideTranscriptRouting,
  normalizePhone,
} from '@/lib/voice-agent/browser-live/transcript-routing'

describe('transcript routing', () => {
  it('routes to no_crm_inbox when CRM writeback disabled', () => {
    expect(
      decideTranscriptRouting({
        crmWritebackEnabled: false,
        callerPhone: '9876543210',
        matchedContactId: 'c1',
      }),
    ).toBe('no_crm_inbox')
  })

  it('routes to no_crm_inbox without a valid phone', () => {
    expect(
      decideTranscriptRouting({
        crmWritebackEnabled: true,
        callerPhone: '123',
        matchedContactId: null,
      }),
    ).toBe('no_crm_inbox')
  })

  it('routes to matched_contact when phone matches CRM contact', () => {
    expect(
      decideTranscriptRouting({
        crmWritebackEnabled: true,
        callerPhone: '+91 98765 43210',
        matchedContactId: 'contact-abc',
      }),
    ).toBe('matched_contact')
  })

  it('routes to unmatched_lead for unknown phone with writeback enabled', () => {
    expect(
      decideTranscriptRouting({
        crmWritebackEnabled: true,
        callerPhone: '9876543210',
        matchedContactId: null,
      }),
    ).toBe('unmatched_lead')
  })

  it('normalizes phone to last 10 digits', () => {
    expect(normalizePhone('+91-98765-43210')).toBe('9876543210')
    expect(normalizePhone('')).toBe('')
  })
})

import {
  VOICE_LEAD_UNVERIFIED_SOURCE,
  VOICE_LEAD_UNVERIFIED_TAG,
  buildVoiceLeadUnverifiedContactData,
  isVoiceLeadUnverified,
} from '@/lib/voice-agent/crm-voice-lead'
import { nameHintFromTranscript } from '@/lib/voice-agent/crm-writeback'

describe('Voice Lead (Unverified)', () => {
  it('builds contact data with blueprint sourceData fields', () => {
    const data = buildVoiceLeadUnverifiedContactData({
      tenantId: 'tenant_1',
      phone: '9876543210',
      displayPhone: '+91 98765 43210',
      agentId: 'agent_1',
      sessionId: 'sess_1',
      channel: 'browser_live',
      disposition: 'spoken_demo_new_lead',
      summary: 'Caller asked about pricing.',
    })

    expect(data.source).toBe(VOICE_LEAD_UNVERIFIED_SOURCE)
    expect(data.sourceId).toBeNull()
    expect(data.tags).toContain(VOICE_LEAD_UNVERIFIED_TAG)
    expect(data.stage).toBe('prospect')
    expect(data.sourceData).toMatchObject({
      voiceLeadType: 'unverified',
      verificationStatus: 'pending',
      matchConfidence: 0,
      channel: 'browser_live',
      agentId: 'agent_1',
      sessionId: 'sess_1',
    })
  })

  it('detects unverified voice leads', () => {
    expect(
      isVoiceLeadUnverified({
        source: VOICE_LEAD_UNVERIFIED_SOURCE,
        tags: [VOICE_LEAD_UNVERIFIED_TAG],
        sourceData: { voiceLeadType: 'unverified' },
      }),
    ).toBe(true)
    expect(isVoiceLeadUnverified({ source: 'website', tags: [] })).toBe(false)
  })

  it('extracts name hints from transcript intros', () => {
    expect(
      nameHintFromTranscript([
        { role: 'user', content: 'Hi, my name is Priya Sharma and I need help.' },
      ]),
    ).toBe('Priya Sharma')
    expect(nameHintFromTranscript([{ role: 'user', content: 'Hello there' }])).toBeNull()
  })
})

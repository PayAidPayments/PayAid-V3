import {
  DEFAULT_VOICE_COMPLIANCE_POLICY,
  voiceCompliancePolicySchema,
} from '@/lib/voice-agent/consent-policy'

describe('voice consent policy', () => {
  it('validates policy shape', () => {
    const parsed = voiceCompliancePolicySchema.parse(DEFAULT_VOICE_COMPLIANCE_POLICY)
    expect(parsed.retentionDays).toBe(90)
    expect(parsed.consentMode).toBe('explicit_toggle')
  })

  it('rejects invalid retention', () => {
    expect(() =>
      voiceCompliancePolicySchema.parse({ ...DEFAULT_VOICE_COMPLIANCE_POLICY, retentionDays: 0 }),
    ).toThrow()
  })
})

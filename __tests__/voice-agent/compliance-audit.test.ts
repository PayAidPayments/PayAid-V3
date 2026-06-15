import {
  computeRetentionUntil,
  redactPhoneNumbers,
  redactVoiceText,
  voiceRecordingRetentionDays,
} from '@/lib/voice-agent/compliance-audit'

describe('voice compliance audit', () => {
  const orig = process.env.VOICE_RECORDING_RETENTION_DAYS

  afterEach(() => {
    if (orig === undefined) delete process.env.VOICE_RECORDING_RETENTION_DAYS
    else process.env.VOICE_RECORDING_RETENTION_DAYS = orig
  })

  it('defaults retention to 90 days', () => {
    delete process.env.VOICE_RECORDING_RETENTION_DAYS
    expect(voiceRecordingRetentionDays()).toBe(90)
  })

  it('honours VOICE_RECORDING_RETENTION_DAYS env', () => {
    process.env.VOICE_RECORDING_RETENTION_DAYS = '30'
    expect(voiceRecordingRetentionDays()).toBe(30)
  })

  it('computes retentionUntil from anchor date', () => {
    process.env.VOICE_RECORDING_RETENTION_DAYS = '7'
    const anchor = new Date('2026-06-01T12:00:00.000Z')
    expect(computeRetentionUntil(anchor)).toBe('2026-06-08T12:00:00.000Z')
  })

  it('redacts phone numbers in text', () => {
    expect(redactPhoneNumbers('Call +919876543210 soon')).toContain('[REDACTED_PHONE]')
    expect(redactPhoneNumbers('Call +919876543210 soon')).not.toContain('9876543210')
  })

  it('redacts phones and emails together', () => {
    const out = redactVoiceText('user@test.com dial 9876543210')
    expect(out).toContain('[REDACTED_EMAIL]')
    expect(out).toContain('[REDACTED_PHONE]')
  })
})

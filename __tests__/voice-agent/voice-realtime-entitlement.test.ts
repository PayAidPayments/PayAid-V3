import {
  VOICE_LEGACY_LICENSE_MODULE,
  VOICE_REALTIME_CAPABILITY_ID,
  hasVoiceRealtimeEntitlement,
} from '@/lib/voice-agent/entitlements'

describe('voice-realtime entitlement', () => {
  it('grants access with voice-realtime capability only', () => {
    expect(hasVoiceRealtimeEntitlement([VOICE_REALTIME_CAPABILITY_ID])).toBe(true)
  })

  it('grants access with ai-studio legacy bundle', () => {
    expect(hasVoiceRealtimeEntitlement([VOICE_LEGACY_LICENSE_MODULE])).toBe(true)
  })

  it('denies access when licensed modules exclude voice', () => {
    expect(hasVoiceRealtimeEntitlement(['crm', 'finance'])).toBe(false)
  })

  it('allows empty license list (free-tier bootstrap parity)', () => {
    expect(hasVoiceRealtimeEntitlement([])).toBe(true)
  })
})

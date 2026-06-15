import {
  hasVoiceCapability,
  VOICE_PERMISSION_CONFIGURE,
  VOICE_PERMISSION_LISTEN,
  VOICE_PERMISSION_OPERATE,
} from '@/lib/voice-agent/rbac'

describe('voice RBAC capabilities', () => {
  it('configure grants all capabilities', () => {
    const auth = { roles: [], permissions: [VOICE_PERMISSION_CONFIGURE] }
    expect(hasVoiceCapability(auth, 'configure')).toBe(true)
    expect(hasVoiceCapability(auth, 'operate')).toBe(true)
    expect(hasVoiceCapability(auth, 'listen')).toBe(true)
  })

  it('operate grants operate and listen only', () => {
    const auth = { roles: [], permissions: [VOICE_PERMISSION_OPERATE] }
    expect(hasVoiceCapability(auth, 'configure')).toBe(false)
    expect(hasVoiceCapability(auth, 'operate')).toBe(true)
    expect(hasVoiceCapability(auth, 'listen')).toBe(true)
  })

  it('listen grants listen only', () => {
    const auth = { roles: [], permissions: [VOICE_PERMISSION_LISTEN] }
    expect(hasVoiceCapability(auth, 'configure')).toBe(false)
    expect(hasVoiceCapability(auth, 'operate')).toBe(false)
    expect(hasVoiceCapability(auth, 'listen')).toBe(true)
  })

  it('owner role defaults to configure via role map', () => {
    expect(hasVoiceCapability({ roles: ['owner'], permissions: [] }, 'configure')).toBe(true)
    expect(hasVoiceCapability({ roles: ['owner'], permissions: [] }, 'operate')).toBe(true)
  })

  it('viewer role defaults to listen only', () => {
    expect(hasVoiceCapability({ roles: ['VIEWER'], permissions: [] }, 'listen')).toBe(true)
    expect(hasVoiceCapability({ roles: ['VIEWER'], permissions: [] }, 'operate')).toBe(false)
  })

  it('manager role defaults to operate', () => {
    expect(hasVoiceCapability({ roles: ['MANAGER'], permissions: [] }, 'operate')).toBe(true)
    expect(hasVoiceCapability({ roles: ['MANAGER'], permissions: [] }, 'configure')).toBe(false)
  })
})

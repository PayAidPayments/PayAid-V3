import { describe, it, expect } from '@jest/globals'
import { canApproveVoiceAgentTraining, parseTrainingPackDraft } from '@/lib/voice-agent/training-pack-validate'

describe('parseTrainingPackDraft', () => {
  it('normalizes a minimal draft and strips unknown fields', () => {
    const raw = {
      notes: '  hello  ',
      objections: [{ trigger: 'x', response: 'y' }],
      extra: 'ignored',
    }
    const out = parseTrainingPackDraft(raw)
    expect(out.notes).toBe('hello')
    expect(out.objections?.[0]).toEqual({ trigger: 'x', response: 'y' })
    expect('extra' in (out as object)).toBe(false)
  })

  it('returns empty object for non-object input', () => {
    expect(parseTrainingPackDraft(null)).toEqual({})
    expect(parseTrainingPackDraft(undefined)).toEqual({})
  })
})

describe('canApproveVoiceAgentTraining', () => {
  it('allows owner/admin style roles', () => {
    expect(canApproveVoiceAgentTraining(['owner'])).toBe(true)
    expect(canApproveVoiceAgentTraining(['Admin'])).toBe(true)
    expect(canApproveVoiceAgentTraining(['tenant_admin', 'agent'])).toBe(true)
  })

  it('rejects plain agent roles', () => {
    expect(canApproveVoiceAgentTraining(['agent'])).toBe(false)
    expect(canApproveVoiceAgentTraining([])).toBe(false)
  })
})

import {
  VOICE_AGENT_TEMPLATES,
  getVoiceAgentTemplate,
  getVoiceAgentTemplateByPurpose,
} from '@/lib/voice-agent/agent-templates'

describe('VOICE_AGENT_TEMPLATES', () => {
  it('includes all five blueprint templates', () => {
    const ids = VOICE_AGENT_TEMPLATES.map((t) => t.id)
    expect(ids).toEqual([
      'inbound_support',
      'sales_qualification',
      'appointment_booking',
      'payment_reminder',
      'collections',
    ])
  })

  it('resolves sales qualification template', () => {
    const t = getVoiceAgentTemplate('sales_qualification')
    expect(t?.purpose).toBe('sales')
    expect(t?.greeting.length).toBeGreaterThan(10)
    expect(t?.voiceBehavior.tonePreset).toBeDefined()
  })

  it('maps purpose to a template', () => {
    expect(getVoiceAgentTemplateByPurpose('support')?.id).toBe('inbound_support')
  })
})

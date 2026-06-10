import {
  DEFAULT_VOICE_BEHAVIOR,
  maxTokensForVerbosity,
  parseVoiceBehaviorFromWorkflow,
  sarvamSpeedForPace,
  suggestVoiceBehaviorForPurpose,
  voiceBehaviorPromptBlock,
} from '@/lib/voice-agent/voice-behavior-config'

describe('voice-behavior-config', () => {
  it('parses workflow.voiceBehavior', () => {
    const cfg = parseVoiceBehaviorFromWorkflow({
      voiceBehavior: {
        version: 1,
        tonePreset: 'empathetic',
        pacePreset: 'slow',
        verbosityPreset: 'brief',
      },
    })
    expect(cfg.tonePreset).toBe('empathetic')
    expect(cfg.pacePreset).toBe('slow')
    expect(cfg.verbosityPreset).toBe('brief')
    expect(cfg.bargeInEnabled).toBe(false)
  })

  it('falls back to defaults for invalid values', () => {
    const cfg = parseVoiceBehaviorFromWorkflow({
      voiceBehavior: { tonePreset: 'invalid', pacePreset: 'fast', verbosityPreset: 'nope' },
    })
    expect(cfg.tonePreset).toBe(DEFAULT_VOICE_BEHAVIOR.tonePreset)
    expect(cfg.pacePreset).toBe('fast')
    expect(cfg.verbosityPreset).toBe(DEFAULT_VOICE_BEHAVIOR.verbosityPreset)
  })

  it('builds prompt block with tone guidance', () => {
    const block = voiceBehaviorPromptBlock({
      ...DEFAULT_VOICE_BEHAVIOR,
      tonePreset: 'calm_warm',
    })
    expect(block).toContain('calm, warm')
    expect(block).toContain('Verbosity')
  })

  it('maps verbosity to max tokens', () => {
    expect(maxTokensForVerbosity('brief')).toBe(256)
    expect(maxTokensForVerbosity('balanced')).toBe(512)
    expect(maxTokensForVerbosity('detailed')).toBe(768)
  })

  it('maps pace to sarvam speed', () => {
    expect(sarvamSpeedForPace('slow')).toBe(0.85)
    expect(sarvamSpeedForPace('normal')).toBe(1.0)
    expect(sarvamSpeedForPace('fast')).toBe(1.15)
  })

  it('suggests purpose defaults', () => {
    expect(suggestVoiceBehaviorForPurpose('support').tonePreset).toBe('calm_warm')
    expect(suggestVoiceBehaviorForPurpose('collections').tonePreset).toBe('authoritative')
    expect(suggestVoiceBehaviorForPurpose('collections').verbosityPreset).toBe('brief')
  })
})

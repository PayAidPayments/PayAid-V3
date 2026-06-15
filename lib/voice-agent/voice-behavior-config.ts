/**
 * Voice behavior presets — stored on `VoiceAgent.workflow.voiceBehavior`.
 * Consumed by buildMergedSystemContext, browser demo turns, and Bolna agent build.
 * Barge-in remains internal and is not applied to Bolna until explicitly validated.
 */

export const VOICE_BEHAVIOR_SCHEMA_VERSION = 1 as const

/** Client-facing tone presets (browser demo + Studio). */
export type VoiceTonePreset = 'calm_warm' | 'authoritative' | 'empathetic' | 'neutral'

export type VoicePacePreset = 'slow' | 'normal' | 'fast'

export type VoiceVerbosityPreset = 'brief' | 'balanced' | 'detailed'

export type VoiceBehaviorConfig = {
  version: typeof VOICE_BEHAVIOR_SCHEMA_VERSION
  tonePreset: VoiceTonePreset
  pacePreset: VoicePacePreset
  verbosityPreset: VoiceVerbosityPreset
  /**
   * Internal only — do not expose in client UI until live telephony validates barge-in.
   * Default false when omitted.
   */
  bargeInEnabled?: boolean
}

export const DEFAULT_VOICE_BEHAVIOR: VoiceBehaviorConfig = {
  version: VOICE_BEHAVIOR_SCHEMA_VERSION,
  tonePreset: 'neutral',
  pacePreset: 'normal',
  verbosityPreset: 'balanced',
  bargeInEnabled: false,
}

export const VOICE_TONE_PRESETS: {
  value: VoiceTonePreset
  label: string
  clientDescription: string
  recommendedFor: string
}[] = [
  {
    value: 'calm_warm',
    label: 'Calm & warm',
    clientDescription: 'Patient, reassuring delivery — good for support and reminders.',
    recommendedFor: 'Support, billing reminders, general customer care',
  },
  {
    value: 'authoritative',
    label: 'Authoritative',
    clientDescription: 'Clear, confident delivery — good for operations and compliance.',
    recommendedFor: 'Operations, collections follow-up, policy confirmations',
  },
  {
    value: 'empathetic',
    label: 'Empathetic',
    clientDescription: 'Gentle, validating delivery — good for sensitive topics.',
    recommendedFor: 'Escalations, hardship, health/finance sensitivity',
  },
  {
    value: 'neutral',
    label: 'Neutral professional',
    clientDescription: 'Balanced business tone — default when unsure.',
    recommendedFor: 'Surveys, generic outbound, mixed intents',
  },
]

export const VOICE_PACE_PRESETS: { value: VoicePacePreset; label: string; hint: string }[] = [
  { value: 'slow', label: 'Slower', hint: 'More pauses; easier to follow on mobile.' },
  { value: 'normal', label: 'Normal', hint: 'Default conversational pace.' },
  { value: 'fast', label: 'Faster', hint: 'Snappier replies; keep scripts short.' },
]

export const VOICE_VERBOSITY_PRESETS: { value: VoiceVerbosityPreset; label: string; hint: string }[] = [
  { value: 'brief', label: 'Brief', hint: 'One idea per turn; minimal filler.' },
  { value: 'balanced', label: 'Balanced', hint: 'Short answers with one clarifying question when needed.' },
  { value: 'detailed', label: 'Detailed', hint: 'More context per turn; use sparingly on phone.' },
]

const TONE_SET = new Set<VoiceTonePreset>(VOICE_TONE_PRESETS.map((p) => p.value))
const PACE_SET = new Set<VoicePacePreset>(VOICE_PACE_PRESETS.map((p) => p.value))
const VERBOSITY_SET = new Set<VoiceVerbosityPreset>(VOICE_VERBOSITY_PRESETS.map((p) => p.value))

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Parse `workflow.voiceBehavior` from API; never throws. */
export function mergeVoiceBehaviorOverride(
  base: VoiceBehaviorConfig,
  override?: Partial<Pick<VoiceBehaviorConfig, 'tonePreset' | 'pacePreset' | 'verbosityPreset'>> | null,
): VoiceBehaviorConfig {
  if (!override) return base
  return {
    ...base,
    tonePreset: TONE_SET.has(override.tonePreset as VoiceTonePreset)
      ? (override.tonePreset as VoiceTonePreset)
      : base.tonePreset,
    pacePreset: PACE_SET.has(override.pacePreset as VoicePacePreset)
      ? (override.pacePreset as VoicePacePreset)
      : base.pacePreset,
    verbosityPreset: VERBOSITY_SET.has(override.verbosityPreset as VoiceVerbosityPreset)
      ? (override.verbosityPreset as VoiceVerbosityPreset)
      : base.verbosityPreset,
  }
}

export function parseVoiceBehaviorFromWorkflow(workflow: unknown): VoiceBehaviorConfig {
  if (!isRecord(workflow)) return { ...DEFAULT_VOICE_BEHAVIOR }
  const raw = workflow.voiceBehavior
  if (!isRecord(raw)) return { ...DEFAULT_VOICE_BEHAVIOR }

  const tonePreset = TONE_SET.has(raw.tonePreset as VoiceTonePreset)
    ? (raw.tonePreset as VoiceTonePreset)
    : DEFAULT_VOICE_BEHAVIOR.tonePreset
  const pacePreset = PACE_SET.has(raw.pacePreset as VoicePacePreset)
    ? (raw.pacePreset as VoicePacePreset)
    : DEFAULT_VOICE_BEHAVIOR.pacePreset
  const verbosityPreset = VERBOSITY_SET.has(raw.verbosityPreset as VoiceVerbosityPreset)
    ? (raw.verbosityPreset as VoiceVerbosityPreset)
    : DEFAULT_VOICE_BEHAVIOR.verbosityPreset

  return {
    version: VOICE_BEHAVIOR_SCHEMA_VERSION,
    tonePreset,
    pacePreset,
    verbosityPreset,
    bargeInEnabled: raw.bargeInEnabled === true,
  }
}

export function labelForTonePreset(preset: VoiceTonePreset): string {
  return VOICE_TONE_PRESETS.find((p) => p.value === preset)?.label ?? preset
}

export function labelForPacePreset(preset: VoicePacePreset): string {
  return VOICE_PACE_PRESETS.find((p) => p.value === preset)?.label ?? preset
}

export function labelForVerbosityPreset(preset: VoiceVerbosityPreset): string {
  return VOICE_VERBOSITY_PRESETS.find((p) => p.value === preset)?.label ?? preset
}

/** Shown in Demo / Studio — no live-interruption claims. */
export const VOICE_BEHAVIOR_PREVIEW_DISCLAIMER =
  'Tone and verbosity shape browser demo replies and Bolna phone prompts when saved here. Pace affects Sarvam TTS speed on phone when telephony is live. Live caller interruption is not available in client demos.'

const TONE_PROMPT: Record<VoiceTonePreset, string> = {
  calm_warm:
    'Use a calm, warm tone: patient, reassuring, and respectful. Acknowledge frustration without being defensive.',
  authoritative:
    'Use an authoritative tone: clear, confident, and direct. State facts and next steps without sounding harsh.',
  empathetic:
    'Use an empathetic tone: gentle, validating, and unhurried. Acknowledge feelings before giving instructions.',
  neutral: 'Use a neutral professional tone: polite, efficient, and business-appropriate.',
}

const PACE_PROMPT: Record<VoicePacePreset, string> = {
  slow: 'Pace: allow slightly longer phrasing and pauses so the caller can follow on mobile.',
  normal: 'Pace: natural conversational speed — neither rushed nor drawn out.',
  fast: 'Pace: keep turns snappy; short sentences; avoid long preambles.',
}

const VERBOSITY_PROMPT: Record<VoiceVerbosityPreset, string> = {
  brief: 'Verbosity: one main idea per turn; at most two short sentences unless the user asks for detail.',
  balanced:
    'Verbosity: concise answers; add one clarifying question when needed; avoid monologues.',
  detailed:
    'Verbosity: you may use up to three short sentences when context requires it; still suitable for voice.',
}

/** Groq / Bolna max_tokens from verbosity preset. */
export function maxTokensForVerbosity(preset: VoiceVerbosityPreset): number {
  switch (preset) {
    case 'brief':
      return 180
    case 'detailed':
      return 512
    default:
      return 320
  }
}

/** Map Studio tone preset to Sarvam/VEXYL voice style token. */
export function voiceToneFromTonePreset(preset: VoiceTonePreset): string {
  switch (preset) {
    case 'calm_warm':
      return 'warm'
    case 'authoritative':
      return 'formal'
    case 'empathetic':
      return 'calm'
    default:
      return 'formal'
  }
}

/** Sarvam Bulbul speed multiplier from pace preset. */
export function sarvamSpeedForPace(preset: VoicePacePreset): number {
  switch (preset) {
    case 'slow':
      return 0.85
    case 'fast':
      return 1.15
    default:
      return 1.0
  }
}

/** Investor browser-live demo languages (telephony deferred). */
export const INVESTOR_DEMO_LANGUAGES = {
  primary: ['en', 'hi'] as const,
  optional: ['te'] as const,
  codeSwitching: true as const,
}

const INVESTOR_CONVERSATION_GUIDANCE = `
Indian conversational style (browser-live demo):
- Keep each reply to 1–2 short sentences unless the caller asks for detail.
- Use natural acknowledgements before answering: "Ji", "Haan", "Sure", "Okay" — pick what fits the language mix.
- If the caller code-switches (Hindi-English or Telugu-English), mirror their mix naturally; do not force pure English.
- After barge-in or interruption, acknowledge briefly ("Got it", "Ji, samajh gaya") then answer the latest point only.
- Avoid translated-sounding grammar; prefer everyday spoken phrasing over formal written Hindi/English.
- End turns with one clear next step or one clarifying question — not both unless necessary.
`.trim()

/** System-prompt block merged in buildMergedSystemContext. */
export function voiceBehaviorPromptBlock(config: VoiceBehaviorConfig): string {
  return [
    'Voice delivery (agent presets):',
    `- ${TONE_PROMPT[config.tonePreset]}`,
    `- ${PACE_PROMPT[config.pacePreset]}`,
    `- ${VERBOSITY_PROMPT[config.verbosityPreset]}`,
    INVESTOR_CONVERSATION_GUIDANCE,
  ].join('\n')
}

/** Suggested defaults when creating or changing Studio purpose. */
export function suggestVoiceBehaviorForPurpose(
  purpose: string,
): Pick<VoiceBehaviorConfig, 'tonePreset' | 'pacePreset' | 'verbosityPreset'> {
  switch (purpose) {
    case 'support':
      return { tonePreset: 'calm_warm', pacePreset: 'normal', verbosityPreset: 'balanced' }
    case 'collections':
      return { tonePreset: 'authoritative', pacePreset: 'normal', verbosityPreset: 'brief' }
    case 'sales':
      return { tonePreset: 'neutral', pacePreset: 'normal', verbosityPreset: 'balanced' }
    case 'surveys':
      return { tonePreset: 'neutral', pacePreset: 'normal', verbosityPreset: 'brief' }
    default:
      return {
        tonePreset: DEFAULT_VOICE_BEHAVIOR.tonePreset,
        pacePreset: DEFAULT_VOICE_BEHAVIOR.pacePreset,
        verbosityPreset: DEFAULT_VOICE_BEHAVIOR.verbosityPreset,
      }
  }
}

export function hasSavedVoiceBehavior(workflow: unknown): boolean {
  if (!isRecord(workflow)) return false
  return isRecord(workflow.voiceBehavior)
}

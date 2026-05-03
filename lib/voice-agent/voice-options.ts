export interface VoiceOption {
  id: string
  label: string
}

export const DEFAULT_VOICE_ID = 'arjun-formal'

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'arjun-formal', label: 'Ashutosh (Male, Formal)' },
  { id: 'arjun-calm', label: 'Rahul (Male, Calm)' },
  { id: 'arjun-warm', label: 'Aditya (Male, Warm)' },
  { id: 'divya-formal', label: 'Ritu (Female, Formal)' },
  { id: 'divya-calm', label: 'Neha (Female, Calm)' },
  { id: 'divya-warm', label: 'Kavya (Female, Warm)' },
  { id: 'priya-calm', label: 'Priya (Female, Calm)' },
  { id: 'priya-warm', label: 'Priya (Female, Warm)' },
  { id: 'rahul-formal', label: 'Rahul (Male, Formal)' },
]

export function isKnownVoiceId(voiceId: string): boolean {
  return VOICE_OPTIONS.some((voice) => voice.id === voiceId)
}

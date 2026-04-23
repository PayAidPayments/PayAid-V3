/**
 * Sarvam AI integration for voice agents
 * Enables Samvaad-like low-latency: Sarvam Chat (LLM) + Bulbul (TTS).
 * @see https://docs.sarvam.ai/ | https://www.sarvam.ai/
 */

const SARVAM_CHAT_URL = 'https://api.sarvam.ai/v1/chat/completions'
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech'

const LANG_TO_BCP47: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  ml: 'ml-IN',
  od: 'od-IN',
  'en-IN': 'en-IN',
  'hi-IN': 'hi-IN',
}

function getApiKey(): string | undefined {
  const k = (process.env.SARVAM_API_KEY || process.env.SARVAM_API_SUBSCRIPTION_KEY || '').trim()
  return k || undefined
}

export function isSarvamConfigured(): boolean {
  return !!getApiKey()
}

/** Remove internal reasoning/meta so we never send checklists, "Attempt 2:", "The response will be:", etc. to the user */
function stripReasoningFromText(raw: string): string {
  if (!raw || typeof raw !== 'string') return ''
  let t = raw.trim()
  // Extract reply when model says "The response will be: ..." or "Response: ..."
  const responseWillBe = t.match(/(?:the\s+response\s+will\s+be|response)\s*[:"]\s*([^.*\n]+(?:\.[^\n]+)?)/im)
  if (responseWillBe) t = responseWillBe[1].trim()
  const metaPatterns = [
    /^\s*\d+\.\s*\*\*[^*]*\*\*\s*/im,
    /\*\s*Attempt\s*\d+[^*]*\*/gim,
    /let'?s\s+(add|check|try|refine)[^.\n]*/gim,
    /refining\s*:[^.\n]*/gim,
    /check the rules[^.\n]*/gim,
    /this is direct, follows the flow[^.\n]*/gim,
    /it'?s a good start[^.\n]*/gim,
    /this feels more natural[^.\n]*/gim,
    /\*\s*Is it[^?]*\?\s*(?:Yes|No)\.?\s*/gim,
    /\*\s*Does it[^?]*\?\s*(?:Yes|No)\.?\s*/gim,
    /\*\s*Do(?:es)?\s+(?:it|we)[^?]*\?\s*(?:Yes|No)\.?\s*/gim,
    /\*\s*[A-Z][^?]*\?\s*(?:Yes|No)\.?\s*/gim,
  ]
  for (const p of metaPatterns) t = t.replace(p, ' ')
  // Drop lines that are purely meta (bullets with checklist Q&A, Attempt N, etc.)
  t = t
    .split(/\n/)
    .filter((line) => {
      const s = line.trim()
      if (!s) return false
      if (/^[\*\-]\s*$/.test(s)) return false
      if (/^Attempt\s+\d+/i.test(s)) return false
      if (/^Let'?s\s+/i.test(s)) return false
      if (/^(refining|check the rules)/i.test(s)) return false
      if (/^this (is direct|feels more)/i.test(s)) return false
      if (/^\*\s*(?:Is it|Does it|Do we|Does we)[^?]*\?\s*(?:Yes|No)/i.test(s)) return false
      return true
    })
    .join('\n')
    .trim()
  const quoted = t.match(/^["']([^"']+)["']\s*\.?\s*$/m)
  if (quoted) t = quoted[1].trim()
  return t.replace(/\s+/g, ' ').trim()
}

/**
 * Sarvam Chat Completions (LLM) – fast, Indian-language-optimized.
 * Pass options.signal (e.g. from AbortController) to enforce timeout and avoid hanging.
 */
export async function sarvamChat(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; model?: string; signal?: AbortSignal }
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('SARVAM_API_KEY not set')

  const model = options?.model ?? 'sarvam-30b-16k' // 16k context, cost-efficient, fast
  const fullMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  const res = await fetch(SARVAM_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      model,
      messages: fullMessages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: 768, // enough for reasoning + short reply (512 often hit limit → content null)
    }),
    signal: options?.signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Sarvam chat failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: { content?: string | null; reasoning_content?: string | null }
      delta?: { content?: string }
      text?: string
    }>
  }
  const first = data?.choices?.[0]
  let text =
    (typeof first?.message?.content === 'string' && first.message.content.trim()) ||
    (typeof first?.delta?.content === 'string' && first.delta.content.trim()) ||
    (typeof first?.text === 'string' && first.text.trim()) ||
    ''
  // When finish_reason is "length", Sarvam may only fill reasoning_content and leave content null
  if (!text && typeof first?.message?.reasoning_content === 'string' && first.message.reasoning_content.trim()) {
    const raw = first.message.reasoning_content.trim()
    // Prefer last paragraph or last ~300 chars (often the conclusion); strip meta/reasoning
    const lastPara = raw.split(/\n\s*\n/).filter(Boolean).pop()?.trim()
    const tail = lastPara && lastPara.length <= 400 ? lastPara : raw.slice(-400).trim()
    if (tail) text = stripReasoningFromText(tail)
  }
  // Never send internal reasoning/meta to the user (e.g. "Attempt 2:", "The response will be:", bullet analysis)
  text = stripReasoningFromText(text)
  if (!text) {
    const hint = first?.message ? '(message present, content empty)' : first ? '(choice present, no message)' : '(no choices)'
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Sarvam] No content in response', hint, JSON.stringify(data).slice(0, 300))
    }
    throw new Error('Sarvam chat: no content in response')
  }
  return text
}

/** Valid Bulbul v3 speaker IDs (Sarvam API). Agent voiceId may be VEXYL-style (e.g. priya-warm); map to one of these. */
const SARVAM_SPEAKERS = new Set([
  'aditya', 'ritu', 'ashutosh', 'priya', 'neha', 'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'amit', 'dev',
  'ishita', 'shreya', 'ratan', 'varun', 'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'shubh', 'advait', 'anand',
  'tanya', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani', 'mohit', 'kavitha', 'rehan', 'soham',
  'rupali', 'niharika',
])

type VoiceStyle = 'formal' | 'calm' | 'warm'
type VoiceGender = 'male' | 'female'

const STYLE_BY_VOICE_ID: Record<string, VoiceStyle> = {
  'arjun-formal': 'formal',
  'arjun-calm': 'calm',
  'arjun-warm': 'warm',
  'rahul-formal': 'formal',
  'divya-formal': 'formal',
  'divya-calm': 'calm',
  'divya-warm': 'warm',
  'priya-formal': 'formal',
  'priya-calm': 'calm',
  'priya-warm': 'warm',
}

const GENDER_BY_VOICE_ID: Record<string, VoiceGender> = {
  'arjun-formal': 'male',
  'arjun-calm': 'male',
  'arjun-warm': 'male',
  'rahul-formal': 'male',
  'divya-formal': 'female',
  'divya-calm': 'female',
  'divya-warm': 'female',
  'priya-formal': 'female',
  'priya-calm': 'female',
  'priya-warm': 'female',
}

const LANGUAGE_STYLE_DEFAULTS: Record<string, Record<VoiceStyle, string>> = {
  // Hindi-native pool
  hi: { formal: 'ashutosh', calm: 'rahul', warm: 'aditya' },
  // English-oriented pool kept separate from Hindi defaults
  en: { formal: 'rehan', calm: 'soham', warm: 'rupali' },
  // Regional language defaults tuned for more local-feeling output
  ta: { formal: 'vijay', calm: 'shruti', warm: 'kavitha' },
  te: { formal: 'mani', calm: 'gokul', warm: 'tanya' },
  kn: { formal: 'dev', calm: 'varun', warm: 'roopa' },
  mr: { formal: 'ratan', calm: 'sumit', warm: 'niharika' },
}

const LANGUAGE_MALE_STYLE_DEFAULTS: Record<string, Record<VoiceStyle, string>> = {
  hi: { formal: 'ashutosh', calm: 'rahul', warm: 'aditya' },
  en: { formal: 'rehan', calm: 'soham', warm: 'anand' },
  ta: { formal: 'vijay', calm: 'gokul', warm: 'mani' },
  te: { formal: 'tarun', calm: 'manan', warm: 'sunny' },
  kn: { formal: 'dev', calm: 'varun', warm: 'amit' },
  mr: { formal: 'ratan', calm: 'sumit', warm: 'kabir' },
}

const LANGUAGE_FEMALE_STYLE_DEFAULTS: Record<string, Record<VoiceStyle, string>> = {
  hi: { formal: 'ritu', calm: 'neha', warm: 'kavya' },
  en: { formal: 'shreya', calm: 'rupali', warm: 'niharika' },
  ta: { formal: 'shruti', calm: 'kavitha', warm: 'roopa' },
  te: { formal: 'ishita', calm: 'tanya', warm: 'pooja' },
  kn: { formal: 'suhani', calm: 'roopa', warm: 'simran' },
  mr: { formal: 'shreya', calm: 'niharika', warm: 'rupali' },
}

/**
 * VEXYL-style character + style → one Bulbul speaker, **same in every language**.
 * (Previously we picked different speakers per `language` for Telugu vs Hindi, so the
 * agent sounded like a different person mid-call when code-mixed or when STT toggled language.)
 * Matches UI names in `voice-options.ts` (e.g. arjun-calm = Rahul, arjun-warm = Aditya).
 */
const VEXYL_CHARACTER_SARVAM: Record<string, Record<VoiceStyle, string>> = {
  arjun: { formal: 'ashutosh', calm: 'rahul', warm: 'aditya' },
  divya: { formal: 'ritu', calm: 'neha', warm: 'kavya' },
  priya: { formal: 'priya', calm: 'priya', warm: 'priya' },
  rahul: { formal: 'rahul', calm: 'rahul', warm: 'aditya' },
  vikram: { formal: 'ratan', calm: 'varun', warm: 'mohit' },
  anita: { formal: 'ishita', calm: 'tanya', warm: 'pooja' },
  default: { formal: 'shubh', calm: 'soham', warm: 'rupali' },
}

function normalizeLanguage(language?: string): string {
  const raw = (language || 'hi').toLowerCase().trim()
  if (raw.includes('-')) return raw.split('-')[0]
  if (raw === 'od') return 'or'
  return raw
}

function getStyle(raw: string): VoiceStyle {
  if (raw.includes('warm')) return 'warm'
  if (raw.includes('calm')) return 'calm'
  return STYLE_BY_VOICE_ID[raw] ?? 'formal'
}

function getGender(raw: string): VoiceGender | undefined {
  if (raw.includes('male')) return 'male'
  if (raw.includes('female')) return 'female'
  return GENDER_BY_VOICE_ID[raw]
}

function resolveLanguageStyleSpeaker(language: string, style: VoiceStyle): string {
  const perLanguage = LANGUAGE_STYLE_DEFAULTS[language] ?? LANGUAGE_STYLE_DEFAULTS.hi
  return perLanguage[style] ?? perLanguage.formal
}

function toSarvamSpeaker(voiceId?: string, language?: string): string {
  const raw = (voiceId || 'priya-formal').toLowerCase().trim()
  const lang = normalizeLanguage(language)
  const style = getStyle(raw)
  const parts = raw.split(/[-_]/)
  const character = parts[0] || raw

  // Exact Bulbul name (e.g. "priya", "rahul")
  if (SARVAM_SPEAKERS.has(raw)) return raw

  // Composite VEXYL id: "priya-calm", "arjun-warm" — never collapse to the first token
  // (e.g. "rahul-warm" must become aditya, not "rahul").
  if (parts.length >= 2) {
    const byCharacter = VEXYL_CHARACTER_SARVAM[character]
    if (byCharacter) {
      const speaker = byCharacter[style] ?? byCharacter.formal
      if (speaker && SARVAM_SPEAKERS.has(speaker)) return speaker
    }
  }

  // Single token that is a known Bulbul speaker
  if (parts.length === 1 && character && SARVAM_SPEAKERS.has(character)) return character

  const gender = getGender(raw)

  if (gender === 'male') {
    const speaker = (LANGUAGE_MALE_STYLE_DEFAULTS[lang] ?? LANGUAGE_MALE_STYLE_DEFAULTS.hi)[style]
    if (speaker && SARVAM_SPEAKERS.has(speaker)) return speaker
  }
  if (gender === 'female') {
    const speaker = (LANGUAGE_FEMALE_STYLE_DEFAULTS[lang] ?? LANGUAGE_FEMALE_STYLE_DEFAULTS.hi)[style]
    if (speaker && SARVAM_SPEAKERS.has(speaker)) return speaker
  }

  const languageSpeaker = resolveLanguageStyleSpeaker(lang, style)
  if (languageSpeaker && SARVAM_SPEAKERS.has(languageSpeaker)) return languageSpeaker

  const def = VEXYL_CHARACTER_SARVAM.default[style] ?? 'priya'
  return def && SARVAM_SPEAKERS.has(def) ? def : 'priya'
}

/**
 * Sarvam Bulbul TTS – returns audio buffer (WAV or MP3).
 * Use outputCodec: 'mp3' for browser playback (better support than WAV in some browsers).
 */
export async function sarvamTts(
  text: string,
  language: string,
  options?: {
    speaker?: string
    sampleRate?: number
    signal?: AbortSignal
    outputCodec?: 'wav' | 'mp3'
    /** bulbul:v3: 0.5–2.0, default 1.0 */
    pace?: number
    /** bulbul:v3: higher = more expressive/varied prosody (typical 0.5–0.9 for calls) */
    temperature?: number
  }
): Promise<Buffer> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('SARVAM_API_KEY not set')

  const targetLanguageCode = LANG_TO_BCP47[language] || (language.includes('-') ? language : `${language}-IN`)
  const speaker = toSarvamSpeaker(options?.speaker, language)
  const speechSampleRate = options?.sampleRate ?? 24000
  const codec = options?.outputCodec ?? 'wav'
  const pace = options?.pace
  const temperature = options?.temperature

  const body: Record<string, unknown> = {
    text,
    target_language_code: targetLanguageCode,
    model: 'bulbul:v3',
    speaker,
    speech_sample_rate: speechSampleRate,
    output_audio_codec: codec,
  }
  if (pace != null) body.pace = pace
  if (temperature != null) body.temperature = temperature

  const res = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Sarvam TTS failed (${res.status}): ${err}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = (await res.json()) as {
      audios?: string[]
      audio_content?: string
      audio?: string
      audio_base64?: string
      data?: string
    }
    // Sarvam API returns { audios: ["<base64>"] }; also support legacy field names
    const b64 =
      Array.isArray(json.audios) && json.audios[0]
        ? json.audios[0]
        : json.audio_content ?? json.audio ?? json.audio_base64 ?? json.data
    if (b64) return Buffer.from(b64, 'base64')
    throw new Error('Sarvam TTS: no audio in JSON response')
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

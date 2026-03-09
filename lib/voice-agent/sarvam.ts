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

/**
 * Sarvam Chat Completions (LLM) – fast, Indian-language-optimized
 */
export async function sarvamChat(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; model?: string }
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
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Sarvam chat failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (text == null) throw new Error('Sarvam chat: no content in response')
  return text
}

/**
 * Sarvam Bulbul TTS – returns WAV audio buffer
 */
export async function sarvamTts(
  text: string,
  language: string,
  options?: { speaker?: string; sampleRate?: number }
): Promise<Buffer> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('SARVAM_API_KEY not set')

  const targetLanguageCode = LANG_TO_BCP47[language] || (language.includes('-') ? language : `${language}-IN`)
  const speaker = (options?.speaker || 'priya').toLowerCase()
  const speechSampleRate = options?.sampleRate ?? 24000

  const res = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      text,
      target_language_code: targetLanguageCode,
      model: 'bulbul:v3',
      speaker,
      speech_sample_rate: speechSampleRate,
      output_audio_codec: 'wav',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Sarvam TTS failed (${res.status}): ${err}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = (await res.json()) as {
      audio_content?: string
      audio?: string
      audio_base64?: string
      data?: string
    }
    const b64 = json.audio_content ?? json.audio ?? json.audio_base64 ?? json.data
    if (b64) return Buffer.from(b64, 'base64')
    throw new Error('Sarvam TTS: no audio in JSON response')
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

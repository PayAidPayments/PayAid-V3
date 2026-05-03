/**
 * Sarvam Bulbul TTS provider. Env: SARVAM_API_KEY or SARVAM_API_SUBSCRIPTION_KEY (required).
 */
const SARVAM_TTS_URL = process.env.SARVAM_TTS_URL || 'https://api.sarvam.ai/text-to-speech'

const LANG_BCP47: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', mr: 'mr-IN',
  gu: 'gu-IN', pa: 'pa-IN', bn: 'bn-IN', ml: 'ml-IN', od: 'od-IN',
}

function getApiKey(): string {
  const k = (process.env.SARVAM_API_KEY || process.env.SARVAM_API_SUBSCRIPTION_KEY || '').trim()
  if (!k) throw new Error('SARVAM_API_KEY not set')
  return k
}

export default async function sarvam(text: string, lang: string = 'hi'): Promise<Buffer> {
  const apiKey = getApiKey()
  const targetLang = LANG_BCP47[lang] || (lang.includes('-') ? lang : `${lang}-IN`)
  const res = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
    body: JSON.stringify({
      text,
      target_language_code: targetLang,
      model: 'bulbul:v3',
      speaker: 'priya',
      speech_sample_rate: 24000,
      output_audio_codec: 'wav',
    }),
  })
  if (!res.ok) throw new Error(`Sarvam TTS ${res.status}: ${await res.text()}`)
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const json = (await res.json()) as { audios?: string[]; audio_content?: string; audio?: string }
    const b64 = (Array.isArray(json.audios) && json.audios[0]) ? json.audios[0] : json.audio_content ?? json.audio
    if (b64) return Buffer.from(b64, 'base64')
    throw new Error('Sarvam TTS: no audio in response')
  }
  return Buffer.from(await res.arrayBuffer())
}

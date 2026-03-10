/**
 * VEXYL-TTS provider. Env: VEXYL_TTS_URL (required), VEXYL_API_KEY, VEXYL_TTS_PATH, VEXYL_AUTH_HEADER.
 */
function getBaseUrl(): string {
  const url = process.env.VEXYL_TTS_URL?.trim()
  if (!url) throw new Error('VEXYL_TTS_URL not set')
  return url.replace(/\/$/, '')
}

function getPath(): string {
  const p = process.env.VEXYL_TTS_PATH || '/tts'
  return p.startsWith('/') ? p : `/${p}`
}

function getApiKey(): string | undefined {
  const k = process.env.VEXYL_API_KEY
  if (!k || k.trim() === '' || k.toLowerCase() === 'undefined') return undefined
  return k.trim()
}

function getAuthHeaders(apiKey: string | undefined): Record<string, string> {
  if (!apiKey) return {}
  const format = (process.env.VEXYL_AUTH_HEADER || 'Bearer').trim().toLowerCase()
  if (format === 'none' || format === '') return {}
  if (format === 'x-api-key') return { 'X-API-Key': apiKey }
  if (format === 'api-key') return { 'Api-Key': apiKey }
  return { Authorization: `Bearer ${apiKey}` }
}

const LOCALE_MAP: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', mr: 'mr-IN',
  gu: 'gu-IN', pa: 'pa-IN', bn: 'bn-IN', ml: 'ml-IN', or: 'or-IN', as: 'as-IN', ne: 'ne-IN', ur: 'ur-IN',
}

export default async function vexyl(text: string, lang: string = 'hi'): Promise<Buffer> {
  const baseUrl = getBaseUrl()
  const path = getPath()
  const locale = LOCALE_MAP[lang] || `${lang}-IN`
  const url = `${baseUrl}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(getApiKey()) },
    body: JSON.stringify({
      text,
      language: locale,
      speaker: 'divya-calm',
      voice_style: 'calm',
      format: 'wav',
    }),
  })
  if (!res.ok) throw new Error(`VEXYL TTS ${res.status}: ${await res.text()}`)
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const json = (await res.json()) as { audio_base64?: string; audio?: string }
    const b64 = json.audio_base64 ?? json.audio
    if (b64) return Buffer.from(b64, 'base64')
    throw new Error('VEXYL TTS response had no audio')
  }
  return Buffer.from(await res.arrayBuffer())
}

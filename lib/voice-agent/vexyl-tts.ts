/**
 * VEXYL-TTS Service
 * Self-hosted, zero per-character cost TTS with 22 Indian languages.
 * Telephony-ready (8kHz), DPDP-compliant (data in India).
 *
 * Env:
 *   VEXYL_TTS_URL     - Base URL (e.g. http://localhost:8080). No trailing slash.
 *   VEXYL_TTS_PATH    - Path (default /tts). Use if your server uses /api/tts etc.
 *   VEXYL_API_KEY     - API key. Omit or set to empty for no auth (dev mode).
 *   VEXYL_AUTH_HEADER - How to send the key: Bearer (default), X-API-Key, Api-Key, Authorization, or none.
 *
 * If you get 401: check server logs/README for expected header, then set VEXYL_AUTH_HEADER
 * (e.g. X-API-Key) and ensure VEXYL_API_KEY matches the server's expected key.
 *
 * Docker: docker run -d -p 8080:8080 -e API_KEY=xxx -e TTS_CACHE_SIZE=2GB vexyl/vexyl-tts
 */

const VEXYL_LANGUAGES: { code: string; locale: string; label: string }[] = [
  { code: 'en', locale: 'en-IN', label: 'English' },
  { code: 'hi', locale: 'hi-IN', label: 'Hindi' },
  { code: 'ta', locale: 'ta-IN', label: 'Tamil' },
  { code: 'te', locale: 'te-IN', label: 'Telugu' },
  { code: 'kn', locale: 'kn-IN', label: 'Kannada' },
  { code: 'mr', locale: 'mr-IN', label: 'Marathi' },
  { code: 'gu', locale: 'gu-IN', label: 'Gujarati' },
  { code: 'pa', locale: 'pa-IN', label: 'Punjabi' },
  { code: 'bn', locale: 'bn-IN', label: 'Bengali' },
  { code: 'ml', locale: 'ml-IN', label: 'Malayalam' },
  { code: 'or', locale: 'or-IN', label: 'Odia' },
  { code: 'as', locale: 'as-IN', label: 'Assamese' },
  { code: 'ne', locale: 'ne-IN', label: 'Nepali' },
  { code: 'ur', locale: 'ur-IN', label: 'Urdu' },
  { code: 'si', locale: 'si-IN', label: 'Sinhala' },
  { code: 'sa', locale: 'sa-IN', label: 'Sanskrit' },
  { code: 'kok', locale: 'kok-IN', label: 'Konkani' },
  { code: 'mai', locale: 'mai-IN', label: 'Maithili' },
  { code: 'sat', locale: 'sat-IN', label: 'Santali' },
  { code: 'mni', locale: 'mni-IN', label: 'Manipuri' },
  { code: 'brx', locale: 'brx-IN', label: 'Bodo' },
  { code: 'doi', locale: 'doi-IN', label: 'Dogri' },
]

/** VEXYL speaker IDs (style suffix: -calm, -warm, -formal). 44+ options when service is running. */
const VEXYL_SPEAKERS: { id: string; label: string; style: string }[] = [
  { id: 'divya-calm', label: 'Divya (Calm)', style: 'calm' },
  { id: 'divya-warm', label: 'Divya (Warm)', style: 'warm' },
  { id: 'divya-formal', label: 'Divya (Formal)', style: 'formal' },
  { id: 'arjun-calm', label: 'Arjun (Calm)', style: 'calm' },
  { id: 'arjun-warm', label: 'Arjun (Warm)', style: 'warm' },
  { id: 'arjun-formal', label: 'Arjun (Formal)', style: 'formal' },
  { id: 'priya-calm', label: 'Priya (Calm)', style: 'calm' },
  { id: 'priya-warm', label: 'Priya (Warm)', style: 'warm' },
  { id: 'priya-formal', label: 'Priya (Formal)', style: 'formal' },
  { id: 'rahul-calm', label: 'Rahul (Calm)', style: 'calm' },
  { id: 'rahul-warm', label: 'Rahul (Warm)', style: 'warm' },
  { id: 'rahul-formal', label: 'Rahul (Formal)', style: 'formal' },
  { id: 'anita-calm', label: 'Anita (Calm)', style: 'calm' },
  { id: 'anita-warm', label: 'Anita (Warm)', style: 'warm' },
  { id: 'anita-formal', label: 'Anita (Formal)', style: 'formal' },
  { id: 'vikram-calm', label: 'Vikram (Calm)', style: 'calm' },
  { id: 'vikram-warm', label: 'Vikram (Warm)', style: 'warm' },
  { id: 'vikram-formal', label: 'Vikram (Formal)', style: 'formal' },
  { id: 'default-calm', label: 'Default (Calm)', style: 'calm' },
  { id: 'default-warm', label: 'Default (Warm)', style: 'warm' },
  { id: 'default-formal', label: 'Default (Formal)', style: 'formal' },
]

export type VexylVoiceStyle = 'calm' | 'warm' | 'formal'

export interface VexylTTSOptions {
  language: string
  speaker: string
  voiceStyle?: VexylVoiceStyle
  format?: 'wav' | 'mp3'
  /** Sample rate for telephony (8000) or web (22050/44100) */
  sampleRate?: number
}

function getBaseUrl(): string {
  const url = process.env.VEXYL_TTS_URL?.trim()
  return (url || 'http://localhost:8080').replace(/\/$/, '')
}

function getCandidateTtsPaths(): string[] {
  const explicitPath = process.env.VEXYL_TTS_PATH?.trim()
  if (explicitPath) {
    return [explicitPath.startsWith('/') ? explicitPath : `/${explicitPath}`]
  }

  // Common VEXYL variants:
  // - standalone tts image: /tts
  // - voice gateway: /api/tts
  return ['/tts', '/api/tts']
}

function getApiKey(): string | undefined {
  const k = process.env.VEXYL_API_KEY
  if (!k || k.trim() === '' || k.toLowerCase() === 'undefined') return undefined
  return k.trim()
}

/**
 * Auth header format for VEXYL. Set VEXYL_AUTH_HEADER in .env to match your server:
 * - Bearer (default) → Authorization: Bearer <key>
 * - X-API-Key       → X-API-Key: <key>
 * - Api-Key         → Api-Key: <key>
 * - none / empty    → no auth header (dev mode when server has no auth)
 */
function getAuthHeaders(apiKey: string | undefined): Record<string, string> {
  if (!apiKey) return {}
  const format = (process.env.VEXYL_AUTH_HEADER || 'Bearer').trim().toLowerCase()
  if (format === 'none' || format === '') return {}
  if (format === 'x-api-key') return { 'X-API-Key': apiKey }
  if (format === 'api-key') return { 'Api-Key': apiKey }
  if (format === 'authorization') return { Authorization: apiKey }
  return { Authorization: `Bearer ${apiKey}` }
}

/** True only when VEXYL_TTS_URL is explicitly set (avoids 401 from default localhost:8080). */
export function isVexylConfigured(): boolean {
  const url = process.env.VEXYL_TTS_URL?.trim()
  return !!url
}

export function getVexylLanguages(): { code: string; locale: string; label: string }[] {
  return [...VEXYL_LANGUAGES]
}

export function getVexylSpeakers(language?: string): { id: string; label: string; style: string }[] {
  return [...VEXYL_SPEAKERS]
}

/** Map short code (hi, en) to VEXYL locale (hi-IN, en-IN) */
export function toVexylLocale(code: string): string {
  const found = VEXYL_LANGUAGES.find((l) => l.code === code)
  return found ? found.locale : `${code}-IN`
}

/**
 * Generate TTS using VEXYL-TTS API.
 * Returns raw audio buffer (WAV or MP3).
 */
export async function synthesizeWithVexyl(
  text: string,
  options: VexylTTSOptions
): Promise<Buffer> {
  const baseUrl = getBaseUrl()
  const apiKey = getApiKey()
  const locale = toVexylLocale(options.language)
  const speaker = options.speaker || 'divya-calm'
  const format = options.format || 'wav'

  const body: Record<string, unknown> = {
    text,
    language: locale,
    speaker,
    format,
  }
  if (options.voiceStyle) {
    body.voice_style = options.voiceStyle
  }
  if (options.sampleRate) {
    body.sample_rate = options.sampleRate
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(apiKey),
  }

  const candidatePaths = getCandidateTtsPaths()
  let response: Response | null = null
  let lastNetworkError: string | null = null
  const pathErrors: string[] = []

  for (const path of candidatePaths) {
    const url = `${baseUrl}${path}`
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const cause = err instanceof Error && (err as Error & { cause?: Error }).cause?.message
      lastNetworkError = cause || msg
      continue
    }

    if (response.ok) {
      break
    }

    const errText = await response.text()
    pathErrors.push(`${path} -> ${response.status}`)

    // If this path is missing, continue trying next candidate.
    if (response.status === 404) {
      response = null
      continue
    }

    // Non-404 response likely means path is valid but request/auth failed; surface immediately.
    throw new Error(`VEXYL TTS failed (${response.status}) on ${path}: ${errText}`)
  }

  if (!response) {
    if (lastNetworkError) {
      throw new Error(
        `VEXYL TTS unreachable (${lastNetworkError}). Is the gateway running at ${baseUrl}?`
      )
    }
    throw new Error(
      `VEXYL TTS endpoint not found on ${baseUrl}. Tried: ${candidatePaths.join(', ')}${
        pathErrors.length ? ` (${pathErrors.join('; ')})` : ''
      }. Set VEXYL_TTS_PATH in .env to your server's TTS route.`
    )
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = (await response.json()) as { audio?: string; audio_base64?: string }
    if (json.audio_base64) {
      return Buffer.from(json.audio_base64, 'base64')
    }
    if (json.audio) {
      return Buffer.from(json.audio, 'base64')
    }
    throw new Error('VEXYL TTS response had no audio field')
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

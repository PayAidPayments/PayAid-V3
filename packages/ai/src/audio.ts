/**
 * Speech: Whisper / gateway STT and Coqui / gateway / env TTS.
 */

import { getAiGatewayUrl, getWhisperOrSttUrl, getTtsUrl } from './config'
import coquiTts from './providers/coqui'

export interface TranscribeOptions {
  /** Bearer for AI gateway */
  bearerToken?: string
  language?: string
  task?: 'transcribe' | 'translate'
}

/**
 * Prefer dedicated `WHISPER_URL` (POST JSON { audio_url } → { text }),
 * else AI Gateway `/api/speech-to-text`.
 */
export async function transcribeAudio(audioUrl: string, options?: TranscribeOptions): Promise<string> {
  const direct = getWhisperOrSttUrl()
  if (direct) {
    const res = await fetch(`${direct}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_url: audioUrl,
        language: options?.language,
        task: options?.task ?? 'transcribe',
      }),
    }).catch(() => null)

    if (res?.ok) {
      const data = (await res.json()) as { text?: string }
      if (data.text) return data.text
    }

    const res2 = await fetch(direct, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_url: audioUrl,
        language: options?.language,
        task: options?.task ?? 'transcribe',
      }),
    })
    if (!res2.ok) {
      const t = await res2.text().catch(() => res2.statusText)
      throw new Error(`Whisper/STT ${res2.status}: ${t.slice(0, 200)}`)
    }
    const data = (await res2.json()) as { text?: string }
    if (!data.text) throw new Error('STT response missing text')
    return data.text
  }

  const gw = getAiGatewayUrl()
  if (gw) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (options?.bearerToken) headers.Authorization = `Bearer ${options.bearerToken}`
    const res = await fetch(`${gw}/api/speech-to-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        audio_url: audioUrl,
        language: options?.language,
        task: options?.task ?? 'transcribe',
      }),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => res.statusText)
      throw new Error(`AI Gateway STT ${res.status}: ${t.slice(0, 200)}`)
    }
    const data = (await res.json()) as { text?: string }
    if (!data.text) throw new Error('AI Gateway STT missing text')
    return data.text
  }

  throw new Error(
    'STT not configured. Set WHISPER_URL, SPEECH_TO_TEXT_URL, or AI_GATEWAY_URL.'
  )
}

export interface SynthesizeOptions {
  voiceId?: string
  language?: string
  bearerToken?: string
}

/**
 * Order: `TTS_URL` (POST { text, language, voice } → JSON with audio_url or base64),
 * else AI Gateway `/api/text-to-speech`,
 * else Coqui via `COQUI_TTS_URL` (existing provider).
 */
export async function synthesizeSpeech(
  text: string,
  options?: SynthesizeOptions
): Promise<{ url?: string; audioBase64?: string; provider: string }> {
  const tts = getTtsUrl()
  const lang = options?.language ?? 'en'

  if (tts) {
    const res = await fetch(tts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: lang,
        voice: options?.voiceId,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`TTS_URL ${res.status}: ${err.slice(0, 200)}`)
    }
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const json = (await res.json()) as {
        audio_url?: string
        audio_base64?: string
        audio?: string
      }
      if (json.audio_url) return { url: json.audio_url, provider: 'tts-url' }
      const b64 = json.audio_base64 ?? json.audio
      if (b64) return { audioBase64: b64, provider: 'tts-url' }
      throw new Error('TTS_URL JSON missing audio_url / audio_base64')
    }
    const buf = await res.arrayBuffer()
    return {
      audioBase64: Buffer.from(buf).toString('base64'),
      provider: 'tts-url',
    }
  }

  const gw = getAiGatewayUrl()
  if (gw) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (options?.bearerToken) headers.Authorization = `Bearer ${options.bearerToken}`
    const res = await fetch(`${gw}/api/text-to-speech`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        language: lang,
        voice: options?.voiceId,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`AI Gateway TTS ${res.status}: ${err.slice(0, 200)}`)
    }
    const json = (await res.json()) as { audio_url?: string }
    if (json.audio_url) return { url: json.audio_url, provider: 'ai-gateway' }
    throw new Error('AI Gateway TTS missing audio_url')
  }

  if (process.env.COQUI_TTS_URL?.trim()) {
    const buf = await coquiTts(text, lang)
    return { audioBase64: buf.toString('base64'), provider: 'coqui' }
  }

  throw new Error('TTS not configured. Set TTS_URL, AI_GATEWAY_URL, or COQUI_TTS_URL.')
}

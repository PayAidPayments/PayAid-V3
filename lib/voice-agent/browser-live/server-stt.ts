/**
 * Server-side STT for browser live voice (mic audio → transcript).
 * Sarvam-first when configured; Whisper/gateway fallback.
 */

import { isSarvamConfigured, sarvamStt } from '@/lib/voice-agent/sarvam'
import { transcribeAudioFree } from '@/lib/voice-agent/stt-free'
import { assessSttSafety, type SttSafetyReason } from '@/lib/voice-agent/browser-live/stt-safety'

export type BrowserLiveSttProvider = 'auto' | 'sarvam' | 'whisper'

export function browserLiveSttProvider(): BrowserLiveSttProvider {
  const raw = (process.env.BROWSER_LIVE_STT_PROVIDER || '').trim().toLowerCase()
  if (raw === 'sarvam' || raw === 'whisper' || raw === 'gateway') {
    return raw === 'gateway' ? 'whisper' : raw
  }
  return 'auto'
}

function shouldPreferSarvam(provider: BrowserLiveSttProvider): boolean {
  if (provider === 'whisper') return false
  if (provider === 'sarvam') return true
  return isSarvamConfigured()
}

async function transcribeWithWhisper(
  buf: Buffer,
  mime: string,
  language?: string,
): Promise<{ text: string; language: string }> {
  const raw = buf.toString('base64')
  const dataUrl = `data:${mime || 'audio/webm'};base64,${raw}`
  const result = await transcribeAudioFree(dataUrl, language)
  return {
    text: (result.text || '').trim(),
    language: result.language || language || 'en',
  }
}

export type BrowserLiveSttResult = {
  text: string
  language: string
  confidence?: number
  safetyReason?: SttSafetyReason
  audioBytes?: number
}

function withSafety(
  text: string,
  language: string,
  audioBytes: number,
): BrowserLiveSttResult {
  const safety = assessSttSafety(text, audioBytes)
  return {
    text,
    language,
    confidence: safety.confidence,
    safetyReason: safety.reason,
    audioBytes,
  }
}

export async function transcribeBrowserLiveAudio(
  audioBase64: string,
  mime: string,
  language?: string,
): Promise<BrowserLiveSttResult> {
  const raw = audioBase64.replace(/\s/g, '')
  const buf = Buffer.from(raw, 'base64')
  if (!buf.byteLength) {
    return withSafety('', language || 'en', 0)
  }

  const provider = browserLiveSttProvider()
  const preferSarvam = shouldPreferSarvam(provider)

  if (preferSarvam) {
    try {
      const stt = await sarvamStt(buf, { mime, language })
      return withSafety(stt.text, stt.language, buf.byteLength)
    } catch (e) {
      if (provider === 'sarvam') throw e
      console.warn('[browser-live-stt] Sarvam failed, falling back to Whisper:', e)
    }
  }

  const whisper = await transcribeWithWhisper(buf, mime, language)
  return withSafety(whisper.text, whisper.language, buf.byteLength)
}

/**
 * Sentence-chunked TTS streaming for browser live voice (sidecar only).
 */

import { browserLiveTtsProvider, synthesizeSpeech } from '@/lib/voice-agent/tts'
import {
  sarvamSpeedForPace,
  voiceToneFromTonePreset,
  type VoiceBehaviorConfig,
} from '@/lib/voice-agent/voice-behavior-config'

export type TtsStreamChunk = {
  seq: number
  audioBase64: string
  mime: string
  textSlice: string
}

/** Split agent reply into speakable chunks for progressive playback. */
export function splitTextForStreamingTts(text: string, maxChunkChars = 140): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const sentences = trimmed.split(/(?<=[.!?।])\s+/u).filter((s) => s.trim())
  const chunks: string[] = []
  let buf = ''

  const flush = () => {
    if (buf.trim()) {
      chunks.push(buf.trim())
      buf = ''
    }
  }

  for (const sentence of sentences.length ? sentences : [trimmed]) {
    if ((buf + ' ' + sentence).trim().length <= maxChunkChars) {
      buf = buf ? `${buf} ${sentence}` : sentence
    } else {
      flush()
      if (sentence.length <= maxChunkChars) {
        buf = sentence
      } else {
        for (let i = 0; i < sentence.length; i += maxChunkChars) {
          chunks.push(sentence.slice(i, i + maxChunkChars).trim())
        }
      }
    }
  }
  flush()
  return chunks.length ? chunks : [trimmed]
}

function ttsMimeForProvider(): string {
  const provider = browserLiveTtsProvider()
  if (provider === 'sarvam') return 'audio/mpeg'
  if (provider === 'auto' && process.env.SARVAM_API_KEY) return 'audio/mpeg'
  return 'audio/wav'
}

export type StreamTtsOptions = {
  text: string
  language: string
  voiceId?: string | null
  voiceTone?: string | null
  voiceBehavior: Pick<VoiceBehaviorConfig, 'tonePreset' | 'pacePreset'>
  signal?: AbortSignal
  onChunk: (chunk: TtsStreamChunk) => void | Promise<void>
}

export async function streamTtsForText(opts: StreamTtsOptions): Promise<{ chunkCount: number; ttsError?: string }> {
  const { text, language, voiceId, voiceTone, voiceBehavior, signal, onChunk } = opts
  const slices = splitTextForStreamingTts(text)
  let seq = 0
  let ttsError: string | undefined
  const mime = ttsMimeForProvider()
  const sarvamPace = sarvamSpeedForPace(voiceBehavior.pacePreset)
  const toneStyle = voiceToneFromTonePreset(voiceBehavior.tonePreset)

  for (const slice of slices) {
    if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')
    try {
      const audio = await synthesizeSpeech(slice, language || 'en', voiceId ?? undefined, sarvamPace, {
        voiceTone: voiceTone || toneStyle,
        sarvamPace,
        signal,
      })
      if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')
      if (audio && audio.byteLength > 0) {
        await onChunk({
          seq,
          audioBase64: Buffer.from(audio).toString('base64'),
          mime,
          textSlice: slice,
        })
        seq += 1
      }
    } catch (e) {
      ttsError = e instanceof Error ? e.message : String(e)
      break
    }
  }

  return { chunkCount: seq, ttsError }
}

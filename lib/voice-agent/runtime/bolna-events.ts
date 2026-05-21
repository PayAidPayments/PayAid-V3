/**
 * Bolna tenant-bridge event helpers (transcript + latency KPI shaping).
 */

export type BolnaTranscriptRole = 'user' | 'assistant'

export interface BolnaTranscriptEntry {
  role: BolnaTranscriptRole
  content: string
}

export interface BolnaTurnTimings {
  asr_partial_ms?: number
  asr_final_ms?: number
  llm_first_token_ms?: number
  tts_first_chunk_ms?: number
  total_turn_ms?: number
  first_audio_ms?: number
}

export function appendBolnaTranscript(
  existing: string | null,
  entry: BolnaTranscriptEntry,
): string {
  let history: BolnaTranscriptEntry[] = []
  if (existing?.trim()) {
    try {
      const parsed = JSON.parse(existing)
      if (Array.isArray(parsed)) {
        history = parsed.filter(
          (m: unknown): m is BolnaTranscriptEntry =>
            !!m &&
            typeof m === 'object' &&
            (m as BolnaTranscriptEntry).role !== undefined &&
            typeof (m as BolnaTranscriptEntry).content === 'string',
        )
      }
    } catch {
      /* legacy free-text transcript */
    }
  }
  history.push({ role: entry.role, content: entry.content.slice(0, 4000) })
  if (history.length > 200) history.splice(0, history.length - 200)
  return JSON.stringify(history)
}

/** Prefer explicit first_audio_ms; fall back to first TTS chunk latency. */
export function pickFirstAudioMs(timings?: BolnaTurnTimings): number | undefined {
  if (!timings) return undefined
  if (timings.first_audio_ms !== undefined) return timings.first_audio_ms
  if (timings.tts_first_chunk_ms !== undefined) return timings.tts_first_chunk_ms
  return undefined
}

export function pickTtsLatencyMs(timings?: BolnaTurnTimings): number | undefined {
  if (!timings) return undefined
  return timings.tts_first_chunk_ms ?? timings.first_audio_ms
}

export function percentile(sortedAsc: number[], p: number): number | null {
  if (sortedAsc.length === 0) return null
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1),
  )
  return sortedAsc[idx] ?? null
}

export function computeFirstAudioPercentiles(
  samples: Array<{ firstAudioMs: number; runtime: string | null }>,
): {
  samples: number
  p50: number | null
  p95: number | null
  p50Bolna: number | null
  p95Bolna: number | null
} {
  const all = samples.map((s) => s.firstAudioMs).sort((a, b) => a - b)
  const bolna = samples
    .filter((s) => s.runtime === 'bolna')
    .map((s) => s.firstAudioMs)
    .sort((a, b) => a - b)

  return {
    samples: all.length,
    p50: percentile(all, 50),
    p95: percentile(all, 95),
    p50Bolna: percentile(bolna, 50),
    p95Bolna: percentile(bolna, 95),
  }
}

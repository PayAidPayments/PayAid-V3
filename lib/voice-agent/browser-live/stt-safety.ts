/**
 * Low-confidence STT safety rails (Phase 2.4).
 * Reject weak transcripts before turn handling when rail is enabled.
 */

export type SttSafetyReason = 'empty' | 'too_short' | 'low_signal' | 'noise_only' | 'ok'

export type SttSafetyAssessment = {
  ok: boolean
  confidence: number
  reason: SttSafetyReason
}

const NOISE_ONLY = /^[\s.,!?…\-_]+$/i
const FILLER_ONLY =
  /^(um+|uh+|hmm+|ah+|ok+|yes+|no+|haan+|ji+|the|a|an)$/i

/** Heuristic confidence when provider does not return a score. */
export function assessSttSafety(text: string, audioBytes?: number): SttSafetyAssessment {
  const trimmed = (text || '').trim()
  if (!trimmed) {
    return { ok: false, confidence: 0, reason: 'empty' }
  }
  if (trimmed.length < 2) {
    return { ok: false, confidence: 0.15, reason: 'too_short' }
  }
  if (NOISE_ONLY.test(trimmed) || FILLER_ONLY.test(trimmed.toLowerCase())) {
    return { ok: false, confidence: 0.2, reason: 'noise_only' }
  }
  const bytes = audioBytes ?? 0
  if (bytes > 0 && bytes < 1200 && trimmed.length < 8) {
    return { ok: false, confidence: 0.35, reason: 'low_signal' }
  }
  const lenScore = Math.min(trimmed.length / 40, 1)
  const byteScore = bytes > 0 ? Math.min(bytes / 8000, 1) : 0.7
  const confidence = Math.round((0.55 * lenScore + 0.45 * byteScore) * 100) / 100
  return { ok: confidence >= 0.4, confidence, reason: 'ok' }
}

export function isSttLowConfidenceRailEnabled(): boolean {
  return (process.env.VOICE_STT_LOW_CONFIDENCE_RAIL || '').trim() === '1'
}

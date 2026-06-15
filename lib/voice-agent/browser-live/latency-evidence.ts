/**
 * Formal latency + barge-in evidence metrics (browser live voice).
 * Used by LiveLatencyRecorder exports and CI smoke scripts.
 */

import type { BrowserLiveLatencyEvent } from './protocol'

export type LatencyEvidenceReport = {
  recordedAt: string
  mode: 'stub' | 'real' | 'unknown'
  sampleTurns: number
  speechToFirstAudioMs: { p50: number | null; p95: number | null; samples: number[] }
  interruptSilenceMs: { p50: number | null; p95: number | null; samples: number[] }
  turnCompletionRate: number | null
  bargeInCount: number
  falseInterruptEstimate: number | null
  recoveryAfterInterruptRate: number | null
  ttsPartialOrMissingAudioRate: number | null
  passes: {
    speechToFirstAudioP95Under1500: boolean | null
    interruptSilenceP95Under150: boolean | null
    turnCompletionAtLeast90Pct: boolean | null
  }
  events: BrowserLiveLatencyEvent[]
}

const TARGET_SPEECH_TO_AUDIO_P95_MS = 1500
const TARGET_INTERRUPT_SILENCE_P95_MS = 150

export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, idx)]!
}

export function buildLatencyEvidenceReport(
  events: BrowserLiveLatencyEvent[],
  opts?: { mode?: LatencyEvidenceReport['mode'] },
): LatencyEvidenceReport {
  const speechToAudio: number[] = []
  const interruptSilence: number[] = []
  const turnIdsStarted = new Set<string>()
  const turnIdsCompleted = new Set<string>()
  const turnIdsCancelled = new Set<string>()
  const turnIdsWithAudio = new Set<string>()
  const turnIdsWithAgentText = new Set<string>()
  const interruptTurnIds = new Set<string>()
  const recoverySuccess: boolean[] = []

  for (const e of events) {
    if (e.event === 'utterance_sent' || e.event === 'speech_stopped') {
      if (e.turnId) turnIdsStarted.add(e.turnId)
    }
    if (e.event === 'turn_complete' && e.turnId) turnIdsCompleted.add(e.turnId)
    if (e.event === 'turn_cancelled' && e.turnId) turnIdsCancelled.add(e.turnId)
    if (e.event === 'audio_first_byte' && e.turnId) turnIdsWithAudio.add(e.turnId)
    if (e.event === 'agent_text' && e.turnId) turnIdsWithAgentText.add(e.turnId)
    if (e.event === 'interrupt' && e.turnId) interruptTurnIds.add(e.turnId)
    if (e.event === 'tts_missing' && e.turnId) turnIdsWithAgentText.add(e.turnId)
  }

  for (const turnId of turnIdsCompleted) {
    const stopped = events.find(
      (e) =>
        (e.event === 'speech_stopped' || e.event === 'utterance_sent') && e.turnId === turnId,
    )
    const firstAudio = events.find((e) => e.event === 'audio_first_byte' && e.turnId === turnId)
    if (stopped && firstAudio) {
      speechToAudio.push(firstAudio.at - stopped.at)
    }
  }

  for (const e of events) {
    if (e.event === 'interrupt_silence') {
      const ms = Number(e.meta?.msToSilence)
      if (Number.isFinite(ms) && ms >= 0) interruptSilence.push(ms)
    }
  }

  for (const intTurn of interruptTurnIds) {
    const cancelled = events.some((e) => e.event === 'turn_cancelled' && e.turnId === intTurn)
    const laterComplete = [...turnIdsCompleted].some((id) => id !== intTurn)
    recoverySuccess.push(cancelled && laterComplete)
  }

  const started = turnIdsStarted.size
  const completed = turnIdsCompleted.size
  const withTextNoAudio = [...turnIdsWithAgentText].filter((id) => !turnIdsWithAudio.has(id)).length
  const textTurns = turnIdsWithAgentText.size

  const interruptAcks = events.filter((e) => e.event === 'interrupt_ack')
  const bargeInCount = interruptAcks.length
    ? Math.max(...interruptAcks.map((e) => Number(e.meta?.bargeInCount ?? 0)))
    : events.filter((e) => e.event === 'interrupt').length

  const falseInterruptEstimate =
    bargeInCount > 0
      ? Math.max(0, bargeInCount - interruptTurnIds.size) / bargeInCount
      : null

  const speechP50 = percentile(speechToAudio, 50)
  const speechP95 = percentile(speechToAudio, 95)
  const silenceP50 = percentile(interruptSilence, 50)
  const silenceP95 = percentile(interruptSilence, 95)
  const turnCompletionRate = started > 0 ? completed / started : null
  const recoveryAfterInterruptRate =
    recoverySuccess.length > 0
      ? recoverySuccess.filter(Boolean).length / recoverySuccess.length
      : interruptTurnIds.size > 0
        ? turnIdsCompleted.size > 0
          ? 1
          : 0
        : null
  const ttsPartialOrMissingAudioRate =
    textTurns > 0 ? withTextNoAudio / textTurns : null

  return {
    recordedAt: new Date().toISOString(),
    mode: opts?.mode ?? 'unknown',
    sampleTurns: started,
    speechToFirstAudioMs: { p50: speechP50, p95: speechP95, samples: speechToAudio },
    interruptSilenceMs: { p50: silenceP50, p95: silenceP95, samples: interruptSilence },
    turnCompletionRate,
    bargeInCount,
    falseInterruptEstimate,
    recoveryAfterInterruptRate,
    ttsPartialOrMissingAudioRate,
    passes: {
      speechToFirstAudioP95Under1500:
        speechP95 == null ? null : speechP95 <= TARGET_SPEECH_TO_AUDIO_P95_MS,
      interruptSilenceP95Under150:
        silenceP95 == null ? null : silenceP95 <= TARGET_INTERRUPT_SILENCE_P95_MS,
      turnCompletionAtLeast90Pct:
        turnCompletionRate == null ? null : turnCompletionRate >= 0.9,
    },
    events,
  }
}

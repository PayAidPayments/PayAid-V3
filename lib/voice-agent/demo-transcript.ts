/**
 * Voice agent demo — shared transcript turn types (browser sessions).
 */

export type DemoTranscriptTurn = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  /** Blueprint VoiceTurn.interrupted_flag — set when caller barge-in cancels playback. */
  interruptedFlag?: boolean
}

export function parseTranscriptJson(raw: unknown): DemoTranscriptTurn[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (t): t is DemoTranscriptTurn =>
        !!t &&
        typeof t === 'object' &&
        ((t as DemoTranscriptTurn).role === 'user' || (t as DemoTranscriptTurn).role === 'assistant') &&
        typeof (t as DemoTranscriptTurn).content === 'string',
    )
    .map((t) => ({
      role: t.role,
      content: t.content.slice(0, 8000),
      timestamp: typeof t.timestamp === 'string' ? t.timestamp : undefined,
      interruptedFlag: t.interruptedFlag === true,
    }))
}

/** Mark the most recent assistant turn as interrupted (barge-in). */
export function markLastAssistantTurnInterrupted(turns: DemoTranscriptTurn[]): DemoTranscriptTurn[] {
  const next = [...turns]
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].role === 'assistant') {
      next[i] = { ...next[i], interruptedFlag: true }
      break
    }
  }
  return next
}

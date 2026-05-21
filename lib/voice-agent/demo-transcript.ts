/**
 * Voice agent demo — shared transcript turn types (browser sessions).
 */

export type DemoTranscriptTurn = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
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
    }))
}

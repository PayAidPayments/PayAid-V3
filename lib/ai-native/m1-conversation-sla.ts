import type { ConversationIngest } from '@/lib/ai-native/m1-conversations'

/** SLA deadline from ingest: explicit ISO or minutes from event occurred_at. */
export function resolveSlaDueAtFromIngest(event: ConversationIngest): Date | undefined {
  const m = event.metadata as Record<string, unknown> | undefined
  if (!m) return undefined
  const iso = m.sla_due_at
  if (typeof iso === 'string' && iso.length > 0) {
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) return d
  }
  const mins = m.first_response_sla_minutes
  if (typeof mins === 'number' && Number.isFinite(mins) && mins > 0) {
    const base = new Date(event.occurred_at)
    if (!Number.isNaN(base.getTime())) {
      return new Date(base.getTime() + mins * 60 * 1000)
    }
  }
  return undefined
}

/** Same as resolveSlaDueAtFromIngest, but falls back to tenant-level default minutes. */
export function resolveSlaDueAtWithDefaultMinutes(
  event: ConversationIngest,
  defaultMinutes: number | null
): Date | undefined {
  const resolved = resolveSlaDueAtFromIngest(event)
  if (resolved) return resolved
  if (defaultMinutes == null || !Number.isFinite(defaultMinutes) || defaultMinutes <= 0) return undefined
  const base = new Date(event.occurred_at)
  if (Number.isNaN(base.getTime())) return undefined
  return new Date(base.getTime() + defaultMinutes * 60 * 1000)
}

/**
 * Pure SLA presentation for API/detail: breach when thread is still `open` and `slaDueAt` is in the past.
 * `due_in_seconds` is signed seconds until deadline (negative after due).
 */
export function computeUniboxSlaPresentation(params: {
  slaDueAt: Date | null
  status: string
  nowMs: number
}): { breached: boolean; due_in_seconds: number | null } {
  const sla = params.slaDueAt
  const now = params.nowMs
  const breached = Boolean(sla && params.status === 'open' && sla.getTime() < now)
  const dueInSeconds = sla != null ? Math.round((sla.getTime() - now) / 1000) : null
  return { breached, due_in_seconds: dueInSeconds }
}

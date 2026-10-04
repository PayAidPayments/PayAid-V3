/**
 * Session memory metrics + fail-open alerting (D2 Phase 2).
 */

export interface SessionMemoryMetricsSnapshot {
  hits: number
  misses: number
  writes: number
  blockedWrites: number
  errors: number
  failOpen: number
  deletes: number
  exports: number
}

const metrics: SessionMemoryMetricsSnapshot = {
  hits: 0,
  misses: 0,
  writes: 0,
  blockedWrites: 0,
  errors: 0,
  failOpen: 0,
  deletes: 0,
  exports: 0,
}

const ALERT_ERROR_THRESHOLD = Number(process.env.AI_SESSION_MEMORY_ALERT_ERRORS || '5')

export function recordSessionMemoryHit(): void {
  metrics.hits += 1
}

export function recordSessionMemoryMiss(): void {
  metrics.misses += 1
}

export function recordSessionMemoryWrite(): void {
  metrics.writes += 1
}

export function recordSessionMemoryBlockedWrite(): void {
  metrics.blockedWrites += 1
}

export function recordSessionMemoryDelete(count = 1): void {
  metrics.deletes += count
}

export function recordSessionMemoryExport(): void {
  metrics.exports += 1
}

export function recordSessionMemoryError(op: string, err?: unknown): void {
  metrics.errors += 1
  metrics.failOpen += 1
  console.warn(
    '[session-memory-alert]',
    JSON.stringify({
      event: 'ai_session_memory_fail_open',
      op,
      errors: metrics.errors,
      failOpen: metrics.failOpen,
      message: err instanceof Error ? err.message : String(err || 'unknown'),
    })
  )
  if (metrics.errors >= ALERT_ERROR_THRESHOLD && metrics.errors % ALERT_ERROR_THRESHOLD === 0) {
    console.error(
      '[session-memory-alert]',
      JSON.stringify({
        event: 'ai_session_memory_error_threshold',
        severity: 'high',
        errors: metrics.errors,
        threshold: ALERT_ERROR_THRESHOLD,
        hint: 'Redis session memory fail-open rate elevated; check REDIS_URL / pool health',
      })
    )
  }
}

export function getSessionMemoryMetrics(): SessionMemoryMetricsSnapshot {
  return { ...metrics }
}

export function resetSessionMemoryMetricsForTests(): void {
  metrics.hits = 0
  metrics.misses = 0
  metrics.writes = 0
  metrics.blockedWrites = 0
  metrics.errors = 0
  metrics.failOpen = 0
  metrics.deletes = 0
  metrics.exports = 0
}

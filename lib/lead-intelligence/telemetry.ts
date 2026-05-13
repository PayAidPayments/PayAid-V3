/**
 * Lead Intelligence product counters (complement audit rows).
 * - In-process totals always increment (bounded map; tests can reset).
 * - StatsD: `lead_intelligence.event` with tag `action:<name>` when STATSD_* is configured.
 * - Funnel outcomes: discovery (nonempty vs empty hits) and CSV export (nonempty vs empty row set)
 *   stack on top of `search_started` / `export_requested`.
 */

const totals = new Map<string, number>()

let statsdInitialized = false

function bumpStatsd(action: string): void {
  if (!process.env.STATSD_HOST) return
  try {
    if (!statsdInitialized) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/lib/monitoring/statsd').initializeStatsD()
      statsdInitialized = true
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { increment } = require('@/lib/monitoring/statsd')
    increment('lead_intelligence.event', 1, [`action:${action}`])
  } catch {
    // metrics are non-blocking
  }
}

export type LeadIntelligenceTelemetryAction =
  | 'search_started'
  | 'discovery_results_nonempty'
  | 'discovery_results_empty'
  | 'saved_searches_list_active'
  | 'saved_searches_list_archived'
  | 'search_saved'
  | 'search_renamed'
  | 'search_archived'
  | 'search_unarchived'
  | 'search_deleted'
  | 'export_history_viewed'
  | 'export_requested'
  | 'export_csv_nonempty'
  | 'export_csv_empty'
  | 'export_failed'

export function trackLeadIntelligenceEvent(action: LeadIntelligenceTelemetryAction): void {
  totals.set(action, (totals.get(action) ?? 0) + 1)
  bumpStatsd(action)
}

/** Snapshot of in-process counters (survives for the lifetime of one Node/serverless isolate). */
export function getLeadIntelligenceTelemetryTotals(): Record<string, number> {
  return Object.fromEntries(totals)
}

/** @internal Jest-only */
export function resetLeadIntelligenceTelemetryForTests(): void {
  totals.clear()
  statsdInitialized = false
}

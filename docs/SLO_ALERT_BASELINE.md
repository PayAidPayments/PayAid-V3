# SLO and Alert Baseline (M0/M1 APIs)

Baseline objectives for API reliability and queue health. Tune thresholds as real traffic grows.

---

## Scope

Primary monitored surfaces:

- `GET /api/v1/m0/exit-metrics`
- `POST /api/v1/conversations/ingest`
- `GET /api/v1/conversations`
- `GET /api/v1/revenue/funnel`
- `GET /api/v1/revenue/velocity`
- `GET /api/v1/revenue/insights/next-actions`
- `POST /api/v1/revenue/feedback`
- `GET /api/v1/revenue/won-timeseries`
- Outbox health/metrics/reconciliation endpoints

## SLO Targets

- **Availability:** 99.5% (rolling 30d) for core `/api/v1/*` reads/writes.
- **Latency (p95):**
  - Reads: `< 800ms`
  - Writes: `< 1200ms`
- **Error rate:** `< 1%` 5xx over 15m rolling window.
- **Queue lag (outbox):** queued oldest item age `< 120s` in normal operation.

## Alert Thresholds

- **Warning**
  - p95 read latency `> 1200ms` for 10m
  - p95 write latency `> 1800ms` for 10m
  - 5xx error rate `> 2%` for 10m
  - outbox oldest queued age `> 300s`
- **Critical**
  - p95 read latency `> 2000ms` for 10m
  - p95 write latency `> 3000ms` for 10m
  - 5xx error rate `> 5%` for 5m
  - outbox DLQ count rising and oldest queued age `> 600s`

## Response Playbook (High Level)

1. Confirm impacted route(s), tenant scope, and timeframe.
2. Check outbox health + metrics endpoints for queue/DLQ anomalies.
3. Verify recent deploy/migration/feature-flag changes.
4. Roll back via feature flag when possible; apply forward-fix for data issues.
5. Capture incident timeline, root cause, and follow-up actions.

## Evidence to Archive

- Alert snapshots (latency/error/queue charts)
- Affected route list and tenant impact
- Mitigation steps and resolution timestamp
- Follow-up engineering actions and owners


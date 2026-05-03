# Outbox Operations Runbook

This runbook covers operational handling for PayAid's outbox reliability path.

## Scope

- Outbox enqueue: `outbox_event`
- Dispatch success: `outbox_dispatch`
- Dispatch failure (final): `outbox_dlq`
- Manual replay action: `outbox_replay`

## Endpoints

- Metrics: `GET /api/v1/outbox/metrics`
- Replay: `POST /api/v1/outbox/replay`
- Health: `GET /api/v1/outbox/health`
- Reconciliation History: `GET /api/v1/outbox/reconciliation/history`
- Reconciliation History Export: `GET /api/v1/outbox/reconciliation/history/export`
- Reconciliation Telemetry: `GET /api/v1/outbox/reconciliation/telemetry`
- Reconciliation Trends: `GET /api/v1/outbox/reconciliation/trends?days=7`
- Manual Run: `POST /api/v1/outbox/reconciliation/run`

## Reconciliation Schedule

- Trigger endpoint: `POST /api/cron/outbox-reconciliation`
- Recommended schedule: every day at 01:00 local server time
- Auth: `Authorization: Bearer <CRON_SECRET>`
- Expected outcome:
  - reconciliation rows recorded per tenant (`entityType = outbox_reconciliation_run`)
  - alerts created for risky tenants (`source = outbox-reconciliation-cron`)
- Operator checks:
  - verify `runsLast24h` and `riskyRunsLast24h` from telemetry endpoint
  - investigate if runs are missing or risky run count spikes
  - use manual run endpoint during incidents when cron lag is suspected
- manual run endpoint enforces tenant cooldown and returns `429` with `retryAfterSeconds` while active

## Metrics Response

`GET /api/v1/outbox/metrics` returns:

- `queuedCount`
- `dispatchedCount`
- `dlqCount`
- `queueCounts` (if queue backend exposes counts)
- `alerts` (derived from thresholds)

## Alert Thresholds

Tune using environment variables:

- `OUTBOX_DLQ_WARN_THRESHOLD` (default: `1`)
- `OUTBOX_DLQ_CRITICAL_THRESHOLD` (default: `5`)
- `OUTBOX_QUEUE_WAITING_WARN_THRESHOLD` (default: `50`)

## Incident Handling

1. Check `alerts` from outbox metrics.
2. If DLQ is non-zero, identify impacted `outboxId` from `AuditLog` entries where `entityType = outbox_dlq`.
3. Replay single failed item with:
   - `POST /api/v1/outbox/replay`
   - body: `{ "outboxId": "<value>" }`
4. Re-check metrics:
   - DLQ should stop growing
   - dispatched count should increase
5. If replay fails repeatedly:
   - inspect payload in DLQ `afterSnapshot`
   - verify Redis/event bus health
   - verify worker process stability
6. Check `GET /api/v1/outbox/health`:
   - `status` should be `healthy`
   - if `degraded`/`unhealthy`, inspect Redis connectivity and queue process interface.

## Access Control

Replay endpoint requires:

- Licensed module access
- `m0_ai_native_core` feature flag enabled
- Permission: `crm:outbox:replay` or `crm:admin`

## Cache Notes

- Metrics endpoint uses short TTL cache (15 seconds) for high-frequency polling.
- Health endpoint uses very short TTL cache (5 seconds) for frequent readiness probes.
- Outbox enqueue/dispatch/DLQ/replay paths invalidate tenant outbox caches automatically.
- Manual reconciliation endpoint uses a tenant-scoped cooldown cache key to prevent over-triggering.

## Index and Query Validation

Run these SQL checks in your database console to validate query performance:

```sql
-- Fast-path index checks for outbox/audit queries
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'AuditLog'
  AND (
    indexdef ILIKE '%tenantId%'
    OR indexdef ILIKE '%entityType%'
    OR indexdef ILIKE '%timestamp%'
  );

-- Sample explain for outbox metrics count query
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM "AuditLog"
WHERE "tenantId" = '<TENANT_ID>'
  AND "entityType" = 'outbox_event';
```

Target: index-backed plans with low latency under production cardinality.

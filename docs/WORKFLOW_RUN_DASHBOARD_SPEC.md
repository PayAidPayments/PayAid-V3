# Workflow Run Dashboard Spec (M0/M1 Ops)

Implementation-ready spec for a dashboard showing workflow run outcomes: success, failure, retry, and error patterns.

---

## 1) Goal

Provide operators a tenant-scoped view of automation reliability so they can quickly identify:

- failing workflows
- retry-heavy workflows
- rising error trends
- queue/dispatch bottlenecks

## 2) Suggested Location

- Module: CRM operations surface (alongside existing outbox ops)
- Candidate route: `crm/[tenantId]/WorkflowOps` (or expand existing ops page)
- UI pattern: follow shared `StatCard` / `ChartCard` layout and right-side page AI assistant rules

## 3) Core Metrics (Band 0 / KPI)

- Total runs (window)
- Success count + success rate
- Failed count + failure rate
- Retried runs count
- Median run duration (ms)
- p95 run duration (ms)

## 4) Breakdown Panels (Band 3/4)

- By workflow:
  - run count
  - success/failure counts
  - retry count
  - last run timestamp
- By status trend (time bucket):
  - success/failure over time (hour/day buckets)
- Top error signatures:
  - normalized error code/message
  - count
  - last seen timestamp

## 5) API Contract (suggested)

Create read-only endpoint:

- `GET /api/v1/workflows/runs/metrics`

Query params:

- `windowDays` (default 7, max 90)
- `workflowId` (optional filter)

Suggested response shape:

```json
{
  "schema_version": "1.0",
  "tenant_id": "tn_1",
  "as_of": "2026-04-07T12:00:00.000Z",
  "window_days": 7,
  "totals": {
    "runs": 120,
    "success": 98,
    "failed": 22,
    "retried": 14,
    "success_rate": 0.8167,
    "median_duration_ms": 420,
    "p95_duration_ms": 1400
  },
  "by_workflow": [
    {
      "workflow_id": "wf_1",
      "workflow_name": "Lead follow-up",
      "runs": 60,
      "success": 50,
      "failed": 10,
      "retried": 8,
      "last_run_at": "2026-04-07T11:58:00.000Z"
    }
  ],
  "trend": [
    { "bucket_start": "2026-04-07T00:00:00.000Z", "success": 20, "failed": 4 }
  ],
  "top_errors": [
    {
      "signature": "EMAIL_PROVIDER_TIMEOUT",
      "count": 7,
      "last_seen_at": "2026-04-07T11:52:00.000Z"
    }
  ]
}
```

## 6) Data Sources

- `WorkflowExecution` table for run state/duration/result
- `AuditLog` for workflow action trails if needed for enrichment
- optional outbox metrics for correlation (already available in outbox ops endpoints)

## 7) Reliability + Security

- Tenant isolation required on all metrics queries.
- Permission gate: `crm:audit:read` or `crm:admin`.
- Feature flag gate: `m0_ai_native_core` (or dedicated ops flag if preferred).

## 8) Testing Plan

- Route tests:
  - auth/permission/feature-gate behavior
  - empty data window
  - non-empty metrics aggregation
- Contract tests:
  - response schema parse
- Reconciliation tests:
  - totals vs grouped rows (sum checks)

## 9) Exit Criteria for Dashboard Ship

- Metrics endpoint returns stable tenant-scoped aggregates.
- UI cards/charts render no-data and error states cleanly.
- At least one runbook links to dashboard for incident triage.


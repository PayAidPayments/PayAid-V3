# Distributed Tracing Plan (Signals -> Workflow -> Actions)

Implementation plan for end-to-end tracing across M0/M1 automation flows.

---

## 1) Goal

Trace a single business event through:

- signal ingest
- workflow selection/execution
- action dispatch/outbox publish
- downstream completion/failure

Primary key: **`trace_id`** (already present in event envelope contracts where applicable).

## 2) Trace Propagation Rules

- If request contains `trace_id`, preserve it.
- If missing, generate one at ingress (`crypto.randomUUID()` style).
- Propagate `trace_id` through:
  - API request context
  - workflow execution records
  - outbox payload metadata
  - audit snapshots (`afterSnapshot.trace_id` when relevant)

## 3) Instrumentation Points

Minimum spans/events:

1. `signal.ingest`
2. `workflow.match`
3. `workflow.execution.start`
4. `workflow.execution.action.*` (one per action)
5. `outbox.enqueue`
6. `outbox.dispatch`
7. `workflow.execution.complete` / `workflow.execution.fail`

## 4) Storage / Query Model

Short term (no vendor lock-in):

- Store trace metadata in existing records:
  - `AuditLog.afterSnapshot.trace_id`
  - `WorkflowExecution.result.trace_id`
  - outbox event payload metadata
- Add lightweight trace query endpoint:
  - `GET /api/v1/traces/:traceId`
  - returns ordered events with timestamps/status

Long term (optional):

- Export spans to OTEL collector / APM backend.

## 5) API Contract (suggested)

`GET /api/v1/traces/:traceId`

```json
{
  "schema_version": "1.0",
  "trace_id": "tr_123",
  "tenant_id": "tn_1",
  "events": [
    { "ts": "2026-04-07T12:00:00.000Z", "stage": "signal.ingest", "status": "ok", "meta": {} },
    { "ts": "2026-04-07T12:00:01.000Z", "stage": "workflow.match", "status": "ok", "meta": { "workflow_id": "wf_1" } },
    { "ts": "2026-04-07T12:00:04.000Z", "stage": "outbox.dispatch", "status": "ok", "meta": { "event_id": "obx_1" } }
  ]
}
```

## 6) Security and Access

- Tenant-scoped trace visibility only.
- Permissions: `crm:audit:read` or `crm:admin`.
- Redact PII in trace metadata before returning API payloads.

## 7) Testing Plan

- Contract tests for trace response schema.
- Route tests:
  - not found trace id
  - tenant isolation
  - permission denied
- Reconciliation test:
  - event ordering and presence of mandatory stages.

## 8) Rollout

1. Add trace generation + propagation in ingest/execution/outbox paths.
2. Ship trace query endpoint behind feature flag.
3. Add ops UI panel “Trace lookup” by `trace_id`.
4. Expand to optional OTEL export.


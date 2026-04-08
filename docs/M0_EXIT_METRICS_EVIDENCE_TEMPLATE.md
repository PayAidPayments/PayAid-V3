# M0 Exit Metrics Evidence Template

Use this to capture proof when closing **M0 Exit Criteria** in staging or production.

---

## 1) Context

- **Environment**: staging / production
- **Tenant ID**: `tn_...`
- **Date/time (UTC)**: `YYYY-MM-DD HH:mm`
- **Operator**: `name`

---

## 2) API evidence (preferred)

Endpoint:
- `GET /api/v1/m0/exit-metrics`

Automation option (writes timestamped JSON artifact):

```bash
PAYAID_BASE_URL=https://<env-host> \
PAYAID_TENANT_ID=tn_... \
PAYAID_AUTH_TOKEN=<jwt> \
npm run collect:m0:exit-evidence
```

Optional envs:
- `M0_WINDOW_DAYS` (default `7`)
- `M0_SIGNAL_SAMPLE` (default `100`)
- `M0_EVIDENCE_DIR` (default `docs/evidence/m0-exit-metrics`)

Recommended params:
- `windowDays=7` (or 14/30 for larger samples)
- `signalSample=100` (increase to 300–500 for noisier tenants)

Record the full JSON response (paste below or save as an artifact):

```json
{
  "window_days": 7,
  "active_workflows_count": 0,
  "audit": { "capture_ratio": null },
  "latency": { "median_signal_to_first_workflow_audit_ms": null },
  "criteria": { "all_met_strict": false }
}
```

What to highlight in the JSON:
- `active_workflows_count` and `criteria.active_workflows_met`
- `audit.capture_ratio` and `audit.capture_met`
- `latency.median_signal_to_first_workflow_audit_ms` and `criteria.median_latency_met`
- `criteria.all_met_strict` (or `all_met_latency_na_ok` if you are explicitly accepting latency N/A)

---

## 3) SQL evidence (optional)

### Active workflows (must be ≥ 3)

```sql
SELECT count(*) AS active_workflows_count
FROM "Workflow"
WHERE "tenantId" = $1 AND "isActive" = true;
```

### Audit capture ratio components

```sql
-- Signals (audit)
SELECT count(*) AS signal_audit_entries
FROM "AuditLog"
WHERE "tenantId" = $1
  AND "entityType" = 'signal'
  AND "timestamp" >= now() - ($2 || ' days')::interval;

-- Workflows (audit)
SELECT count(*) AS workflow_audit_entries
FROM "AuditLog"
WHERE "tenantId" = $1
  AND "entityType" = 'workflow'
  AND "timestamp" >= now() - ($2 || ' days')::interval;

-- Workflow executions (for denominator; exclude test runs per app logic)
SELECT count(*) AS workflow_execution_rows
FROM "WorkflowExecution"
WHERE "tenantId" = $1
  AND "startedAt" >= now() - ($2 || ' days')::interval;
```

---

## 4) Decision / sign-off

- **Criteria met?** yes/no
- **Notes**: (any anomalies, sample-size concerns, planned follow-ups)


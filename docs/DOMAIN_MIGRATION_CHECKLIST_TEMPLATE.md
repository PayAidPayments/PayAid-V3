# Domain Migration Checklist Template

Use this template for any schema/data migration tied to a new or updated domain module.

---

## 1) Scope and Ownership

- [ ] Migration owner assigned (engineering + reviewer).
- [ ] Module/domain name defined (e.g., CRM Unibox, Revenue IQ, HR Payroll).
- [ ] Environments in scope confirmed (dev, staging, production).
- [ ] Rollout window and freeze constraints documented.

## 2) Schema and Data Plan

- [ ] Tables/columns/indexes/constraints listed with rationale.
- [ ] Backfill requirements documented (if existing rows need transformation).
- [ ] RLS/policy impact assessed (new tables and changed tables).
- [ ] Query/index impact reviewed for key read/write paths.
- [ ] Estimated runtime and lock risk documented.

## 3) Backward Compatibility

- [ ] API/contract compatibility defined during rollout window.
- [ ] App behavior when migration is partially applied is documented.
- [ ] Feature flags selected for staged enablement (tenant-aware).
- [ ] Read/write paths tolerate null/default values until backfill completes.

## 4) Pre-Deploy Checks

- [ ] `prisma migrate status` reviewed on target environment.
- [ ] Migration SQL reviewed by at least one engineer.
- [ ] Dry run performed in dev/staging with realistic row counts.
- [ ] Rollback/mitigation plan documented (forward-fix steps preferred).

## 5) Deploy Execution

- [ ] Run migrations (`npx prisma migrate deploy`) in target environment.
- [ ] Run `npx prisma generate` if runtime/client mismatch is possible.
- [ ] Apply feature flags in planned order (internal -> pilot -> broader tenants).
- [ ] Capture deploy evidence (timestamp, migration IDs, operator).

## 6) Post-Deploy Validation

- [ ] API route smoke checks pass for impacted module endpoints.
- [ ] Contract tests and critical integration tests pass.
- [ ] Metrics/alerts checked (errors, p95 latency, queue lag, failed jobs).
- [ ] Tenant isolation verified (cross-tenant reads/writes blocked).
- [ ] Audit events verified for key mutations and AI decisions.

## 7) Data Quality and Reconciliation

- [ ] KPI totals reconcile with source-of-truth entities.
- [ ] Backfill completeness validated with SQL checks.
- [ ] No duplicate rows from retries/idempotency behavior.
- [ ] Sampling performed across at least two tenants (where applicable).

## 8) Sign-Off and Follow-Ups

- [ ] Product/engineering sign-off recorded.
- [ ] Runbook/checklist links updated in module docs.
- [ ] Known limitations and follow-up tasks added to backlog.
- [ ] Checklist evidence archived (queries, screenshots, API JSON).

---

## Optional SQL Evidence Snippets

```sql
-- 1) Confirm migrations applied
SELECT migration_name, finished_at
FROM "_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 20;

-- 2) Row count sanity for a new table
SELECT count(*) FROM "NewTable";

-- 3) Cross-tenant leakage sanity (example pattern)
-- Replace table + tenant columns as needed
SELECT "tenantId", count(*)
FROM "NewTable"
GROUP BY "tenantId"
ORDER BY count(*) DESC;
```


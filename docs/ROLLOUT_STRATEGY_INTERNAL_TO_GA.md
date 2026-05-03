# Staged Rollout Strategy (Internal -> Pilot -> GA)

Use this for new module/API launches (especially `/api/v1` surfaces and AI-assisted features).

---

## Phase 0: Internal

Goal: verify correctness with the team before exposing to customer tenants.

- Enable feature flag for internal/test tenants only.
- Run smoke checks (`test:m0` / module-specific route smokes).
- Validate audit logs, tenant isolation, and idempotency behavior.
- Confirm dashboards/UI show expected numbers from source-of-truth entities.

Exit criteria:
- No P0/P1 defects.
- Error rate and latency are within acceptable baseline.

## Phase 1: Pilot Tenants

Goal: gather real usage feedback with limited blast radius.

- Select 2-5 pilot tenants (different sizes/use-cases).
- Keep feature behind tenant-aware flag (`on` for pilot only).
- Track adoption + outcome metrics (e.g., usage, acceptance rate, SLA changes).
- Review support tickets and product feedback weekly.

Exit criteria:
- Pilot metrics stable.
- No cross-tenant/security regressions.
- Rollback path validated.

## Phase 2: Broader Rollout

Goal: expand safely while watching quality signals.

- Expand by cohort (e.g., 10% -> 25% -> 50% -> 100% of eligible tenants).
- Monitor p95 latency, error rate, queue lag, and failed jobs.
- Keep kill-switch / feature flag ready for quick disable.

Exit criteria:
- Operational metrics stable for at least one monitoring window.
- No unresolved high-severity incidents.

## Phase 3: General Availability (GA)

Goal: remove rollout friction and treat as standard product behavior.

- Enable feature for all eligible tenants.
- Update docs/runbooks/checklists with final behavior and guardrails.
- Keep post-GA monitoring and incident response ownership defined.

---

## Rollback / Mitigation

- Fast rollback path: disable tenant feature flag.
- If migration/data issue: pause rollout, apply forward-fix, then re-enable by cohort.
- Capture incident timeline, root cause, and permanent fixes.

## Evidence to Archive per Phase

- Feature flag state by tenant cohort.
- Smoke test outputs and API evidence JSON.
- Monitoring snapshots (error rate, latency, queue health).
- Sign-off note from engineering + product owners.


# Canonical Module API Cutover Execution Worksheet

Use this worksheet to execute and sign off `CANONICAL_MODULE_API_ONLY` rollout.

Staging runtime capture template: `docs/CANONICAL_MODULE_API_STAGING_RUNTIME_EVIDENCE_SHEET.md`

## 1) Staging Validation (`CANONICAL_MODULE_API_ONLY=1`)

| Field | Value |
|---|---|
| Run date | 2026-04-23 (Pass 1) |
| Environment | staging |
| Flag value | `CANONICAL_MODULE_API_ONLY=1` |
| Executor | Phani |
| Reviewer | Phani |
| Evidence artifact folder | `docs/evidence/closure/` (`2026-04-23-canonical-cutover-execution-pass-1.md`) |
| Staging runtime evidence artifact | `docs/evidence/closure/2026-04-23-canonical-staging-runtime-evidence.md` |
| Staging runtime autofill command | `npm run apply:canonical-staging-runtime-artifact` |
| Staging env setup helper | `docs/CANONICAL_STAGING_ENV_TEMPLATE.md` |

### Required command evidence

- [x] `npm run check:canonical-module-api-contract`
- [x] `npm run check:canonical-module-api-post-cutover`
- [x] `npm run check:canonical-module-api-response-snapshots`
- [x] `npm run check:canonical-module-api-consumer-usage`
- [ ] `npm run check:canonical-module-api-readiness-verdict`

### Runtime validation checklist (staging)

- [ ] `/api/modules` returns canonical-only shape (no legacy top-level aliases).
- [ ] `/api/industries/[industry]/modules` returns canonical-only shape.
- [ ] `/api/industries/[industry]/modules` POST returns canonical-only shape.
- [ ] `/api/industries/custom/modules` POST returns canonical-only shape.
- [ ] `/api/ai/analyze-industry` returns canonical-only shape.
- [ ] Industry onboarding flows complete without parser/client errors.
- [ ] Module catalog pages and switcher UX render without missing-data regressions.
- [ ] Optional automated pre-pass executed via `npm run check:canonical-staging-runtime`.
- [ ] Latest automated pre-pass artifact reviewed (`docs/evidence/closure/2026-04-23T10-04-35-509Z-canonical-staging-runtime-checks.json`) and blockers resolved.

## 2) Production Enablement Plan

| Field | Value |
|---|---|
| Approval owner | Phani |
| Rollout owner | Phani |
| Rollback owner | Phani |
| Planned rollout window | [YYYY-MM-DD hh:mm - hh:mm TZ] |
| Rollback trigger threshold | Any Sev-1/Sev-2 or >2% new endpoint errors |
| Rollback action | Set `CANONICAL_MODULE_API_ONLY=0` (or unset) and redeploy |

### Approvals

- [ ] Product approval recorded
- [ ] Engineering approval recorded
- [ ] QA approval recorded
- [ ] Rollback owner acknowledgment recorded

Approval record:

- Date/time: [YYYY-MM-DD hh:mm TZ]
- Decision: [Approved / Hold]
- Notes: [paste summary]

## 3) Post-enable 24h Monitoring

| Time bucket | API errors | Client errors | User impact reports | Status | Notes |
|---|---:|---:|---:|---|---|
| 0-2h | [count] | [count] | [count] | [ok/issue] | [notes] |
| 2-6h | [count] | [count] | [count] | [ok/issue] | [notes] |
| 6-12h | [count] | [count] | [count] | [ok/issue] | [notes] |
| 12-24h | [count] | [count] | [count] | [ok/issue] | [notes] |

Final monitoring conclusion:

- [ ] No critical issues detected in 24h window
- [ ] Any issues resolved or rollback executed
- [ ] Canonical-only mode remains enabled after review

## 4) Closure Mapping to Readiness Checklist

Mark these only after evidence is attached:

- [ ] `Staging passed with CANONICAL_MODULE_API_ONLY=1`
- [ ] `Production enablement plan approved (owner + window + rollback owner)`
- [ ] `Post-enable 24-hour monitoring completed with no critical issues`

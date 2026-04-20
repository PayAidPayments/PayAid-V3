# Inbound pilot - PR copy pack (2026-04-20)

Use this as a ready-to-paste PR body for inbound pilot release-gate closeout.

Generated body files for CLI usage:
- `docs/evidence/pilot/2026-04-20-inbound-pilot-pr-body.long.md`
- `docs/evidence/pilot/2026-04-20-inbound-pilot-pr-body.short.md`

## Suggested PR title

`crm: close inbound pilot gate with hosted/local evidence`

## Suggested PR body

```md
## Summary
- Close inbound pilot gate coverage for B3/E3/E4 with local + hosted evidence and canonical handoff index.
- Align smoke/verify tenant resolution (`id|slug|subdomain`) and unify smoke/verify Prisma client path with app orchestration runtime.
- Finalize docs/runbook/go-no-go references so release handoff points to one canonical evidence bundle.

## Validation
- [x] `npm run test:m2:smoke -- --testPathPattern="m2-crm-inbound-routing-decisions-route|m2-crm-inbound-orchestration-logs-route|m2-crm-lead-routing-get-route|m2-module-license-filter"` (4 suites / 11 tests passed)
- [x] `npm run smoke:inbound-pilot:local -- --tenant=demo` (PASS)
- [x] `npx tsx scripts/verify-inbound-pilot-smoke.ts --tenant=demo` (PASS)
- [x] `npm run smoke:inbound-pilot -- --tenant=sample` (hosted PASS)
- [x] `npx tsx scripts/verify-inbound-pilot-smoke.ts --tenant=sample` (hosted PASS)
- [x] `npm run typecheck:dashboard` (exit 0)

## Evidence
- Canonical bundle: `docs/evidence/pilot/2026-04-20-inbound-pilot-evidence-index.md`
- Local smoke: `docs/evidence/pilot/2026-04-20-inbound-smoke-local.md`
- Local DB verify: `docs/evidence/pilot/2026-04-20-inbound-db-verify-local.md`
- Hosted smoke: `docs/evidence/pilot/2026-04-20-inbound-smoke-hosted.md`
- Hosted DB verify: `docs/evidence/pilot/2026-04-20-inbound-db-verify-hosted.md`
- E4 checklist: `docs/evidence/pilot/2026-04-20-inbound-ui-qa.md`
- E4 automation rerun: `docs/evidence/pilot/2026-04-20-inbound-e4-automation-suite.md`
- Superseded blocker reference: `docs/evidence/pilot/2026-04-20-inbound-smoke-hosted-blocker.md`

## Non-goals / scope
- Does not close CRM GA Day 2-Day 10 queue.
- Does not change hosted CRM speed guardrail claim (`p95 <= 300ms`) status.
```

## Suggested short PR body

```md
## Summary
- Close inbound pilot gate evidence for B3/E3/E4 with local + hosted artifacts.
- Unify smoke/verify scripts on shared Prisma client path (`lib/db/prisma`) to match runtime datasource behavior.

## Validation
- [x] M2 pilot contract tests: 4 suites / 11 passed
- [x] Local smoke + verify (`--tenant=demo`) passed
- [x] Hosted smoke + verify (`--tenant=sample`) passed
- [x] `npm run typecheck:dashboard` passed

## Evidence
- `docs/evidence/pilot/2026-04-20-inbound-pilot-evidence-index.md`
- `docs/evidence/pilot/2026-04-20-inbound-smoke-hosted.md`
- `docs/evidence/pilot/2026-04-20-inbound-db-verify-hosted.md`
- `docs/evidence/pilot/2026-04-20-inbound-ui-qa.md`

## Scope note
- GA Day 2-Day 10 queue and hosted speed SLO claim remain out of scope for this PR.
```

## Suggested merge commit (long)

```md
crm: close inbound pilot release gate (B3/E3/E4)

- Local + hosted smoke evidence captured (`--tenant=demo` local, `--tenant=sample` hosted).
- Smoke/verify tenant resolution accepts id | slug | subdomain.
- Smoke/verify scripts unified on shared `lib/db/prisma` to match runtime datasource path.
- M2 route tests cover decisions GET, orchestration logs GET, lead-routing GET (pilotInbound),
  and module license filter (4 suites / 11 tests passing).
- E4 checklist, automation rerun, and canonical evidence index added.

Out of scope:
- CRM GA Day 2-Day 10 queue
- Hosted CRM speed guardrail claim (`p95 <= 300ms`) status change

Evidence index: `docs/evidence/pilot/2026-04-20-inbound-pilot-evidence-index.md`
```

## Suggested merge commit (short)

```md
crm: close inbound pilot release gate with hosted/local evidence

Evidence index: `docs/evidence/pilot/2026-04-20-inbound-pilot-evidence-index.md`
```

## Handoff commands (copy/paste)

```bash
# 1) Create PR with long body file (swap to *.short.md if preferred)
gh pr create \
  --title "crm: close inbound pilot gate with hosted/local evidence" \
  --body-file docs/evidence/pilot/2026-04-20-inbound-pilot-pr-body.long.md

# 2) Merge with squash + merge-commit text from this file (edit message in editor)
gh pr merge --squash

# 3) Post-merge quick verification pointers
echo "Evidence index: docs/evidence/pilot/2026-04-20-inbound-pilot-evidence-index.md"
echo "GO/NO-GO row: docs/CRM_MODULE_FEATURE_GO_NO_GO_2026-04-17.md"
```


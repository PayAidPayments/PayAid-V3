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

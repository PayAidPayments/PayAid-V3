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

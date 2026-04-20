# Inbound pilot - canonical evidence index (2026-04-20)

Use this file as the single handoff/source-of-truth pointer for the v1 pilot gate package.

## Core gate artifacts

- DB verify (local): `2026-04-20-inbound-db-verify-local.md`
- Smoke (local): `2026-04-20-inbound-smoke-local.md`
- DB verify (hosted): `2026-04-20-inbound-db-verify-hosted.md`
- Smoke (hosted): `2026-04-20-inbound-smoke-hosted.md`
- E4 checklist + status: `2026-04-20-inbound-ui-qa.md`
- E4 automation rerun: `2026-04-20-inbound-e4-automation-suite.md`

## Supporting artifacts

- Hosted blocker (superseded): `2026-04-20-inbound-smoke-hosted-blocker.md`
- PR copy template: `2026-04-20-inbound-pilot-pr-copy-pack.md`
- Merge-commit suggestions + handoff commands: `2026-04-20-inbound-pilot-pr-copy-pack.md`
- PR body (long): `2026-04-20-inbound-pilot-pr-body.long.md`
- PR body (short): `2026-04-20-inbound-pilot-pr-body.short.md`
- Runbook (commands): `RUNBOOK.md`
- UI checklist template: `INBOUND_UI_QA_CHECKLIST.template.md`

## Current gate state

- B3 replay proof: PASS (local + hosted smoke artifacts above)
- E3 decisions API contract: PASS (M2 route tests in E4 automation artifact)
- E4 evidence package: PASS (automation complete; manual screenshots optional)
- Hosted runtime smoke: PASS (`--tenant=sample`)

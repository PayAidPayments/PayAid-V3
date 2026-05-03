# Email Readiness Evidence

This folder stores timestamped artifacts for PayAid Mail production readiness checks.

## Primary command

Run from repository root:

- `npm run check:email-precheck-env` (safe env readiness check; no secrets printed)
- `npm run verify:email-prod-readiness`
- `npm run verify:email-go-live-precheck` (runs migration status + readiness check and writes consolidated gate report)
- `npm run verify:email-go-live-gated-precheck` (runs env preflight first; skips heavy precheck when env is not ready)
- `npm run capture:email-db-state` (captures DB connectivity, `_prisma_migrations` history, and required email table presence)
- `npm run check:email-step41-smoke-env` (checks required env for authenticated Step 4.1 runtime smoke)
- `npm run smoke:email-step41-runtime` (authenticated API smoke for Step 4.1 campaign progress/failed-jobs/retry-history)
- `npm run run:email-step41-auth-smoke-pipeline` (best-effort auto-resolve tenant/campaign/token, then runs Step 4.1 smoke commands)

Local fallback command:

- `npm run verify:email-prod-readiness:local`

## Artifact outputs

Each run writes:

- `<timestamp>-email-precheck-env-readiness.md`
- `<timestamp>-email-prod-readiness.json`
- `<timestamp>-email-prod-readiness.md`
- `<timestamp>-email-go-live-precheck.md` (consolidated precheck report)
- `<timestamp>-email-go-live-gated-precheck.md` (fail-fast precheck report)
- `<timestamp>-email-db-state.md`
- `<timestamp>-email-db-state.json`
- `<timestamp>-email-step41-smoke-env-readiness.md`
- `<timestamp>-email-step41-runtime-smoke.md`
- `<timestamp>-email-step41-auth-smoke-pipeline.md`

Supporting runbook:

- `docs/evidence/email/EMAIL_PRECHECK_BLOCKER_TRIAGE.md`
- `docs/evidence/email/STEP41_SMOKE_ENV_SETUP_TEMPLATE.md`

## Pass criteria

A run is considered ready when all are true:

- Redis TCP is reachable via `REDIS_URL`.
- Database is reachable via `DATABASE_URL`.
- Required tables are present:
  - `EmailSendJob`
  - `EmailTrackingEvent`
  - `EmailSyncCheckpoint`
  - `EmailDeliverabilityLog`
  - `EmailCampaignSenderPolicy`

If any criterion fails, the script exits with non-zero status and the markdown artifact explains why.


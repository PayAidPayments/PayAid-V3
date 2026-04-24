# Email Readiness Evidence

This folder stores timestamped artifacts for PayAid Mail production readiness checks.

## Primary command

Run from repository root:

- `npm run check:email-precheck-env` (safe env readiness check; no secrets printed)
- `npm run verify:email-prod-readiness`
- `npm run verify:email-go-live-precheck` (runs migration status + readiness check and writes consolidated gate report)
- `npm run verify:email-go-live-gated-precheck` (runs env preflight first; skips heavy precheck when env is not ready)
- `npm run capture:email-db-state` (captures DB connectivity, `_prisma_migrations` history, and required email table presence)

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

Supporting runbook:

- `docs/evidence/email/EMAIL_PRECHECK_BLOCKER_TRIAGE.md`

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


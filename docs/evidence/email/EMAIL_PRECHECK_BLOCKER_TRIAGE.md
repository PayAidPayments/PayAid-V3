# Email Precheck Blocker Triage

Use this when `npm run verify:email-go-live-gated-precheck` fails and Step 4.1.a cannot pass.

## 1) Capture command evidence

Run:

- `npm run check:email-precheck-env`
- `npm run verify:email-go-live-gated-precheck`

Attach:

- `docs/evidence/email/*-email-precheck-env-readiness.md`
- `docs/evidence/email/*-email-go-live-precheck.md`
- Referenced readiness artifact (`*-email-prod-readiness.md`)
- `docs/evidence/email/*-email-db-state.md` (when migration/table evidence is needed)

## 2) Classify blocker type

### A. Migration reachability failure (`db:migrate:status`)

Typical signs:

- `P1001: Can't reach database server`
- Connection reset/timeouts against configured datasource host

Immediate checks:

- Run `npm run check:email-precheck-env` to verify shell-level env presence/shape first.
- Confirm shell has expected `.env`/runtime env loaded.
- Confirm outbound network path to DB host:port is available from this machine/runner.
- Re-run `npm run db:migrate:status` after network/env correction.

### B. Runtime readiness failure (`verify:email-prod-readiness`)

Typical signs:

- `REDIS_URL` missing/invalid
- `DATABASE_URL` missing
- Required email tables reported missing

Immediate checks:

- Run `npm run check:email-precheck-env` and confirm both endpoints are present and valid.
- Confirm `REDIS_URL` and `DATABASE_URL` are present in current shell context.
- If `UPSTASH_REDIS_REST_URL` is present but `REDIS_URL` is missing, set TCP Redis URL explicitly for Bull/worker path (REST credentials alone are not sufficient for this gate).
- Re-run `npm run verify:email-prod-readiness`.
- Run `npm run capture:email-db-state` to capture `_prisma_migrations` and email table existence directly from DB.
- If DB connects but tables missing, run migration deployment in target environment and rerun precheck.

## 3) QA status mapping

- Step 4.1.a: `FAIL` when any precheck gate fails.
- Step 4.1 to 4.5: mark `NOT AVAILABLE` until Step 4.1.a passes.
- Consolidated release recommendation: `No-Go` while Step 4.1.a fails.

## 4) Ready-to-proceed condition

Proceed to Step 4.1 functional QA only when:

- `npm run verify:email-go-live-gated-precheck` exits `0`
- Generated precheck artifact shows both gates `PASS`

## 5) Optional Step 4.1 API smoke assist

Before screenshot-based QA, you can run:

- `npm run check:email-step41-smoke-env`
- `npm run smoke:email-step41-runtime`

Required env:

- `BASE_URL`
- `TENANT_ID`
- `AUTH_TOKEN`
- `EMAIL_CAMPAIGN_ID`

Optional:

- `EMAIL_RETRY_JOB_ID` (to include a single-retry API call)


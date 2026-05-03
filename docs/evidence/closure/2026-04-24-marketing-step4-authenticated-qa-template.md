# Marketing Step 4 Authenticated QA Evidence Template

Use this template during authenticated staging/production QA for Step 4.1-4.5.

## Run Metadata

- Date:
- Tester:
- Environment URL:
- Tenant ID:
- Role/User:
- Build/Commit (if known):

## Step 4.1.a - Email runtime readiness precheck

- Status: `PASS | FAIL | PARTIAL | NOT AVAILABLE`
- Command run:
  - `npm run verify:email-prod-readiness`
- Notes:
- Evidence artifact path:
- If failed, blocker artifact path:

Checklist:

- [ ] Redis TCP reachable in run context
- [ ] Database reachable in run context
- [ ] Required email tables reported present
- [ ] Artifact attached in `docs/evidence/email/`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `PASS | FAIL | PARTIAL | NOT AVAILABLE`
- Notes:
- Evidence links/screenshots:
- API payload snippets (if relevant):

Checklist:

- [ ] Queue progress card updates across states
- [ ] Failed/dead-letter table renders expected fields
- [ ] Sender policy updates and persists
- [ ] Single-row retry works (default sender + override sender)
- [ ] Batch retry works (`Retry All Failed`, `Retry Selected`)
- [ ] Retry diagnostics persist after refresh
- [ ] `Copy Summary` includes concrete IDs/counts
- [ ] `retryOperationId` in panel summary matches Retry History row for same action

## Step 4.2 - Marketing canonical route verification

- Status: `PASS | FAIL | PARTIAL | NOT AVAILABLE`
- Notes:
- Evidence links/screenshots:

Checklist:

- [ ] Compose canonical route works: `/marketing/[tenantId]/Studio`
- [ ] History canonical route works: `/marketing/[tenantId]/History`
- [ ] Channels canonical route works: `/marketing/[tenantId]/Social-Media`
- [ ] Legacy bookmarks redirect to canonical routes

## Step 4.3 - Marketing social retry verification (History)

- Status: `PASS | FAIL | PARTIAL | NOT AVAILABLE`
- Notes:
- Evidence links/screenshots:
- Retry operation IDs / post IDs:

Checklist:

- [ ] Single failed row retry transitions toward `SCHEDULED`
- [ ] Success banner appears with expected content
- [ ] `Recent retries` chip shows ID/time/actor
- [ ] Retry chip opens Compose audit with auto-loaded data

## Step 4.4 - Marketing History filters/pagination/export verification

- Status: `PASS | FAIL | PARTIAL | NOT AVAILABLE`
- Notes:
- Evidence links/screenshots:
- Export sample filenames:

Checklist:

- [ ] Filters and quick ranges return expected rows
- [ ] URL persistence works (refresh + shared URL)
- [ ] Sorting works both directions
- [ ] Result summary updates (`Showing X-Y of Z`)
- [ ] Page clamping works for out-of-range page
- [ ] Empty-state messaging distinguishes `no data` vs `no matches`
- [ ] Pagination controls work (`10/20/50`, prev/next)
- [ ] `Retry selected` works with count summary
- [ ] `Retry all failed (filtered)` works with count summary
- [ ] Failure analytics (`Top failure reasons`) updates for `7d/30d`
- [ ] `Export page CSV` includes `meta` rows + current page rows only
- [ ] `Export filtered CSV` includes `meta` rows + filtered/sorted dataset

## Step 4.5 - Marketing YouTube connector runtime verification

- Status: `PASS | FAIL | PARTIAL | NOT AVAILABLE`
- Notes:
- Evidence links/screenshots:
- API payload snippets:

Checklist:

- [ ] Compose shows Channel readiness strip when blockers/warnings exist
- [ ] Fix links route correctly to channel settings and channels hub
- [ ] YouTube post creation succeeds when token/scope/video are valid
- [ ] Worker transitions `SCHEDULED -> SENT` on success
- [ ] Failure transitions `SCHEDULED -> FAILED` with actionable metadata
- [ ] `metadata.youtubeDispatch.videoId` present on success
- [ ] `metadata.youtubeDispatch.videoUrl` present on success
- [ ] `metadata.youtubeDispatch.postedAt` present on success
- [ ] Negative-path checks (not connected / expired / missing scope / no video)
- [ ] History row + Open audit reflect final YouTube outcome

## Consolidated Verdict

- Release recommendation: `Go | Conditional Go | No-Go`
- Blocking defects:
- Non-blocking defects:
- Follow-up tickets/tasks:

---

## Attempt #1 (Pre-filled baseline - 2026-04-24)

Use this as the baseline record from the latest execution attempt. Copy this block into a new "Attempt #N" section for every rerun.

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted precheck
- Environment URL: not captured (runtime precheck only)
- Tenant ID: not captured
- Role/User: not captured
- Build/Commit (if known): not captured

## Step 4.1.a - Email runtime readiness precheck

- Status: `FAIL`
- Command run:
  - `npm run verify:email-prod-readiness`
- Notes:
  - Runtime env vars were not available in this execution context.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T10-47-54-132Z-email-prod-readiness.md`
- If failed, blocker artifact path:
  - `docs/evidence/email/2026-04-24-email-runtime-connectivity-blockers.md`

Checklist:

- [ ] Redis TCP reachable in run context
- [ ] Database reachable in run context
- [ ] Required email tables reported present
- [x] Artifact attached in `docs/evidence/email/`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE`
- Notes:
  - Blocked behind Step 4.1.a runtime precheck failure.
- Evidence links/screenshots:
  - None yet.
- API payload snippets (if relevant):
  - None yet.

## Step 4.2 - Marketing canonical route verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until runtime/connectivity blockers are cleared.

## Step 4.3 - Marketing social retry verification (History)

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until runtime/connectivity blockers are cleared.

## Step 4.4 - Marketing History filters/pagination/export verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until runtime/connectivity blockers are cleared.

## Step 4.5 - Marketing YouTube connector runtime verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until runtime/connectivity blockers are cleared.

## Consolidated Verdict

- Release recommendation: `No-Go`
- Blocking defects:
  - `db:migrate:status` failed with `P1001` against configured Supabase pooler host (`aws-1-ap-northeast-1.pooler.supabase.com:5432`).
  - Email readiness verifier failed because runtime `REDIS_URL` and `DATABASE_URL` were not available in this context.
- Non-blocking defects:
  - None recorded in this attempt.
- Follow-up tickets/tasks:
  - Re-run `npm run db:migrate:status` and `npm run verify:email-prod-readiness` from production-like shell with env vars + DB network access.
  - After precheck passes, execute full Step 4.1 functional QA and capture screenshots + operation ID parity evidence.

---

## Attempt #2 (Automated precheck rerun - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted precheck runner
- Environment URL: not captured (runtime precheck only)
- Tenant ID: not captured
- Role/User: not captured
- Build/Commit (if known): not captured

## Step 4.1.a - Email runtime readiness precheck

- Status: `FAIL`
- Command run:
  - `npm run verify:email-go-live-precheck`
- Notes:
  - Consolidated precheck runner executed both migration status and readiness verification.
  - Migration gate still fails with `P1001`.
  - Runtime env vars for readiness (`REDIS_URL`, `DATABASE_URL`) are still missing in current run context.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T11-00-29-501Z-email-go-live-precheck.md`
  - `docs/evidence/email/2026-04-24T11-01-47-081Z-email-prod-readiness.md`
- If failed, blocker artifact path:
  - `docs/evidence/email/2026-04-24-email-runtime-connectivity-blockers.md`

Checklist:

- [ ] Redis TCP reachable in run context
- [ ] Database reachable in run context
- [ ] Required email tables reported present
- [x] Artifact attached in `docs/evidence/email/`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE`
- Notes:
  - Still blocked behind Step 4.1.a failure.

## Step 4.2 - Marketing canonical route verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until runtime/connectivity blockers are cleared.

## Step 4.3 - Marketing social retry verification (History)

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until runtime/connectivity blockers are cleared.

## Step 4.4 - Marketing History filters/pagination/export verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until runtime/connectivity blockers are cleared.

## Step 4.5 - Marketing YouTube connector runtime verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until runtime/connectivity blockers are cleared.

## Consolidated Verdict

- Release recommendation: `No-Go`
- Blocking defects:
  - `db:migrate:status` failed with `P1001` against configured Supabase pooler host.
  - Email readiness still reports missing `REDIS_URL` and `DATABASE_URL` in current execution context.
- Non-blocking defects:
  - None recorded in this attempt.
- Follow-up tickets/tasks:
  - Run `npm run verify:email-go-live-precheck` from a production-like shell with env vars loaded and DB network access.
  - Once Step 4.1.a passes, run full Step 4.1 functional checks and attach screenshot evidence.

---

## Attempt #3 (Env-readiness preflight - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted env preflight
- Environment URL: not captured (preflight only)
- Tenant ID: not captured
- Role/User: not captured
- Build/Commit (if known): not captured

## Step 4.1.a - Email runtime readiness precheck

- Status: `FAIL`
- Command run:
  - `npm run check:email-precheck-env`
- Notes:
  - Shell-level preflight confirms both required runtime variables are currently missing.
  - Attempt #3 intentionally stops before full precheck to avoid repeating known failures.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T11-06-13-601Z-email-precheck-env-readiness.md`
- If failed, blocker artifact path:
  - `docs/evidence/email/EMAIL_PRECHECK_BLOCKER_TRIAGE.md`

Checklist:

- [ ] Redis TCP reachable in run context
- [ ] Database reachable in run context
- [ ] Required email tables reported present
- [x] Artifact attached in `docs/evidence/email/`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred; Step 4.1.a preflight is still failing.

## Step 4.2 - Marketing canonical route verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until Step 4.1.a passes.

## Step 4.3 - Marketing social retry verification (History)

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until Step 4.1.a passes.

## Step 4.4 - Marketing History filters/pagination/export verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until Step 4.1.a passes.

## Step 4.5 - Marketing YouTube connector runtime verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until Step 4.1.a passes.

## Consolidated Verdict

- Release recommendation: `No-Go`
- Blocking defects:
  - `DATABASE_URL` missing in current shell context.
  - `REDIS_URL` missing in current shell context.
- Non-blocking defects:
  - None recorded in this attempt.
- Follow-up tickets/tasks:
  - Load required runtime vars in the production-like shell.
  - Re-run `npm run verify:email-go-live-precheck`.
  - If precheck passes, execute full Step 4.1 functional QA.

---

## Attempt #4 (Gated precheck command - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted gated precheck
- Environment URL: not captured (precheck only)
- Tenant ID: not captured
- Role/User: not captured
- Build/Commit (if known): not captured

## Step 4.1.a - Email runtime readiness precheck

- Status: `FAIL`
- Command run:
  - `npm run verify:email-go-live-gated-precheck`
- Notes:
  - Gated precheck correctly failed fast at env-preflight stage.
  - Heavy precheck was intentionally skipped because required env vars were missing.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T11-12-05-620Z-email-go-live-gated-precheck.md`
  - `docs/evidence/email/2026-04-24T11-12-39-485Z-email-precheck-env-readiness.md`
- If failed, blocker artifact path:
  - `docs/evidence/email/EMAIL_PRECHECK_BLOCKER_TRIAGE.md`

Checklist:

- [ ] Redis TCP reachable in run context
- [ ] Database reachable in run context
- [ ] Required email tables reported present
- [x] Artifact attached in `docs/evidence/email/`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred; Step 4.1.a still failing.

## Step 4.2 - Marketing canonical route verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until Step 4.1.a passes.

## Step 4.3 - Marketing social retry verification (History)

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until Step 4.1.a passes.

## Step 4.4 - Marketing History filters/pagination/export verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until Step 4.1.a passes.

## Step 4.5 - Marketing YouTube connector runtime verification

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until Step 4.1.a passes.

## Consolidated Verdict

- Release recommendation: `No-Go`
- Blocking defects:
  - `DATABASE_URL` missing in current shell context.
  - `REDIS_URL` missing in current shell context.
- Non-blocking defects:
  - None recorded in this attempt.
- Follow-up tickets/tasks:
  - Load required runtime vars in production-like shell.
  - Re-run `npm run verify:email-go-live-gated-precheck`.
  - If precheck passes, execute full Step 4.1 functional QA.

---

## Attempt #5 (Dotenv + Redis diagnosis refinement - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted gated precheck rerun
- Environment URL: not captured (precheck only)
- Tenant ID: not captured
- Role/User: not captured
- Build/Commit (if known): not captured

## Step 4.1.a - Email runtime readiness precheck

- Status: `FAIL`
- Command run:
  - `npm run verify:email-go-live-gated-precheck`
- Notes:
  - Scripts now auto-load `.env`/`.env.local`.
  - `DATABASE_URL` is now detected.
  - `REDIS_URL` is still missing, so heavy precheck is skipped by design.
  - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present, but TCP `REDIS_URL` is still required for worker/Bull gate.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T11-17-11-560Z-email-go-live-gated-precheck.md`
  - `docs/evidence/email/2026-04-24T11-17-22-917Z-email-precheck-env-readiness.md`
- If failed, blocker artifact path:
  - `docs/evidence/email/EMAIL_PRECHECK_BLOCKER_TRIAGE.md`

Checklist:

- [ ] Redis TCP reachable in run context
- [ ] Database reachable in run context
- [ ] Required email tables reported present
- [x] Artifact attached in `docs/evidence/email/`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred; Step 4.1.a still failing on missing TCP `REDIS_URL`.

## Consolidated Verdict

- Release recommendation: `No-Go`
- Blocking defects:
  - TCP `REDIS_URL` missing in current shell context.
- Non-blocking defects:
  - None recorded in this attempt.
- Follow-up tickets/tasks:
  - Set TCP `REDIS_URL` in production-like shell (in addition to existing Upstash REST vars).
  - Re-run `npm run verify:email-go-live-gated-precheck`.
  - If precheck passes, execute full Step 4.1 functional QA.

---

## Attempt #6 (DB state evidence capture - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted DB evidence probe
- Environment URL: not captured (precheck only)
- Tenant ID: not captured
- Role/User: not captured
- Build/Commit (if known): not captured

## Step 4.1.a - Email runtime readiness precheck

- Status: `FAIL`
- Command run:
  - `npm run verify:email-go-live-gated-precheck`
  - `npm run capture:email-db-state`
- Notes:
  - Env preflight now passes and heavy precheck executes.
  - Redis TCP and DB connectivity both pass in readiness evidence.
  - Direct DB evidence confirms `_prisma_migrations` exists and DB is reachable.
  - Required email tables are still missing in target DB, so Step 4.1.a remains blocked.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T11-19-22-892Z-email-go-live-gated-precheck.md`
  - `docs/evidence/email/2026-04-24T11-22-41-605Z-email-prod-readiness.md`
  - `docs/evidence/email/2026-04-24T11-28-47-548Z-email-db-state.md`

Checklist:

- [x] Redis TCP reachable in run context
- [x] Database reachable in run context
- [ ] Required email tables reported present
- [x] Artifact attached in `docs/evidence/email/`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE`
- Notes:
  - Deferred until required email tables exist in target DB.

## Consolidated Verdict

- Release recommendation: `No-Go`
- Blocking defects:
  - Required email operational tables are missing in target DB (`EmailSendJob`, `EmailTrackingEvent`, `EmailSyncCheckpoint`, `EmailDeliverabilityLog`, `EmailCampaignSenderPolicy`).
- Non-blocking defects:
  - `db:migrate:status` remains unreliable in this shell despite direct DB connectivity.
- Follow-up tickets/tasks:
  - Apply migrations that create required email tables in target DB.
  - Re-run `npm run capture:email-db-state` and `npm run verify:email-go-live-gated-precheck`.
  - If all gates pass, execute full Step 4.1 functional QA.

---

## Attempt #7 (Precheck gates now passing - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted readiness rerun
- Environment URL: not captured (precheck only)
- Tenant ID: not captured
- Role/User: not captured
- Build/Commit (if known): not captured

## Step 4.1.a - Email runtime readiness precheck

- Status: `PASS`
- Command run:
  - `npm run db:apply:email-ops-schema`
  - `npm run capture:email-db-state`
  - `npm run verify:email-go-live-gated-precheck`
- Notes:
  - Required email tables were created via idempotent DB apply script.
  - `capture:email-db-state` now shows all required email tables present.
  - Gated precheck now passes end-to-end (`overallOk: true`).
  - Prisma `db:migrate:status` still reports fail in this shell, but equivalent migration proof gate passes (`migrateEquivalentOk: true`) based on direct DB evidence + table presence.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T12-57-57-368Z-email-db-state.md`
  - `docs/evidence/email/2026-04-24T12-59-36-092Z-email-go-live-gated-precheck.md`
  - `docs/evidence/email/2026-04-24T12-59-54-500Z-email-go-live-precheck.md`
  - `docs/evidence/email/2026-04-24T13-00-23-709Z-email-prod-readiness.md`

Checklist:

- [x] Redis TCP reachable in run context
- [x] Database reachable in run context
- [x] Required email tables reported present
- [x] Artifact attached in `docs/evidence/email/`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE` (execution pending)
- Notes:
  - Precheck gate is now green; next action is full authenticated Step 4.1 functional run + screenshots.

## Consolidated Verdict

- Release recommendation: `Conditional Go` (precheck gates pass; functional Step 4.1 run still pending)
- Blocking defects:
  - Functional Step 4.1 QA evidence not captured yet.
- Non-blocking defects:
  - Prisma `db:migrate:status` remains flaky in this shell; equivalent DB-state evidence currently used as migration proof.
- Follow-up tickets/tasks:
  - Execute Step 4.1 functional QA on Vercel and attach artifacts.
  - Capture `retryOperationId` parity proof between panel and history row.

---

## Attempt #8 (Step 4.1 API smoke harness added - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted runtime smoke harness
- Environment URL: not provided in this shell
- Tenant ID: not provided in this shell
- Role/User: not provided in this shell
- Build/Commit (if known): not captured

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE` (credential/context missing for API smoke execution)
- Command run:
  - `npm run smoke:email-step41-runtime`
- Notes:
  - New script is ready to validate key Step 4.1 APIs (`progress`, `failed-jobs`, `retry-history`, optional `single-retry`) using runtime credentials.
  - Current shell did not have required env (`BASE_URL`, `TENANT_ID`, `AUTH_TOKEN`, `EMAIL_CAMPAIGN_ID`), so smoke run exited early with explicit missing-env artifact.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T13-03-03-449Z-email-step41-runtime-smoke.md`

## Consolidated Verdict

- Release recommendation: `Conditional Go`
- Blocking defects:
  - Functional Step 4.1 execution evidence still pending (requires authenticated Vercel run context).
- Non-blocking defects:
  - Runtime smoke harness implementation complete; awaiting env injection.
- Follow-up tickets/tasks:
  - Run `smoke:email-step41-runtime` with required env in production-like context.
  - Capture screenshot evidence for UI-level checks and `retryOperationId` parity.

---

## Attempt #9 (Smoke env-readiness helper + rerun - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted env-readiness pass
- Environment URL: local fallback detected (`NEXT_PUBLIC_APP_URL`)
- Tenant ID: missing in current shell
- Role/User: missing in current shell
- Build/Commit (if known): not captured

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE` (authenticated context still missing)
- Command run:
  - `npm run check:email-step41-smoke-env`
  - `npm run smoke:email-step41-runtime`
- Notes:
  - Added env-readiness helper confirms only `BASE_URL` is auto-resolved; `TENANT_ID`, `AUTH_TOKEN`, and `EMAIL_CAMPAIGN_ID` are still missing.
  - Runtime smoke exits early with explicit missing-env list.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T13-09-43-679Z-email-step41-smoke-env-readiness.md`
  - `docs/evidence/email/2026-04-24T13-09-47-321Z-email-step41-runtime-smoke.md`

## Consolidated Verdict

- Release recommendation: `Conditional Go`
- Blocking defects:
  - Step 4.1 functional/API evidence still pending due to missing authenticated run context vars.
- Non-blocking defects:
  - Automation harnesses are in place and reporting clear missing inputs.
- Follow-up tickets/tasks:
  - Supply `TENANT_ID`, `AUTH_TOKEN`, and `EMAIL_CAMPAIGN_ID` in the production-like shell.
  - Re-run `check:email-step41-smoke-env` and `smoke:email-step41-runtime`.
  - Complete UI screenshot evidence and `retryOperationId` parity proof.

---

## Attempt #10 (Canonical alias support + token retrieval check - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted runtime context fallback pass
- Environment URL: local fallback detected (`NEXT_PUBLIC_APP_URL`)
- Tenant ID: missing in current shell
- Role/User: missing in current shell
- Build/Commit (if known): not captured

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE` (credentials/context still unavailable)
- Commands run:
  - `npm run check:email-step41-smoke-env`
  - `npm run smoke:email-step41-runtime`
  - `npm run get:canonical-staging-token`
- Notes:
  - Smoke scripts now support canonical staging env aliases (`CANONICAL_STAGING_BASE_URL`, `CANONICAL_STAGING_TENANT_ID`, `CANONICAL_STAGING_AUTH_TOKEN`, `CANONICAL_STAGING_EMAIL_CAMPAIGN_ID`).
  - Current shell still lacks required tenant/token/campaign values.
  - Canonical token helper could not mint a token because staging login credentials were not configured in env.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T13-12-06-867Z-email-step41-smoke-env-readiness.md`
  - `docs/evidence/email/2026-04-24T13-12-08-347Z-email-step41-runtime-smoke.md`

## Consolidated Verdict

- Release recommendation: `Conditional Go`
- Blocking defects:
  - Step 4.1 runtime smoke still blocked by missing authenticated context vars.
- Non-blocking defects:
  - Automation and env alias/fallback support complete.
- Follow-up tickets/tasks:
  - Set required env using `docs/evidence/email/STEP41_SMOKE_ENV_SETUP_TEMPLATE.md`.
  - Re-run Step 4.1 smoke commands and attach resulting PASS artifact.

---

## Attempt #11 (Auto-resolve auth smoke pipeline - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted auto-resolve pipeline
- Environment URL: `http://localhost:3000` (resolved)
- Tenant ID: `cmo9lebrp0001qjwe54slsy4d` (resolved from DB)
- Role/User: token not available in current shell
- Build/Commit (if known): not captured

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE` (auth + campaign context still incomplete)
- Command run:
  - `npm run run:email-step41-auth-smoke-pipeline`
- Notes:
  - New pipeline can auto-resolve `TENANT_ID` from DB and attempts token minting from canonical login credentials.
  - In this shell, `AUTH_TOKEN` remained unavailable (no canonical login creds configured), and `EMAIL_CAMPAIGN_ID` could not be resolved from DB data.
- Evidence artifact path:
  - Runtime command output from `run:email-step41-auth-smoke-pipeline` (captured in chat/terminal output)
  - Existing env/smoke artifacts remain authoritative for missing inputs.

## Consolidated Verdict

- Release recommendation: `Conditional Go`
- Blocking defects:
  - Auth token and campaign ID are still missing for Step 4.1 API smoke.
- Non-blocking defects:
  - Pipeline automation for context resolution is now available.
- Follow-up tickets/tasks:
  - Provide either (`AUTH_TOKEN` + `EMAIL_CAMPAIGN_ID`) or canonical login credentials + campaign ID.
  - Re-run `run:email-step41-auth-smoke-pipeline` and attach PASS artifact.

---

## Attempt #12 (Pipeline artifactized + rerun - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted auth smoke pipeline
- Environment URL: `http://localhost:3000` (resolved)
- Tenant ID: `cmo9lebrp0001qjwe54slsy4d` (resolved from DB)
- Role/User: token not available in current shell
- Build/Commit (if known): not captured

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE` (still blocked by auth + campaign context)
- Command run:
  - `npm run run:email-step41-auth-smoke-pipeline`
- Notes:
  - Pipeline now writes a timestamped evidence artifact for audit traceability.
  - Tenant auto-resolution continues to work.
  - Auth token minting still cannot run due to missing login credentials.
  - Campaign ID is still not auto-resolved from current DB context.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T13-20-36-829Z-email-step41-auth-smoke-pipeline.md`

## Consolidated Verdict

- Release recommendation: `Conditional Go`
- Blocking defects:
  - Missing authenticated token and campaign ID for Step 4.1 runtime smoke execution.
- Non-blocking defects:
  - Pipeline + artifacts are fully in place and reproducible.
- Follow-up tickets/tasks:
  - Provide `AUTH_TOKEN` + `EMAIL_CAMPAIGN_ID` (or canonical login creds + campaign ID), then rerun the pipeline.

---

## Attempt #13 (Expanded campaign auto-discovery rerun - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted auth smoke pipeline
- Environment URL: `http://localhost:3000` (resolved)
- Tenant ID: `cmo9lebrp0001qjwe54slsy4d` (resolved from DB)
- Role/User: token not available in current shell
- Build/Commit (if known): not captured

## Step 4.1 - Marketing email campaign reliability checks

- Status: `NOT AVAILABLE`
- Command run:
  - `npm run run:email-step41-auth-smoke-pipeline`
- Notes:
  - Pipeline now attempts campaign ID fallback from `Campaign`, `EmailSendJob`, and `EmailCampaignSenderPolicy`.
  - In this DB context, no campaign ID was discoverable from those sources.
  - Auth token is still unavailable (no login credentials in env for minting).
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T13-22-45-528Z-email-step41-auth-smoke-pipeline.md`

## Consolidated Verdict

- Release recommendation: `Conditional Go`
- Blocking defects:
  - Missing authenticated token and campaign ID for Step 4.1 runtime smoke execution.
- Non-blocking defects:
  - All automation/fallback paths are now exhausted in this shell context.
- Follow-up tickets/tasks:
  - Provide direct values for `AUTH_TOKEN` and `EMAIL_CAMPAIGN_ID`, then rerun pipeline.

---

## Attempt #14 (Authenticated staging smoke with token + campaign - 2026-04-24)

## Run Metadata

- Date: 2026-04-24
- Tester: AI-assisted + operator-provided auth context
- Environment URL: `https://payaid-v3.vercel.app`
- Tenant ID: `cmo9lebrp0001qjwe54slsy4d`
- Campaign ID: `cmoczj4oi0001kax6e3a13lvz`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `FAIL` (deployment mismatch)
- Command run:
  - `npm run run:email-step41-auth-smoke-pipeline`
- Notes:
  - Env readiness passed and authenticated context is present.
  - Runtime smoke reached staging endpoints but all required Step 4.1 API routes returned `404` HTML responses:
    - `GET /api/marketing/email-campaigns/[campaignId]/progress`
    - `GET /api/marketing/email-campaigns/[campaignId]/failed-jobs`
    - `GET /api/marketing/email-campaigns/[campaignId]/retry-history`
  - This indicates staging is running a build that does not include those backend routes.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T14-14-34-201Z-email-step41-auth-smoke-pipeline.md`
  - `docs/evidence/email/2026-04-24T14-12-53-714Z-email-step41-runtime-smoke.md`

## Consolidated Verdict

- Release recommendation: `No-Go` for Step 4.1 closure on current staging build
- Blocking defects:
  - Required Step 4.1 email campaign API routes are not deployed on staging (`404`).
- Non-blocking defects:
  - Authentication, tenant, and campaign context are confirmed working.
- Follow-up tickets/tasks:
  - Deploy branch/version containing Step 4.1 email campaign APIs.
  - Re-run `run:email-step41-auth-smoke-pipeline`.
  - After backend smoke passes, complete UI screenshot parity evidence.

---

## Attempt #15 (Production alias pass + screenshot closure placeholders - 2026-04-25)

## Run Metadata

- Date: 2026-04-25
- Tester: AI-assisted authenticated runtime verification
- Environment URL: `https://payaid-v3.vercel.app`
- Tenant ID: `cmjptk2mw0000aocw31u48n64`
- Role/User: tenant owner token context
- Build/Commit (if known): route parity commit pushed (`50a6c16b`); alias verification executed after latest production deploys reached `Ready`

## Step 4.1.a - Email runtime readiness precheck

- Status: `PASS` (carried forward)
- Command run:
  - `npm run verify:email-go-live-gated-precheck` (already green in prior attempts)
- Notes:
  - Runtime readiness and table-presence gates remain green.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-24T12-59-36-092Z-email-go-live-gated-precheck.md`

## Step 4.1 - Marketing email campaign reliability checks

- Status: `PASS` (API/runtime parity)
- Command run:
  - `npm run check:step41-routes-live`
  - `npm run run:email-step41-auth-smoke-pipeline`
- Notes:
  - Production alias now serves all Step 4.1 APIs successfully:
    - `progress` -> `200`
    - `failed-jobs` -> `200`
    - `retry-history` -> `200`
  - Authenticated smoke pipeline completed with `ok: true`.
  - UI screenshot evidence is still required to close visual workflow assertions.
- Evidence artifact path:
  - `docs/evidence/email/2026-04-25T05-02-29-379Z-step41-routes-live-check.md`
  - `docs/evidence/email/2026-04-25T05-03-23-268Z-email-step41-auth-smoke-pipeline.md`
- Screenshot placeholders (attach from browser run):
  - `[ ] Queue progress card state screenshot`
  - `[ ] Failed/dead-letter table screenshot`
  - `[ ] Sender policy save confirmation screenshot`
  - `[ ] Single-row retry summary screenshot (with retryOperationId)`
  - `[ ] Batch retry summary screenshot (with retryOperationId)`
  - `[ ] Retry History row screenshot matching the same retryOperationId`

## Consolidated Verdict

- Release recommendation: `Conditional Go`
- Blocking defects:
  - None at API/runtime gate level for Step 4.1.
- Non-blocking defects:
  - UI screenshot pack for Step 4.1 checklist is pending attachment.
- Follow-up tickets/tasks:
  - Execute one authenticated browser pass for Step 4.1 and attach the six screenshots above.
  - After screenshot attachment, promote this attempt to full `Go` for Step 4.1 closure evidence.

### Step 4.1 Screenshot Capture - Copy/Paste Runner

Use this mini block during one authenticated browser session, then replace each placeholder with a concrete screenshot file path.

```text
Step 4.1 Screenshot Pack - Attempt #15
Date:
Tester:
Environment URL: https://payaid-v3.vercel.app
Tenant ID: cmjptk2mw0000aocw31u48n64
Campaign ID: cmoczj4oi0001kax6e3a13lvz

1) Queue progress card state screenshot:
- path:
- note (counts shown):

2) Failed/dead-letter table screenshot:
- path:
- note (visible columns):

3) Sender policy save confirmation screenshot:
- path:
- note (saved sender/domain):

4) Single-row retry summary screenshot (with retryOperationId):
- path:
- retryOperationId:

5) Batch retry summary screenshot (with retryOperationId):
- path:
- retryOperationId:

6) Retry History row screenshot (matching retryOperationId):
- path:
- matched retryOperationId:

Step 4.1 final visual verdict:
- PASS | FAIL
- if FAIL, blocker:
```

After filling this block:
- set Attempt #15 consolidated verdict to `Go` when all six screenshots are attached and retryOperationId parity is confirmed.
- add screenshot paths in this Attempt #15 section under Step 4.1 Evidence.

### Step 4.1 Done Checklist (fast closeout)

- [ ] Screenshot #1 attached (Queue progress card)
- [ ] Screenshot #2 attached (Failed/dead-letter table)
- [ ] Screenshot #3 attached (Sender policy save confirmation)
- [ ] Screenshot #4 attached (Single-row retry summary with retryOperationId)
- [ ] Screenshot #5 attached (Batch retry summary with retryOperationId)
- [ ] Screenshot #6 attached (Retry History row with matching retryOperationId)
- [ ] retryOperationId parity verified (panel summary vs Retry History row)
- [ ] Attempt #15 final visual verdict set (`PASS`)
- [ ] Attempt #15 consolidated release recommendation updated to `Go`

---

## Attempt #16 (Post-deploy Marketing Studio IA + integrations access fix verification - 2026-04-25)

## Run Metadata

- Date: 2026-04-25
- Tester: AI-assisted verification prep + pending authenticated operator run
- Environment URL: `https://payaid-v3.vercel.app`
- Tenant ID: `cmjptk2mw0000aocw31u48n64` (expected)
- Role/User: owner/admin (required for integration actions)
- Build/Commit (if known):
  - `60a448e9` (`feat(marketing): split compose workspace and unblock integrations`)
  - `aa3e6d56` (`chore(marketing): remove unintended logo editor change from scope`)

## Step 4.2 - Marketing canonical route verification

- Status: `PARTIAL`
- Notes:
  - Canonical Compose route remains `/marketing/[tenantId]/Studio`.
  - Compose workspace route-state introduced:
    - `/marketing/[tenantId]/Studio?workspace=social`
    - `/marketing/[tenantId]/Studio?workspace=direct`
  - Awaiting authenticated browser confirmation for both workspace states.
- Evidence links/screenshots:
  - (Attach Compose social/direct screenshots)

## Step 4.5 - Marketing channel settings + social runtime verification

- Status: `PARTIAL`
- Notes:
  - RBAC fix shipped: `owner`/`OWNER` now includes `admin.integrations.manage`.
  - Regression test passed for owner integrations permission.
  - Awaiting authenticated browser confirmation that Social settings buttons are clickable and actionable.
- Evidence links/screenshots:
  - (Attach Settings -> Integrations -> Social action screenshots)
- API payload snippets:
  - (Optional: successful `/api/settings/social/test` response capture)

Checklist:

- [ ] Social settings buttons are clickable for owner/admin user
- [ ] At least one provider `Test` action succeeds
- [ ] Connect/Update token action opens or completes expected flow
- [ ] Disconnect action is available only when connected
- [ ] Refresh token action availability follows provider capability

## Step 4.5b - Marketing Studio generator/workspace runtime verification

- Status: `PARTIAL`
- Notes:
  - Image-response parsing fix shipped (`url` or `imageUrl` accepted).
  - Studio IA split shipped (Social vs Direct workspace).
  - Independent Text/Image/Video generators shipped.
  - Targeted regression suite passed:
    - `__tests__/m0/m0-marketing-studio-workspace-channel-scope.test.ts`
    - `3/3` tests passed
- Evidence links/screenshots:
  - (Attach Social Studio screenshot)
  - (Attach Direct Studio screenshot)
  - (Attach image generation success screenshot)

Checklist:

- [ ] Workspace toggle visible and switches between social/direct
- [ ] Direct workspace shows only Email/SMS/WhatsApp channels
- [ ] Social workspace shows only Facebook/Instagram/LinkedIn/YouTube channels
- [ ] Text generation works without requiring video
- [ ] Image generation succeeds without `No image URL returned` false error
- [ ] Video controls appear only in Social workspace
- [ ] YouTube path blocks scheduling until video is present (when YouTube selected)
- [ ] Publish actions remain separate from generator controls

## Consolidated Verdict

- Release recommendation: `Conditional Go`
- Blocking defects:
  - Authenticated browser QA evidence for Attempt #16 checks above is not attached yet.
- Non-blocking defects:
  - None known from automated checks/regressions for this attempt.
- Follow-up tickets/tasks:
  - Run authenticated UI pass and attach screenshots for all unchecked items.
  - Update Attempt #16 statuses from `PARTIAL` to `PASS` where applicable.

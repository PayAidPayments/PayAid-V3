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

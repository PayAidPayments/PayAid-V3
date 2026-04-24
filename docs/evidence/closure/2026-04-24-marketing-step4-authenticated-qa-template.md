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

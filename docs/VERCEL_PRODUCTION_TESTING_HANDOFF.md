# PayAid V3 - Vercel Production Testing Handoff

**Owner:** QA / Employee Tester  
**Audience:** Business + Product + Engineering  
**Last updated:** 2026-04-24  
**Purpose:** Provide one complete, practical guide for validating what is currently live on the Vercel-hosted app, and identifying what is still broken or missing.

---

## 1) Important framing (read first)

Because local code is ahead of production, treat this document as the **production truth checklist** based on:

- Latest completed implementation checklists (M0/M1/M2/M3)
- Latest recorded staging/prod-style evidence snapshots
- Latest smoke-test baselines recorded in project docs

Use this guide to confirm live behavior on Vercel. If Vercel behavior differs from this document, log it as a **production mismatch**.

---

## 2) Environment and access prerequisites

Before testing, confirm all of the below:

- Vercel URL is reachable and stable
- You can log in with a tenant user having CRM/Finance/HR/Inventory access
- You also have one SUPER_ADMIN account (for Admin Console tests)
- Test tenant has sample data: deals, contacts, calls, quotes, and at least one active workflow/sequence
- Browser cache is cleared, and testing is done in an incognito window

Recommended test accounts:

- `Tenant Admin` (module-level real usage)
- `SUPER_ADMIN` (tenant registry, feature-flag tests, impersonation tests)
- `Restricted User` (permission denial and read-only checks)

---

## 3) What is expected to be live on Vercel

This section is the expected production scope your employee should validate.

## 3.1 M0 - AI-native core (expected live)

- Signals ingest/list (`/api/v1/signals/ingest`, `/api/v1/signals`)
- Workflow create/list/publish/test-run
- Sequence create/enroll/pause
- Audit actions API (`/api/v1/audit/actions`)
- M0 exit metrics API (`/api/v1/m0/exit-metrics`)
- Idempotency behavior on key write routes (`x-idempotency-key`)

## 3.2 M1 - Unibox + Revenue Intelligence v1 (expected live)

- Conversations ingest/list/detail/messages APIs
- Revenue funnel/velocity/next-actions/won-timeseries
- Revenue feedback endpoint with idempotency
- Connector webhook signature + replay-window validation (`/api/v1/conversations/webhook`)

## 3.3 M2 - Marketplace/Calls/CPQ/SDR + KPI (expected live)

- Marketplace v1: list/install/configure
- Calls v1: start/log/list/end/transcript
- CPQ v1: list/create/approve/convert-invoice
- SDR v1: playbooks + runs (start/pause/stop/list)
- KPI scorecard endpoint and CRM Analytics page integration
- Calls-to-CRM linkage checks and quote conversion flow behavior

## 3.4 M3 - Admin/Governance/Revenue/HR/Inventory increments (expected live)

- Admin tenants APIs (list/detail/feature-flags)
- Admin impersonation endpoint
- AI decisions list/detail/stats/override
- Revenue cohorts/LTV/forecast/deal-health/single and batch
- Inventory reorder triggers and approve flow
- HR smoke-covered routes (employees + leave flow)

## 3.5 Integration settings platform (expected live)

- SMTP settings + test send
- Gmail/Outlook OAuth status/connect/disconnect
- WAHA settings + test
- Telephony settings + webhook verification status + test-call
- Social integration settings + connect/test/disconnect/refresh
- Integrations health/alerts/diagnostics/SLA dashboards in Settings

---

## 4) Employee test procedure (step-by-step)

Follow these steps in exact order to avoid false failures.

## Step 0 - Session setup

1. Open Vercel app in incognito.
2. Login as `Tenant Admin`.
3. Capture baseline:
   - Tenant ID
   - User role
   - Browser + time
4. Keep one bug log sheet open (template in Section 7).

## Step 1 - Global shell and navigation sanity

On each major module (CRM, Finance, HR, Inventory, Marketing, Settings):

- Confirm top bar loads (module switcher, search, notifications, user menu)
- Confirm no blank/white dead screens
- Confirm AI assistant entry point is visible on page
- Confirm module route switches do not throw 500/404
- Use canonical Settings routes (`/dashboard/settings` or `/settings/integrations`) instead of `/settings`

Pass if all major modules load without blocking errors.

## Step 2 - Feature-flag behavior

As SUPER_ADMIN (or with assistance from admin):

1. Open Admin Console and pick one non-critical tenant.
2. Toggle one M2 flag OFF (example: `m2_voice`), save.
3. Validate corresponding route/action returns feature-disabled behavior.
4. Toggle ON again and confirm feature restores.

Expected: route should fail gracefully with feature-disabled behavior when off, and work again when on.

## Step 3 - M2 critical business flows (highest priority)

### 3A. Calls lifecycle

1. Start a call (UI/API path)
2. Log call details
3. End call
4. Open transcript panel and fetch transcript

Expected:

- Call appears in calls list
- Status changes correctly
- Transcript endpoint returns usable payload
- No tenant-cross data leak

### 3B. CPQ quote-to-invoice

1. Create quote
2. Approve quote
3. Convert to invoice

API mapping note (to avoid false negatives):

- Use `/api/v1/quotes` and quote subroutes (`approve`, `convert-invoice`) for CPQ flows
- Do not use `/api/v1/cpq/quotes` (non-canonical path)

Expected:

- Convert works only after acceptable status
- Repeat convert should fail safely (idempotency/already-converted behavior)
- Invoice appears and links correctly

### 3C. SDR run controls + audit

1. Create/choose playbook
2. Start run
3. Pause run
4. Stop run
5. Check audit trail panel/API output

Expected:

- State transitions follow allowed order
- Audit entries exist for start/pause/stop

### 3D. Marketplace

1. List apps
2. Install one app
3. Configure the installed app

Expected:

- At least 8 catalog apps visible
- Install/configure responses are successful
- Duplicate install is safely handled

## Step 4 - Integrations settings verification

Test each integration card under Settings > Integrations:

- SMTP: save + test mail send
- Email OAuth: status visibility, connect/disconnect behavior
- WAHA: connection test
- Telephony: webhook status + test-call
- Social: connect/test/refresh/disconnect

Expected:

- Actions do not leak secrets
- Failures are actionable and non-crashing
- Test buttons disable in-flight and prevent double submits
- For social, verify YouTube appears in provider list and supports connect/test/disconnect (refresh may be not-implemented depending on token type)
- For YouTube refresh attempts, verify API returns a clear `not implemented` response with reconnect guidance (instead of generic failure text)
- Validate social provider health badges render expected states (`Healthy`, `Expiring soon`, `Expired`, `Missing scope`) and that YouTube `Missing scope` guidance is visible when upload scope is absent
- Backward compatibility check: legacy YouTube tokens stored under provider key `google` should still appear/manage as YouTube in settings actions (test/disconnect/refresh)

## Step 4.1 - Marketing email campaign reliability checks

In Marketing > Campaign detail (email campaign), validate:

- Queue progress card updates for pending/processing/sent/failed/dead-letter counts
- Failed/dead-letter job table renders recipient, attempts, error, updated time
- Sender policy can be updated (preferred sender account/domain) and saved
- Single-row retry works with:
  - default policy sender
  - explicit row sender override
- Batch retry works with:
  - Retry All Failed
  - Retry Selected with mixed per-row sender overrides
- Last retry panel supports:
  - persisted diagnostics after refresh
  - `Copy Summary` for bug reports
  - clear action for reset

Expected:

- Retries enqueue successfully without page crash
- Invalid sender override is rejected with clear error
- Selected retries only affect selected rows
- Queue progress and failed-job list reflect requeued jobs within polling window
- Retry diagnostics include concrete job IDs for retried/skipped/non-retriable rows (visible in panel and copied summary)
- Single-row retry also updates the same diagnostics panel/copy payload (scope = single) for parity with batch retries
- Retry diagnostics include a `retryOperationId` for each retry action so QA can correlate UI events with backend audit/log records
- Retry History table shows recent retry audit events (time, action type, operation ID, counts, actor) and should align with the latest panel summary

## Step 4.1.a - Email runtime readiness precheck (required before 4.1 sign-off)

Before marking Step 4.1 PASS, run the consolidated precheck and attach the generated evidence:

- Command:
  - `npm run verify:email-go-live-gated-precheck`
- Preferred behavior:
  - Runs `check:email-precheck-env` first and skips heavy checks if env is not ready.
- Under the hood it runs:
  - `npm run check:email-precheck-env`
  - `npm run verify:email-go-live-precheck` (only when env preflight passes)
- Local fallback:
  - `npm run verify:email-prod-readiness:local`

Expected:

- Redis TCP reachable via `REDIS_URL`
- Database reachable via `DATABASE_URL`
- Required email tables present:
  - `EmailSendJob`
  - `EmailTrackingEvent`
  - `EmailSyncCheckpoint`
  - `EmailDeliverabilityLog`
  - `EmailCampaignSenderPolicy`

Evidence:

- Attach generated markdown artifact from `docs/evidence/email/*-email-go-live-precheck.md` to QA notes.
- Attach referenced readiness artifact from `docs/evidence/email/*-email-prod-readiness.md`.

If blocked:

- Record blocker details in QA run notes using:
  - `docs/evidence/email/EMAIL_PRECHECK_BLOCKER_TRIAGE.md`

## Step 4.2 - Marketing canonical route verification (IA consistency)

Before running Marketing UI checks, use canonical routes only:

- Compose: `/marketing/[tenantId]/Studio`
- History: `/marketing/[tenantId]/History`
- Channels: `/marketing/[tenantId]/Social-Media`

If testing starts from older bookmarks (for example `social`, `channels`, `studio-builder`, or `Create-Post` links), confirm they redirect into canonical routes and continue testing on canonical URLs after redirect.

Reference map: `docs/MARKETING_ROUTE_CANONICAL_MAP.md`

## Step 4.3 - Marketing social retry verification (History)

In Marketing > History (`/marketing/[tenantId]/History`), validate social retry flow:

- Filter social rows to `FAILED` and trigger `Retry` on one failed row
- Confirm row status moves toward `SCHEDULED` after refresh
- Confirm success banner appears with re-queue confirmation
- Confirm `Recent retries` chips show post ID + retry time + actor label
- Click a retry chip and confirm it opens Compose audit view with auto-loaded dispatch audit for that post

## Step 4.4 - Marketing History filters, pagination, and export verification

In Marketing > History social table:

- Validate filters: `channel`, `status`, `from`, `to` return expected rows
- Validate quick ranges: `Today`, `Last 7 days`, `Last 30 days`
- Validate URL persistence: refresh page and confirm filter/page context is preserved from query params
- Validate sorting: switch between `Created (newest first)` and `Created (oldest first)` and verify row order changes accordingly
- Validate result summary: `Showing X-Y of Z matched posts` updates with filters/page changes
- Validate `Copy share link`: pasted URL should reopen same filter/sort/page context
- Validate page clamping: if a shared URL has an out-of-range page after filter changes, History should auto-adjust to the last valid page
- Validate empty-state messaging: distinguish between `no data yet` and `no results for current filters`
- Validate pagination: `Rows per page` (10/20/50), `Previous`, `Next`, and page counter
- Validate bulk retry in History social table:
  - select multiple `FAILED` rows (or `Select all failed on page`)
  - run `Retry selected`
  - confirm success banner includes queued/skipped counts and rows move toward `SCHEDULED`
- Validate filtered bulk retry in History social table:
  - apply channel/date filters (status can remain `ALL`)
  - run `Retry all failed (filtered)`
  - confirm up to the capped filtered set is queued and success banner shows queued/skipped counts
- Validate failure analytics panel in History:
  - confirm `Top failure reasons` renders counts for selected window (`7d`/`30d`)
  - confirm category chips and top raw reasons update when switching window
  - confirm `channel` filter scope is reflected in analytics totals/chips
- Validate `Clear filters` resets to default state and repopulates rows
- Validate exports:
  - `Export page CSV` contains exactly current visible page rows and starts with `meta` rows (exportedAt, filters, sort, page, pageSize)
  - `Export filtered CSV` downloads full filtered dataset (up to configured cap), matches active filters, follows active sort order, and includes `meta` rows (exportedAt, filters, sort, maxRows, exportedRows)

## Step 4.5 - Marketing YouTube connector runtime verification

In Marketing > Compose:

- Verify `Channel readiness` strip appears when selected social channels have blockers/warnings.
- Verify `Fix in channel settings` opens `/settings/[tenantId]/Integrations/Social` and `Open channels hub` opens `/marketing/[tenantId]/Social-Media`.
- Select `YouTube` channel and attach a valid video asset
- Trigger launch/schedule and confirm preflight allows submission when token + scope are valid
- Confirm worker outcome transitions from `SCHEDULED` to `SENT` for successful uploads
- Confirm History row has YouTube channel + status updates and `Open audit` works
- Validate negative paths:
  - missing connection returns actionable `YOUTUBE: account is not connected`
  - expired token returns actionable reconnect guidance
  - missing upload scope returns `youtube.upload` guidance
  - non-video/absent video asset is rejected before dispatch

Expected runtime markers (for pass/fail logging):

- **Settings test API**
  - `POST /api/settings/social/test?provider=youtube`
  - Expect: `200` with `{ ok: true, provider: "youtube" }` for valid token.
- **Create social post API**
  - `POST /api/social/posts` with YouTube in `channels` and at least one video `mediaIdsByChannel.YOUTUBE`.
  - Expect success: `201` with `created[]` item for `channel: "YOUTUBE"`.
  - Expect validation/preflight failures: `400` with actionable `details[]` (connection/scope/token/video requirements).
- **Worker dispatch state**
  - MarketingPost should progress: `SCHEDULED -> SENT` on success.
  - On failure: `SCHEDULED -> FAILED` with error guidance in metadata.
- **Dispatch metadata**
  - On success, `marketingPost.metadata.youtubeDispatch` should include:
    - `videoId`
    - `videoUrl` (`https://www.youtube.com/watch?v=<videoId>`)
    - `postedAt`
- **History + audit**
  - History row for YouTube post should show final status.
  - `Open audit` should resolve related outcomes and surface YouTube dispatch metadata.

### Step 4.5b - Marketing X/Twitter media runtime verification

In Marketing > Compose / Schedule:

- Validate positive paths:
  - X post with image-only media succeeds.
  - X post with exactly one video succeeds.
- Validate guardrails:
  - mixed image + video on one X post is rejected with actionable error.
  - more than one video on one X post is rejected with actionable error.
  - unsupported media types are rejected with actionable error.

Expected runtime markers:

- **Create social post API**
  - `POST /api/social/posts` with `TWITTER` in `channels`.
  - Expect validation guardrails for mixed-media / multi-video / unsupported media.
- **Worker dispatch metadata**
  - On success, `marketingPost.metadata.twitterDispatch.mediaMode` should be `image` or `video`.
- **History + audit**
  - X row reaches `SENT` on success or `FAILED` with actionable message.

## Step 4.6 - Brand Kit logo generator + export bundle verification

Use this flow to validate the newly shipped Logo Generator + Brand Kit management path:

1. Open `AI Studio > Logos` (`/ai-studio/[tenantId]/Logos`).
2. Create a vector logo using the **Vector Editor** tab.
3. Confirm options while creating:
   - `Save to Brand Kit Library`
   - `Set as Workspace Logo`
4. Save logo and confirm success.
4.1 In Vector Editor, locate **QA Context Snapshot** and hover/focus the info icon.
   - Confirm tooltip explains `Env`, `Build`, and `Origin` labels.
5. Open `Settings > Tenant` and verify:
   - Logo appears under **Brand Kit Logos**
   - If selected, it is set as workspace primary logo
6. In Brand Kit Logos section, validate:
   - Search/filter works
   - Sort modes (`Newest`, `Oldest`, `Primary first`, `Name A-Z`)
   - View modes (`List`, `Grid`)
   - Primary badge visibility
7. Validate logo actions:
   - `Set Primary` updates primary state
   - Single delete asks for confirmation and blocks deleting primary
8. Validate bulk actions:
   - Select/unselect visible
   - Clear selection
   - Bulk delete skips/blocks primary logos safely
9. Validate exports:
   - `Download Selected (N)` triggers browser downloads
   - `Export Bundle (.zip)` downloads one ZIP
   - `Export all filtered` mode exports all visible rows
   - `Exclude primary logo` removes primary from ZIP payload
   - Export preview text updates count and exclusion impact
   - Export button disables when effective export count is zero

Expected:

- No 500s on logo create/save/list/set-primary/delete/export routes.
- Primary logo safety guardrails always prevent accidental primary deletion.
- ZIP export returns downloadable archive with expected file set.
- Workspace logo (`tenant.logo`) remains in sync with selected primary brand kit logo.

### Step 4.6 QA sign-off gate (Ready for QA)

Mark the Logo + Brand Kit rollout **Ready for QA pass** only when all conditions below are true in the same tenant session:

- **Functional pass**
  - Vector logo save succeeds with and without `Set as Workspace Logo`.
  - QA Context Snapshot tooltip is visible and helper text matches `Env` / `Build` / `Origin`.
  - Saved logo appears in Brand Kit list and primary marker state is correct.
  - `Set Primary` updates workspace logo and list state immediately after refresh.
  - Single/bulk delete protections block primary-logo deletion paths.
  - ZIP export succeeds for both selected mode and filtered mode.
- **Guardrail pass**
  - `Exclude primary logo` removes primary from effective export candidates.
  - Export action is disabled when effective export count is zero.
  - Inline blocked-export message is visible and understandable.
- **Evidence required in bug log / QA notes**
  - One screenshot of Vector Editor save success.
  - One screenshot of QA Context Snapshot tooltip content.
  - One screenshot of Brand Kit list with primary badge.
  - One screenshot of zero-export guard state (disabled button + reason).
  - One downloaded ZIP artifact name with file count note.

## Step 4.7 - Sales canonical route verification (IA consistency)

Before running Sales UI checks, use canonical routes only:

- Home: `/sales/[tenantId]/Home`
- Sales Pages: `/sales/[tenantId]/Sales-Pages`
- Checkout Pages: `/sales/[tenantId]/Checkout-Pages`
- Orders: `/sales/[tenantId]/Orders`

If testing starts from old Sales bookmarks (for example `Landing-Pages`, `Landing-Pages/new`, or `Landing-Pages/[id]`), confirm they redirect into canonical `Sales-Pages` routes and continue testing on canonical URLs after redirect.

Reference map: `docs/SALES_ROUTE_CANONICAL_MAP.md`

## Step 4.8 - Website Builder MVP runtime verification

In Website Builder (`/website-builder/[tenantId]/Home` and `/website-builder/[tenantId]/Sites/[id]`), validate:

- Module discoverability:
  - Open top-bar module switcher from a non-Website Builder module.
  - Confirm `Website Builder` entry is visible in `Capabilities & Tools` / secondary apps.
  - Click `Website Builder` and confirm navigation lands on `/website-builder/[tenantId]/Home` (or redirects there through `/website-builder` entry route).
- Home list + filters:
  - `status` and `goal` filters load without crash.
  - Refresh button reloads list and preserves expected results.
- Create flow:
  - Create site with valid `name`, `slug`, and `goal`.
  - Confirm new card appears in Home list and `Open Site` navigates to detail page.
- Site detail edit:
  - Update metadata (name/slug/status/goal/meta fields) and save.
  - Confirm saved values are visible after refresh.
- AI draft + apply flow:
  - Run `Generate Draft` and confirm success state.
  - Run `Apply Draft to Pages` and confirm page-tree rows appear.
- Page-tree editor:
  - Rename page title/slug/type, reorder with Up/Down, delete one row, add one row.
  - Save page tree and confirm success status appears.
  - Confirm `Last page-tree save` timestamp is visible.
  - Confirm `Unsaved page-tree changes` badge appears on edit and clears after save.
- Guardrails:
  - Try saving with an empty title -> blocked with inline validation.
  - Try saving with duplicate slugs (case-insensitive) -> blocked with inline validation.
  - Try saving with zero pages -> blocked with inline validation.

Expected API/runtime markers (for pass/fail logging):

- `GET /api/website/sites`
  - Expect `200` and `sites[]` payload for authorized tenant.
- `POST /api/website/sites`
  - Expect `201` on valid payload.
  - Expect `400` with validation details on invalid payload.
- `GET /api/website/sites/:id`
  - Expect `200` with site metadata + compatibility mode.
- `PATCH /api/website/sites/:id` (metadata-only)
  - Expect `200` and `normalizedPageTree: false`.
- `PATCH /api/website/sites/:id` (with `pageTree`)
  - Expect `200` and `normalizedPageTree: true`.
  - Invalid page-tree payload should return `400` with `details[]` messages.
- `POST /api/website/ai/generate-draft`
  - Expect `200` with `draft.pagePlan[]` in response.
- Runtime artifact check `G` (QA template discoverability evidence gate)
  - Expect pass when discoverability fields are filled in Step 4.8 QA template.
  - If incomplete, expect fail with explicit missing discoverability field list.

### Step 4.8 Automation Quickstart

Use this order for deterministic evidence generation:

1. Export env (or use token helper):
   - `npm run get:website-builder-step4-8-token`
   - Optional automation mode: `npm run get:website-builder-step4-8-token -- --json` (returns structured token/error payload for wrappers)
2. Run full gate pack:
   - `npm run run:website-builder-ready-to-commit-pack`
3. Verify outputs:
   - `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.json`
   - `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.md`
   - `docs/evidence/closure/*-website-builder-ready-to-commit-check.json`
   - `docs/evidence/closure/*-website-builder-ready-to-commit-check.md`
   - Updated template: `docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md`
4. Verify pack summary fields:
   - `discoverabilityGate.markerCheck.ok` should be `true`
   - `discoverabilityGate.evidenceCheck.ok` should be `true`
   - If `overallOk=false`, check `runtimeBlockers[]` for explicit env/auth blockers.
   - Use `nextAction` (copy/paste-ready PowerShell env + rerun command; includes token-helper flow when token is missing) before rerun.
   - Optional: follow `nextActionSteps[]` for structured command-by-command remediation.
   - Optional: inspect `tokenHelperProbe` for parsed token-helper diagnostics (`code`, `error`, `nextSteps[]`) when auth token is missing.
   - Optional: inspect `helperTests` for helper-layer gate status.
     - Set `$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"` before pack run to enforce helper tests in the pack gate.
5. (Optional early signal) Verify evidence-pipeline summary fields:
   - `discoverabilityGate.ok` should be `true`
   - `discoverabilityGate.status` should be `200`
   - If pipeline `overallOk=false`, inspect `runtimeBlockers[]` and use `nextAction` (copy/paste-ready remediation; includes token-helper flow when token is missing).
   - Optional: use `nextActionSteps[]` as a structured remediation sequence.
   - Optional: inspect `tokenHelperProbe` for parsed token-helper failure/success hints (`code`, `error`, `nextSteps[]`) when auth token is missing.
   - Optional: inspect `helperTests` for helper-layer gate status.
     - Set `$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"` before pipeline run to enforce helper tests in the pipeline gate.
6. (Optional helper-layer guardrail) Run:
   - `npm run test:website-builder-step4-8-helpers`
   - Parse summary fields:
     - `check` (expected `website-builder-step4-8-helper-tests`)
     - `overallOk`
     - `steps[]` (`label`, `command`, `ok`, `exitCode`, `elapsedMs`)

### Step 4.8 QA Evidence Template

For copy/paste execution capture, use:

- `docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md`
- `docs/evidence/closure/2026-04-24-website-builder-step4-8-evidence-index.md`

For API marker automation (env-driven), run:

- `npm run check:website-builder-step4-8-runtime`
- `npm run apply:website-builder-step4-8-runtime-artifact`
- `npm run run:website-builder-step4-8-evidence-pipeline`

Runbook:

- `docs/WEBSITE_BUILDER_STEP4_8_RUNTIME_RUNBOOK.md`

Env template:

- `docs/WEBSITE_BUILDER_STEP4_8_ENV_TEMPLATE.md`

Required env for automation script:

- `WEBSITE_BUILDER_BASE_URL`
- `WEBSITE_BUILDER_AUTH_TOKEN`

Token helper (optional):

- `npm run get:website-builder-step4-8-token`

Script output:

- `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.json`
- `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.md`
- Updated evidence template:
  - `docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md`

### Step 4.8 QA sign-off gate (Ready for QA)

Mark Website Builder Step 4.8 **Ready for QA pass** only when all conditions below are true in the same tenant session:

- **Functional pass**
  - Site create flow succeeds from Home and new site appears in list.
  - Site detail metadata edits persist after refresh.
  - `Generate Draft` and `Apply Draft to Pages` both complete and page tree populates.
  - Page-tree editor supports rename/reorder/add/delete and save without crashes.
  - Success status and timestamp indicators render after save/apply actions.
- **Guardrail pass**
  - Empty-title page-tree save is blocked with inline validation.
  - Duplicate-slug (case-insensitive) save is blocked with inline validation.
  - Zero-page save is blocked with inline validation.
  - API parity observed:
    - metadata-only patch returns `normalizedPageTree: false`
    - pageTree patch returns `normalizedPageTree: true`
    - invalid pageTree patch returns `400` with `details[]`
- **Evidence required in bug log / QA notes**
  - One screenshot of module switcher showing `Website Builder` entry before navigation.
  - One screenshot of Home list with created Website Builder site card.
  - One screenshot of Site detail page after metadata save.
  - One screenshot of populated page-tree editor after Apply Draft.
  - One screenshot showing validation guardrail error (duplicate or empty page).
  - One API payload capture showing `normalizedPageTree: true` on pageTree save.

### Step 4 Authenticated QA Evidence Template

For copy/paste execution capture across Step 4.1-4.5, use:

- `docs/evidence/closure/2026-04-24-marketing-step4-authenticated-qa-template.md`

### Marketing Commit Gate (after Step 4 signoff)

Before commit/push for production, use:

- `docs/MARKETING_READY_TO_COMMIT_CHECKLIST.md`

This checklist enforces Marketing-only commit scope and explicit non-Marketing exclusions.

### Website Builder Commit Gate (after Step 4.8 signoff)

Before commit/push for Website Builder changes, use:

- `docs/WEBSITE_BUILDER_READY_TO_COMMIT_CHECKLIST.md`
- `npm run check:website-builder-ready-to-commit` (optional preflight)
- `npm run run:website-builder-ready-to-commit-pack` (runtime evidence + preflight)

Preflight output artifacts:

- `docs/evidence/closure/*-website-builder-ready-to-commit-check.json`
- `docs/evidence/closure/*-website-builder-ready-to-commit-check.md`

This checklist enforces Step 4.8 evidence, API/UI guardrails, and docs alignment before release commits.

## Step 5 - Revenue and analytics validation

In CRM analytics and revenue-intelligence surfaces:

- Validate KPI scorecard loads for 7/30/90 day windows
- Validate cohorts, forecast, LTV, and deal-health cards load
- Validate feature-disabled response appears when relevant flag disabled

Expected:

- Metrics return structured values (not empty errors)
- UI cards do not break on empty datasets

## Step 6 - HR and inventory regression checks

HR:

- Employee list and create
- Leave request create + approve/reject

Inventory:

- Reorder triggers list
- Approve reorder trigger (with and without vendor)

Expected:

- CRUD and approvals run without 500 errors
- Validation errors are clear for bad input

---

## 5) Pass/fail decision model

Classify each tested item as:

- **PASS:** Works exactly as expected on Vercel
- **FAIL:** Broken behavior, wrong output, blocker, or crash
- **PARTIAL:** Core action works but has important defects
- **NOT AVAILABLE:** Feature hidden/disabled/no access (not necessarily a bug)

Release confidence recommendation:

- **Go:** No critical failures and no high-severity security/data issues
- **Conditional Go:** Only medium/low defects; workarounds exist
- **No-Go:** Any critical failure in calls, CPQ conversion, SDR state machine, admin flags, or integration security

---

## 6) Priority test matrix (what to test first)

Run in this order:

1. Calls lifecycle (start/log/end/transcript)
2. CPQ approve + convert-invoice
3. SDR run state machine + audit trail
4. Marketplace list/install/configure
5. Integration settings suite (SMTP/OAuth/WAHA/Telephony/Social)
6. Website Builder Step 4.8 runtime + commit gate pack
7. Admin feature flags and impersonation
8. Revenue analytics endpoints and UI
9. HR + Inventory smoke routes

If time is limited, complete at least top 4 before sign-off.

---

## 7) Bug logging template (mandatory)

Use this exact format for every failure:

- **Title:** Short issue name
- **Environment:** Vercel URL + tenant + role
- **Module/Feature:** Example: `CRM > CPQ > Convert Invoice`
- **Steps to reproduce:** Numbered steps
- **Expected result:** What should happen
- **Actual result:** What happened instead
- **Severity:** Critical / High / Medium / Low
- **Evidence:** Screenshot/video + response payload (if API-related)
- **Frequency:** Always / Intermittent
- **Workaround:** If any

---

## 8) Known mismatch risk note

Since local and production differ, these are the most likely mismatch areas:

- Recently added `/api/v1/*` routes not yet deployed
- Feature flags set differently between local and prod tenants
- Role/permission differences (`crm:audit:read`, admin scopes)
- Integration credentials present locally but missing in Vercel env
- Data-shape differences causing empty dashboards despite healthy APIs

Treat these as first checks before escalating as code bugs.

---

## 9) QA execution report template (copy/paste)

Use this template when submitting QA results for this run:

```text
QA Execution Report - Vercel Production
Date:
Tester:
Vercel URL:
Tenant:
Role:

Release recommendation:
- [ ] Go
- [ ] Conditional Go
- [ ] No-Go

Scope completed:
- Step 1 (Core workflow): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 2 (CRM + CPQ): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 3 (SDR + Marketplace): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 4.1 (Marketing queue/retry): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 4.2 (Marketing canonical routes): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 4.3 (Social retry in History): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 4.4 (History filters/pagination/exports): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 4.5 (YouTube connector runtime): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 4.6 (Brand Kit logos + export): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 4.7 (Sales canonical routes): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 4.8 (Website Builder MVP runtime): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 5 (Revenue + analytics): PASS / PARTIAL / FAIL / NOT AVAILABLE
- Step 6 (HR + Inventory): PASS / PARTIAL / FAIL / NOT AVAILABLE

Step 4.6 sign-off evidence:
- Vector save success screenshot: [link/path]
- QA Context Snapshot tooltip screenshot (`Env`/`Build`/`Origin` visible): [link/path]
- Brand Kit list with primary badge screenshot: [link/path]
- Zero-export guard screenshot (disabled + reason): [link/path]
- ZIP artifact checked (name + file count): [text]

Step 4.8 sign-off evidence:
- Home list with created site card screenshot: [link/path]
- Site detail after metadata save screenshot: [link/path]
- Populated page-tree editor after Apply Draft screenshot: [link/path]
- Validation guardrail screenshot (duplicate or empty page): [link/path]
- API payload capture with normalizedPageTree=true: [link/path/text]
- Runtime check artifact (json): [link/path]
- Runtime check artifact (md): [link/path]
- Ready-to-commit preflight artifact (json): [link/path]
- Ready-to-commit preflight artifact (md): [link/path]

Top failures by severity (up to 10):
1.
2.
3.

API/runtime notes:
- Any 500s observed: Yes/No
- If yes, route(s):
- Retry operation IDs captured (if applicable):
- Mismatch-risk checks performed first: Yes/No

Items verified definitely live + stable:
-
-
-

Open blockers for release:
-
-

Additional comments:
-
```

---

## 10) Final handoff output expected from employee

After testing, employee should submit:

1. Completed pass/fail matrix (all sections in this doc)
2. Top 10 failures by severity
3. Screenshots/evidence bundle
4. Website Builder Step 4.8 automation artifacts (`runtime-checks` + `ready-to-commit-check`)
5. Final recommendation: Go / Conditional Go / No-Go
6. List of items verified as definitely live and stable on Vercel

This output is what engineering should use to create the production fix queue.

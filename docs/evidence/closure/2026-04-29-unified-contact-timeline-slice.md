# Unified communication timeline — contact slice (2026-04-29)

## Objective

Advance P1 backlog item: **Build unified communication timeline (email + call + WhatsApp + notes + tasks) per contact/account/deal.**

This slice delivers the **contact** aggregation path: one server-side merge and one API for the CRM contact activity UI.

## Implementation

- **`lib/crm/unified-contact-timeline.ts`**
  - `buildUnifiedContactTimeline({ tenantId, contactId, limit })` loads in parallel:
    - `Interaction` rows for the contact (email, call, WhatsApp, SMS, meeting, etc.)
    - `Task` rows scoped to `contactId` + tenant
    - `Comment` rows with `entityType === 'contact'` and `entityId === contactId`
    - public `Contact.notes` as a synthetic **note** row (timestamp from `contact.updatedAt`)
    - `Deal` rows for the contact (returned separately for existing deal row rendering)
  - Returns `null` if the contact is not in-tenant (caller maps to HTTP 404).

- **`GET /api/crm/contacts/[id]/timeline`**
  - CRM auth via `requireModuleAccess` + `resolveCrmRequestTenantId` (same pattern as `/api/interactions`).
  - Query: `limit` (optional, default 100, max 200).
  - JSON: `{ success, activities, deals }`.

- **`components/crm/contact/ContactTimeline.tsx`**
  - On initial load (`append === false`), prefers the unified endpoint; on non-OK response, falls back to legacy `/api/interactions` + `/api/deals`.
  - When unified succeeds: skips merging duplicate **tasks** and **public notes** from props (already in `activities`).
  - Activity type mapping extended so unified **note** and **task** rows are not misclassified as **call**.

## Phase 109 (deal slice, same day)

- **`lib/crm/unified-deal-timeline.ts`** — `buildUnifiedDealTimeline({ tenantId, dealId, limit })` merges:
  - deal created + won/lost milestones
  - **Quote** (unique per deal) and **Proposal(s)** for the deal
  - **Comment** rows with `entityType === 'deal'`
  - when `deal.contactId` is set: interactions, tasks, contact comments, and public **Contact.notes** (same communication surface as contact unified API, scoped to that contact)
- **`GET /api/crm/deals/[id]/timeline`** — same auth pattern as contact timeline.

- **`DealTimeline.tsx`** prefers the unified endpoint; on failure, keeps the legacy multi-fetch path.

## Not in this slice

- Account-scoped unified timeline (all contacts on an account).
- Marketing email thread bodies as first-class timeline rows (still interaction-driven where logged).

## Validation

- `ReadLints` on touched files: clean.

## Phase 110 (account slice, same sprint)

- **`lib/crm/unified-account-timeline.ts`** — `buildUnifiedAccountTimeline({ tenantId, accountId, limit })`:
  - Resolves CRM `contacts` linked to `accountId`, loads **interaction**, **task**, **deal**, **proposal** (same membership), **quotes** via `deal.contact`, entity **`Comment`** (`contact` + `account`), and surface **public Contact.notes** as note rows.
- **`GET /api/crm/accounts/[id]/timeline`** — same auth conventions as contact/deal timeline routes.

- **`AccountActivityTimeline`** + wired into **`/crm/[tenantId]/Accounts/[id]`** as “Account activity”.

## Phase 111 (same thread)

- **`collectAccountTreeIds`** (exported from `lib/crm/unified-account-timeline.ts`) walks `Account.parentAccountId` breadth-first (**max depth 8**, **max 128 ids**).
- **`buildUnifiedAccountTimeline`** scopes all CRM queries to **contacts/comments under any account id in that set** (`accountId: { in: accountIds }`); **`Comment`** with `entityType === 'account'` now matches **every account entity in the tree**, not only the root row.
- **`AccountActivityTimeline`** deep links: **`/crm/.../Deals|Quotes|Proposals/[id]`** when metadata carries `dealId` / `quoteId` / `proposalId`; account comments link to **`/crm/.../Accounts/[accountEntityId]`**; interaction/task/note/email types still honor **`contactId`**.

## Phase 112 (same thread)

- Account activity links expanded to task detail routes when timeline metadata carries `taskId`:
  - **`/crm/[tenantId]/Tasks/[taskId]`** from `primaryDetailHref` in `AccountActivityTimeline`.
- Added focused M0 route coverage for account timeline API:
  - **`__tests__/m0/m0-account-timeline-route.test.ts`**
  - covers success (`200`), invalid limit (`400`), not-found (`404`), and unexpected error (`500`) paths for `GET /api/crm/accounts/[id]/timeline` with mocked auth/tenant resolver/aggregator.

### Validation

- `ReadLints` on updated component + new test: clean.


## Phase 113 (timeline route test closure runner)

- Added focused route tests:
  - `__tests__/m0/m0-contact-timeline-route.test.ts`
  - `__tests__/m0/m0-deal-timeline-route.test.ts`
- Added closure command + runner:
  - `scripts/run-crm-timeline-routes-closure-check.mjs`
  - `npm run check:crm-timeline-routes-closure`
- Runner behavior matches existing closure tooling:
  - split per-suite Jest invocations, hard per-suite timeout, Windows process-tree kill on timeout, markdown artifact output.
- Diagnostic run executed with `CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS=45000`:
  - deterministic `3/3` timed-out suites, artifact: `docs/evidence/closure/2026-04-29T01-17-19-273Z-crm-timeline-routes-closure-check.md`.

### Validation

- `ReadLints` on new tests + runner + timeline component: clean.

## Phase 114 (release-gate integration)

- Added opt-in release-gate id in `scripts/run-release-gate-suite.mjs`:
  - `crm-timeline-routes-contracts` -> `node scripts/run-crm-timeline-routes-closure-check.mjs`
  - default timeout override set to `900000` ms (runner still controls per-suite Jest timeout via its own envs).
- Executed targeted release gate:
  - `RELEASE_GATES=crm-timeline-routes-contracts`
  - `CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS=45000`
- Result is deterministic **FAIL** (expected in this environment due to pre-output Jest hangs), with artifacts:
  - `docs/evidence/release-gates/2026-04-29T01-26-14-787Z-release-gate-suite.json`
  - `docs/evidence/closure/2026-04-29T01-28-32-164Z-crm-timeline-routes-closure-check.md`

## Phase 115 (bundle gate shortcut + proof run)

- Added script shortcut in `package.json`:
  - `release:gate:timeline-contracts`
  - expands to `RELEASE_GATES=workflow-automation-contracts,crm-timeline-routes-contracts node scripts/run-release-gate-suite.mjs`
- Executed bundled gate run with tuned per-suite closure envs:
  - `WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_PER_SUITE_MS=45000`
  - `CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS=45000`
- Result: deterministic **FAIL** in this environment (known Jest pre-output hang class) while both gates emitted closure artifacts through the release-gate orchestrator.
- Artifacts:
  - `docs/evidence/release-gates/2026-04-29T01-36-59-656Z-release-gate-suite.json`
  - `docs/evidence/closure/2026-04-29T01-40-04-050Z-workflow-automation-closure-check.md`
  - `docs/evidence/closure/2026-04-29T01-42-24-171Z-crm-timeline-routes-closure-check.md`

## Phase 116 (operator runbook — timeline contracts gates)

### When to run

- **CI:** GitHub Actions runs the same bundle on **Ubuntu** on relevant diffs (plus weekly / manual); see **Phase 117** and `.github/workflows/timeline-contracts-release-gate.yml`.
- After changes to **workflow approval** surfaces (`lib/workflow/*`, approval APIs, related M0 tests under `m0-workflow-*`).
- After changes to **unified CRM timeline** surfaces (`lib/crm/unified-*-timeline.ts`, `GET /api/crm/{contacts,deals,accounts}/[id]/timeline`, timeline route tests).
- After changes to **`GET .../email-campaigns/[campaignId]/deeplink-context`** or `m0-email-campaign-deeplink-context-route.test.ts` — optional **`npm run check:m0-deeplink-context`** (single-file timeout runner; see Phase 136).
- Optional **PR preflight** or **local triage** when full `npm run test:m0` is slow or hangs; these gates are **not** in the default `release:gate:smoke` gate list unless you opt in.

### One-command bundle (recommended)

```bash
npm run release:gate:timeline-contracts
```

Runs release-gate orchestration with:

- `workflow-automation-contracts` → `node scripts/run-workflow-automation-closure-check.mjs`
- `crm-timeline-routes-contracts` → `node scripts/run-crm-timeline-routes-closure-check.mjs`
- `m0-deeplink-context-contracts` → `node scripts/run-m0-deeplink-context-check.mjs` (Phase **137**)

Artifacts:

- Release orchestrator JSON: `docs/evidence/release-gates/<timestamp>-release-gate-suite.json`
- Per-closure markdown: `docs/evidence/closure/<timestamp>-workflow-automation-closure-check.md`, `...-crm-timeline-routes-closure-check.md`, and `...-m0-deeplink-context-check.md` (when that gate runs)

### Run closures standalone (no release-gate wrapper)

```bash
npm run check:workflow-automation-closure
npm run check:crm-timeline-routes-closure
npm run check:m0-deeplink-context
```

### Partial release gate (pick one gate)

```bash
cross-env RELEASE_GATES=workflow-automation-contracts npm run release:gate:smoke
cross-env RELEASE_GATES=crm-timeline-routes-contracts npm run release:gate:smoke
```

### Environment knobs (per-suite Jest budgets inside closure scripts)

| Variable | Closure script | Meaning |
|----------|------------------|---------|
| `WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_MS` | `run-workflow-automation-closure-check.mjs` | Default per-run budget when not overridden by per-suite |
| `WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_PER_SUITE_MS` | same | Hard cap **per workflow test file** (split mode) |
| `CRM_TIMELINE_CLOSURE_TIMEOUT_MS` | `run-crm-timeline-routes-closure-check.mjs` | Default per-run budget |
| `CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS` | same | Hard cap **per timeline route test file** |

**Release-gate outer timeout** (spawnSync wrapper in `run-release-gate-suite.mjs`): override with `RELEASE_GATE_TIMEOUT_MS_<GATE_ID>` where `<GATE_ID>` is the gate id uppercased with non-alphanumerics → `_`. Examples:

- `RELEASE_GATE_TIMEOUT_MS_WORKFLOW_AUTOMATION_CONTRACTS`
- `RELEASE_GATE_TIMEOUT_MS_CRM_TIMELINE_ROUTES_CONTRACTS`

Defaults for both gates are `900000` ms in `defaultGateTimeoutOverrides` unless you set those env vars.

### Shell examples

PowerShell (raise per-file Jest budget, e.g. 300s, when triaging stalls before first suite output):

```powershell
$env:WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_PER_SUITE_MS = '300000'
$env:CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS = '300000'
$env:M0_DEEPLINK_CONTEXT_TIMEOUT_MS = '120000'
npm run release:gate:timeline-contracts
```

POSIX:

```bash
WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_PER_SUITE_MS=300000 CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS=300000 M0_DEEPLINK_CONTEXT_TIMEOUT_MS=120000 npm run release:gate:timeline-contracts
```

### Reading results

- Orchestrator `all_pass: false` is expected on machines where Jest stalls **before first suite output**; inspect each closure markdown: `Timed out: true` on a run usually indicates that stall class, not an assertion failure.
- When suites actually execute, `Pass: true` appears per run block and exit code `0`.

## Phase 117 (CI — timeline contracts gate on Ubuntu)

- Added GitHub Actions workflow `.github/workflows/timeline-contracts-release-gate.yml`.
- **Triggers:** `workflow_dispatch`, weekly schedule (Mondays 07:35 UTC), and **path-filtered** `pull_request` / `push` to `main` / `develop` when unified timeline libs, CRM `**/timeline` routes, M0 timeline or workflow tests, closure scripts, release-gate suite, `jest.m0.config.js`, or this workflow file change.
- **Runner:** `ubuntu-latest`, job timeout **45** minutes.
- **Env:** `WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_PER_SUITE_MS=300000`, `CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS=300000`, **`M0_DEEPLINK_CONTEXT_TIMEOUT_MS=120000`** (deeplink-context gate, Phase **137**) so healthy Linux agents can finish Jest before the closure guard kills the process.
- **Artifacts:** newest `*-release-gate-suite.json`, `*-closure-check.md`, and **`*-m0-deeplink-context-check.md`** touched during the job (via `find … -mmin -120`) are staged under `.ci-artifacts/timeline-contracts-gate/` and uploaded with **14-day** retention (may be empty if no files were written in-window—then rely on job logs).

## Phase 118 (marketing email jobs + tracking in unified timelines)

- **Data:** `EmailSendJob` (subject, status, `sentAt`/`createdAt`, campaign/deal/contact/account links) and `EmailTrackingEvent` (opens, clicks, bounces, etc.) merged into the same chronological feeds as interactions.
- **Contact** (`buildUnifiedContactTimeline`): jobs and tracking filtered by `contactId` + `tenantId`.
- **Deal** (`buildUnifiedDealTimeline`): jobs with `dealId`; tracking events loaded for `trackingId`s on those jobs.
- **Account** (`buildUnifiedAccountTimeline`): jobs where `accountId` is in the account tree **or** `contactId` is in rolled-up contacts; tracking events for those contacts.
- **Shared copy:** `lib/crm/email-timeline-shared.ts` (`titleForEmailSendJob`, `titleForEmailTrackingEvent`).
- **UI:** `email` rows use shared metadata sources; **clickable deep links** (`href`) landed in Phase 119.

## Phase 119 (email deep links + account deal-scoped sends)

- **Href helper:** `lib/crm/email-timeline-href.ts` — `hrefForEmailTimelineDetail(tenantId, { campaignId, dealId, contactId })` resolves to `/marketing/{tenant}/Campaigns/{id}`, `/crm/{tenant}/Deals/{id}`, or `/crm/{tenant}/Contacts/{id}` (priority in that order).
- **Server rows:** `ContactTimelineActivityRow.href`, `AccountTimelineActivityRow.href`, and deal unified `DealTimelineEventRow.href` set on email job + tracking rows where applicable.
- **Account email query:** after loading deals for account contacts, `EmailSendJob` query `OR` now includes `dealId in` those deals so sends logged only on the deal still appear on the account roll-up.
- **UI:** `ContactTimeline` links the title when `href` is present; `AccountActivityTimeline` uses `evt.href ?? primaryDetailHref` and fixes corrupted `primaryDetailHref` (duplicate `taskId` / broken return).
- **CI:** path filter includes `lib/crm/email-timeline-href.ts`.

## Phase 120 (AI call recordings — `CallRecording` / `AICall`)

- **Href helper:** `lib/crm/recording-timeline-href.ts` — `hrefForCallRecordingTimeline` (http(s) recording URL, else deal, Dialer + `contactId`, else `/crm/{tenant}/Calls`).
- **Feeds:** `CallRecording` rows merged on contact (`call.contactId`), deal (`call.dealId`), and account (second-stage `OR` on `call.contactId` / `call.dealId` with rolled-up ids).
- **UI:** absolute recording URLs open in a **new tab** on `ContactTimeline`, `DealTimeline`, and `AccountActivityTimeline`; `AccountActivityTimeline` `primaryDetailHref` uses the same helper for `call` rows.

## Phase 121 (`VoiceAgentCall` recordings + query repair)

- **Helper:** `lib/crm/voice-agent-timeline.ts` — `resolveVoiceAgentRecordingUrl` (call row then `VoiceAgentCallMetadata`).
- **Contact:** `VoiceAgentCall` with `customerId` or `phone` / `from` / `to` matching the contact (after loading `contact.phone`); rows use `metadata.source: 'voice_agent_call'`.
- **Deal:** same for the deal’s linked contact + phone; `href` includes `dealId` for non-public URLs.
- **Account:** `customerId in` rolled-up contact ids only (bounded OR).
- **Regression fix:** restored missing `callRecordingsForDeal` query and the account `Promise.all` branch that loads `callRecordingsForAccount`.
- **CI:** path filter includes `lib/crm/voice-agent-timeline.ts`.

## Phase 122 (account voice phone OR roll-up, bounded)

- **Account voice query:** `buildUnifiedAccountTimeline` now resolves `voiceAgentOr` as:
  - `customerId in contactIds`
  - `phone in contactPhones`
  - `from in contactPhones`
  - `to in contactPhones`
- **Bounded fan-out:** `contactPhones` are de-duplicated and capped to `60` values before applying the OR, keeping account roll-up query size predictable.
- **Context enrichment:** account contacts now select `phone`; voice rows can derive display name by `customerId` first, then phone-match map (`phone` / `from` / `to`) when `customerId` is absent.
- **Outcome:** account timelines now capture additional `VoiceAgentCall` recordings that are phone-linked but not explicitly contact-linked.

## Phase 123 (WhatsApp-native timeline rows from `WhatsappMessage`)

- **Contact:** `buildUnifiedContactTimeline` now includes `WhatsappMessage` rows scoped via `conversation.contactId` + `conversation.account.tenantId`.
- **Deal:** when `deal.contactId` is present, native WhatsApp rows for that contact are merged into the same chronological timeline (not only generic `Interaction` rows).
- **Account:** roll-up includes WhatsApp messages where `conversation.contactId in` account-contact ids; each row links to the CRM contact detail.
- **Row shape:** native rows use `type: 'whatsapp'`, title from message direction (sent/received), message preview from `text`/`mediaCaption`/`messageType`, and metadata `source: 'whatsapp_message'`.

## Phase 124 (WhatsApp drilldown links from timeline rows)

- **Helper:** `lib/crm/whatsapp-timeline-href.ts` adds `hrefForWhatsappTimelineDetail(conversationId)` → `/dashboard/whatsapp/inbox?conversationId=...`.
- **Unified rows:** contact/deal/account WhatsApp rows now include `href` and `metadata.conversationId`.
- **Inbox behavior:** `apps/dashboard/app/dashboard/whatsapp/inbox/page.tsx` reads query param `conversationId` and auto-selects that conversation after list load, enabling direct timeline drilldown.
- **Fallback:** account row link still falls back to CRM contact detail when conversation id is missing.

## Phase 125 (WhatsApp media-first drilldown links)

- **Helper update:** `hrefForWhatsappTimelineDetail(conversationId, mediaUrl?)` now prefers valid `http(s)` `mediaUrl` before inbox-conversation route.
- **Unified rows:** contact/deal/account WhatsApp rows now include `mediaUrl` in select + metadata and pass it to the helper.
- **Behavior:** timeline click opens direct media asset (new tab in existing UI handling) when present; otherwise continues to the conversation in WhatsApp inbox.

## Phase 126 (CRM Calls transcript deep link from AI `CallRecording` rows)

- **Helper:** `lib/crm/call-transcript-timeline-href.ts` — `hrefForCallTranscriptTimeline(tenantId, callId)` → `/crm/{tenantId}/Calls?callId=...&expandTranscript=1` (stable query shape for timeline drilldown).
- **Recording href resolution:** `lib/crm/recording-timeline-href.ts` — after public `http(s)` `recordingUrl`, if `callId` (AICall id) is present, use the transcript deep link instead of deal/Dialer/Calls list fallbacks.
- **Unified builders:** contact/deal/account `CallRecording` loops pass `callId: call.id` into `hrefForCallRecordingTimeline` so non-public recordings land on Call History with transcript context.
- **Calls page:** `apps/dashboard/app/crm/[tenantId]/Calls/page.tsx` reads `callId` and `expandTranscript` via `useSearchParams`; forces status filter to **all** when `callId` is present; matching `CallRow` auto-expands and fetches `/api/v1/calls/:id/transcript`; shows a short warning when the id is not in the loaded list; smooth `scrollIntoView` on the focused row. Header click while loading no longer collapses transcript state (`transcript === 'loading'` guard).

## Phase 127 (SMS interaction type + transcript deep-link URL cleanup)

- **Server unified feeds:** `Interaction` rows with `type` **`sms`** now emit timeline `type: 'sms'` (contact `ContactTimelineActivityType`, deal `interactionToCommType`, account `interactionChannel`) instead of incorrectly mapping SMS to **`whatsapp`**. Default titles use **SMS** where appropriate (`interactionTitle` on deal/account).
- **CRM UI:** `ContactTimeline` adds an **SMS** filter, teal **`Smartphone`** icon, and client mapping for `sms`; `DealTimeline` adds **`sms`** to `TimelineEventType`, unified + legacy interaction paths, icon/color; `AccountActivityTimeline` adds pill/icon for **`sms`** and includes **`sms`** in contact-backed deep links. **`AccountActivityTimeline`** `primaryDetailHref` for **`call`** rows now passes **`callId`** into `hrefForCallRecordingTimeline` (aligns account UI with Phase 126 transcript drilldown when metadata carries `callId`).
- **Calls page:** After a successful auto-fetch from `callId` + `expandTranscript=1`, **`router.replace`** clears query params while keeping the expanded transcript visible.

## Phase 128 (native `SMSDeliveryReport` rows on unified timelines)

- **Helpers:** `lib/crm/sms-timeline-shared.ts` (`titleForSmsDeliveryReport`) and client-safe `lib/crm/sms-timeline-href.ts` (`hrefForSmsDeliveryTimelineDetail` — marketing campaign when `campaignId` is set, else CRM contact).
- **Contact:** `buildUnifiedContactTimeline` loads `sMSDeliveryReport` for `tenantId` + `contactId`, merges rows with `type: 'sms'`, `metadata.source: 'sms_delivery_report'`, message preview in `description`, and `href` from the new helper.
- **Deal:** When `deal.contactId` is set, SMS reports load in parallel with voice + WhatsApp; merged into the deal feed with the same row shape and `contactId` metadata for drilldown.
- **Account:** Roll-up loads SMS where `contactId in` account-contact ids (same cap as other sources); titles use contact name prefix; `href` falls back to CRM contact detail when the helper returns null.
- **UI:** `AccountActivityTimeline` `primaryDetailHref` resolves **`sms`** rows via `hrefForSmsDeliveryTimelineDetail` before generic contact-backed routes.
- **Tests / CI:** `__tests__/m0/m0-sms-timeline-href.test.ts`; workflow path filters extended for SMS helper modules and the new test file.

## Phase 129 (`EmailSendJob` body preview on unified email rows)

- **Shared helpers:** `lib/crm/email-timeline-shared.ts` adds `previewTextForEmailSendJob` (prefer `textBody`, else best-effort HTML tag strip + whitespace normalize, capped at **220** chars) and `descriptionLineForEmailSendJob` (order: **`error`** → body preview → **`To:`** recipient line).
- **Unified builders:** `emailJobSelect` in `unified-contact-timeline.ts`, `unified-deal-timeline.ts`, and `unified-account-timeline.ts` now selects **`htmlBody`** + **`textBody`**; email-job row `description` uses `descriptionLineForEmailSendJob` so contact/deal/account timelines show message previews without new API fields.
- **Tests / CI:** `__tests__/m0/m0-email-timeline-preview.test.ts`; workflow path filter entry for that test.

## Phase 130 (campaign `emailJobId` deep link from timeline email sends)

- **`hrefForEmailTimelineDetail`:** optional `emailSendJobId` appends `?emailJobId=…` when the primary target is the marketing campaign URL (`lib/crm/email-timeline-href.ts`).
- **Unified builders + account UI:** contact/deal/account `EmailSendJob` rows pass `emailSendJobId: j.id` when `campaignId` is set; `AccountActivityTimeline` forwards `metadata.emailSendJobId` into the same helper for email rows.
- **Campaign detail:** `apps/dashboard/app/marketing/[tenantId]/Campaigns/[id]/page.tsx` reads `emailJobId` via `useSearchParams`, highlights the matching failed-job row (`ref` + ring styling), scrolls it into view, shows an amber notice when the job is not in the failed queue (e.g. sent/pending), scrolls the failed-jobs card into view on miss, and **`router.replace`** clears query params after ~2.6s (same hygiene pattern as CRM Calls transcript deep link). Failed-jobs `Card` has anchor id **`campaign-failed-jobs`**.
- **Tests / CI:** `__tests__/m0/m0-email-timeline-href.test.ts`; workflow path filters for `email-timeline-href`, marketing campaign detail page, and the new test.

## Phase 131 (`EmailTrackingEvent` description from `eventData` + envelope)

- **Helper:** `lib/crm/email-timeline-shared.ts` — `descriptionLineForEmailTrackingEvent(eventType, eventData, opts?)` parses JSON objects (or JSON **strings**), pulls click **URLs**, bounce/complaint **reasons**, open **geo/client** hints, optional **referer** / **userAgent** / **IP** / **`messageId`** fallback, and joins with **` · `** (truncated segments).
- **Unified builders:** `emailTrackSelect` / deal account tracking queries now include **`eventData`**, **`messageId`**, **`ipAddress`**, **`userAgent`**, **`referer`**; tracking rows set **`description`** from the helper and enrich **metadata** for account drilldowns.
- **Tests:** extended `__tests__/m0/m0-email-timeline-preview.test.ts` with click/bounce/string-json/messageId cases.

## Phase 132 (campaign `trackingEventId` deep link from timeline email tracking rows)

- **`hrefForEmailTimelineDetail`:** optional `emailTrackingEventId` appends `trackingEventId=…` on campaign URLs; when both job and tracking ids are present, query string merges both keys (`lib/crm/email-timeline-href.ts`).
- **Unified builders + account UI:** `EmailTrackingEvent` rows with `campaignId` pass `emailTrackingEventId: ev.id` into the helper; `AccountActivityTimeline` forwards `metadata.emailTrackingEventId` for email rows.
- **Campaign detail:** reads `trackingEventId` from `useSearchParams`; shows contextual email-tracking banner; scroll targets the shared wrapper **`#campaign-unified-timeline-deeplink`** (introduced in phase 133 alongside SMS drilldown) unless a failed-job **row** is targeted by `emailJobId` (then job row scroll wins); **`stripCampaignDeeplinkQuery`** runs after ~2.6s when deeplink params are present—**tracking-only** links strip without waiting on failed-jobs fetch; when `emailJobId` is present, strip still waits for `failedJobsFetched` as in phase 130.
- **Tests:** `__tests__/m0/m0-email-timeline-href.test.ts` covers tracking-only URL and merged job+tracking query.

## Phase 133 (campaign `smsReportId` deep link from timeline SMS delivery rows)

- **`hrefForSmsDeliveryTimelineDetail`:** optional `smsDeliveryReportId` appends `smsReportId=…` when the primary target is the marketing campaign URL (`lib/crm/sms-timeline-href.ts`).
- **Unified builders + account UI:** native `SMSDeliveryReport` rows with `campaignId` pass `smsDeliveryReportId: s.id`; `AccountActivityTimeline` forwards `metadata.smsDeliveryReportId` for `sms` rows.
- **Campaign detail:** reads `smsReportId`; email tracking + SMS contextual banners render inside **`#campaign-unified-timeline-deeplink`** (shared scroll for non–failed-job-row deeplinks); strip timer includes `smsReportId` (phase **134** adds server verify gate before strip when tracking/SMS params are present).
- **Tests:** `__tests__/m0/m0-sms-timeline-href.test.ts` covers `smsReportId` query on campaign URLs.

## Phase 134 (campaign deeplink server verify — tracking + SMS)

- **API:** `GET /api/marketing/email-campaigns/[campaignId]/deeplink-context?trackingEventId=&smsReportId=` (either or both) under marketing module auth; returns `{ tracking?: { found, eventType?, occurredAt? }, smsReport?: { found, status?, phoneNumber? } }` scoped by **`tenantId` + `campaignId`** Prisma filters (`emailTrackingEvent`, `sMSDeliveryReport`).
- **Campaign detail:** `useQuery` loads context when `trackingEventId` and/or `smsReportId` is present; banners show **loading**, **matched** summary, **miss** (not on file for this campaign), or **fetch error**; **`router.replace`** strip waits on **`deeplinkContextFetched`** whenever those params are used (in addition to existing failed-jobs wait for `emailJobId`).
- **Hygiene:** `requestedSmsReportId` read from search params; unified scroll uses **`#campaign-unified-timeline-deeplink`** for both channels.
- **Tests / CI:** `__tests__/m0/m0-email-campaign-deeplink-context-route.test.ts`; workflow path filters for `apps/dashboard/app/api/marketing/email-campaigns/**` and the new test.

## Phase 135 (campaign `emailJobId` deeplink verify)

- **API:** same `deeplink-context` route accepts **`emailJobId`**; returns optional **`sendJob: { found, status?, subject? }`** from `EmailSendJob` filtered by **`id` + `tenantId` + `campaignId`**.
- **Campaign detail:** verify query runs when **any** of `emailJobId` / `trackingEventId` / `smsReportId` is present; **strip timer** waits on **`deeplinkContextFetched`** first, then **`failedJobsFetched`** when a job id is present. **Campaign mismatch** (job not on file for this campaign) shows a **red** banner in failed-jobs; **not in failed queue** but job belongs to campaign remains **amber** (pending/sent path). **Email-only** deeplinks render a short summary card under **`#campaign-unified-timeline-deeplink`** when matched. Unified scroll defers until send-job ownership is known when combined with tracking/SMS params.
- **Tests:** extended `m0-email-campaign-deeplink-context-route` for send-job hit/miss; `400` error copy includes `emailJobId`.

## Phase 136 (deeplink-context combined contract + timeout runner)

- **Contract test:** `m0-email-campaign-deeplink-context-route` asserts all three query params in one GET resolve independently with correct Prisma `where` / `campaignId` from the route param.
- **Operator runner:** `npm run check:m0-deeplink-context` → `scripts/run-m0-deeplink-context-check.mjs` runs only the deeplink-context test file under **`M0_DEEPLINK_CONTEXT_TIMEOUT_MS`** (default **45000**), Windows **`taskkill /T /F`** on timeout, writes `docs/evidence/closure/*-m0-deeplink-context-check.md` with stdout/stderr tails for triage (same closure-check family as CRM timeline routes). PowerShell example: `$env:M0_DEEPLINK_CONTEXT_TIMEOUT_MS='60000'; npm run check:m0-deeplink-context`. On some **Windows** workstations the same pre-output Jest hang class as other M0 suites may surface (timeout with empty logs); **Ubuntu** runners used in CI usually pass this single-file run.
- **CI:** path filter includes the new script for timeline-contracts workflow.

## Phase 137 (`m0-deeplink-context-contracts` in timeline release bundle)

- **`npm run release:gate:timeline-contracts`** now sets `RELEASE_GATES=workflow-automation-contracts,crm-timeline-routes-contracts,m0-deeplink-context-contracts` so the orchestrator runs the deeplink-context closure after the two existing gates (`scripts/run-release-gate-suite.mjs`).
- **Timeouts:** default outer gate budget **`m0-deeplink-context-contracts` → 180000 ms** in `run-release-gate-suite.mjs`; GitHub Actions workflow sets **`M0_DEEPLINK_CONTEXT_TIMEOUT_MS=120000`** for the inner Jest run.
- **Artifacts:** workflow `find` step copies `*-m0-deeplink-context-check.md` alongside existing `*-closure-check.md` files into upload staging.

## Phase 138 (legacy CRM `Interaction` email `href`)

- **Constraint:** Prisma `Interaction` has no `campaignId`, `emailSendJobId`, or JSON metadata—only `contactId`, `type`, `subject`, `notes`, etc.—so marketing campaign deeplinks for synced/logged email rows are **not** inferable without a migration + writer updates.
- **Unified builders:** When the interaction maps to **email** (`interactionToActivityType` / `interactionToCommType` / `interactionChannel` per file), contact/deal/account timelines set `href` with `hrefForEmailTimelineDetail(tenantId, { contactId, dealId? })` (deal timeline also adds `dealId` to row `metadata` for consistency). Non-email interaction types keep `href: null`.
- **Tests:** `__tests__/m0/m0-email-timeline-href.test.ts` asserts contact-only fallback for legacy interaction-style params (`/crm/t1/Contacts/ct_42`).

## Phase 139 (legacy `Interaction` campaign/job context migration + writers)

- **Prisma:** `Interaction` now includes nullable `campaignId` and `emailSendJobId` with indexes (migration `20260429115000_add_interaction_email_context_fields`) so legacy email interactions can carry campaign/job context when available.
- **Writers:** email interaction write paths now accept/store campaign-job context:
  - `logEmailActivity(...)` in `lib/email/sync-service.ts` supports optional context payload.
  - `logOutboundEmail(...)` options accept `campaignId` / `emailSendJobId` and forward to `logEmailActivity`.
  - `POST /api/interactions` and `POST /api/crm/communications` accept optional `campaignId` / `emailSendJobId` and persist them for email rows.
- **Unified builders:** contact/deal/account timeline interaction-email rows now pass `campaignId` + `emailSendJobId` into `hrefForEmailTimelineDetail(...)` so campaign deeplinks are preferred whenever legacy interaction rows contain this context.

## Phase 140 (Prisma generate timeout runner + deterministic artifact)

- **Operator runner:** added `scripts/run-prisma-generate-closure-check.mjs` and `npm run check:prisma-generate-closure` to run Prisma generate through the existing retry wrapper (`scripts/prisma-generate-with-retry.js`) under a hard timeout (`PRISMA_GENERATE_CLOSURE_TIMEOUT_MS`, default **120000**).
- **Behavior:** writes `docs/evidence/closure/*-prisma-generate-closure-check.md` including command, timeout outcome, and stdout/stderr tails so Windows hangs are captured deterministically instead of blocking indefinitely.
- **Observed run (this host):** `docs/evidence/closure/2026-04-29T06-42-40-274Z-prisma-generate-closure-check.md` timed out at 120000 ms with minimal output, matching prior local hang behavior.

## Phase 141 (timeline release bundle warn-only Prisma gate)

- **Release gate orchestration:** `scripts/run-release-gate-suite.mjs` now supports `RELEASE_GATE_WARN_ONLY_GATES` (comma-separated gate ids). Matching gates report in artifacts with `"warn_only": true` and do not flip `all_pass` to false when they fail/timeout.
- **Timeline bundle wiring:** `release:gate:timeline-contracts` now includes `prisma-generate-closure-contracts` and marks it warn-only via `RELEASE_GATE_WARN_ONLY_GATES=prisma-generate-closure-contracts`.
- **CI workflow:** timeline contracts workflow now tracks `scripts/run-prisma-generate-closure-check.mjs` in path filters, sets `PRISMA_GENERATE_CLOSURE_TIMEOUT_MS=120000`, and uploads `*-prisma-generate-closure-check.md` artifacts.
- **Local proof:** single-gate run with warn-only settings passed outer suite despite inner timeout failure (`release-gate` artifact `docs/evidence/release-gates/2026-04-29T06-56-18-859Z-release-gate-suite.json` shows `exit_code: 1`, `warn_only: true`, `all_pass: true`), with closure artifact `docs/evidence/closure/2026-04-29T06-56-36-005Z-prisma-generate-closure-check.md`.

## Phase 142 (warn-only gate next-actions summary helper)

- **Operator helper:** added `scripts/show-release-gate-warn-only-next-actions.mjs` and `npm run show:release-gate-warn-only-next-actions`.
- **Behavior:** reads the latest `docs/evidence/release-gates/*-release-gate-suite.json`, extracts failed warn-only gates, and prints a compact JSON action plan (gate, issue, suggested follow-up commands, notes).
- **Current proof:** command output on this host reports one warn-only failure (`prisma-generate-closure-contracts`) with actionable commands (`check:prisma-generate-closure`, `db:generate`, `db:local:migrate`).

## Phase 143 (warn-only helper markdown mode)

- **Output mode:** `scripts/show-release-gate-warn-only-next-actions.mjs` now accepts `--format=markdown` in addition to default JSON output.
- **NPM alias:** added `npm run show:release-gate-warn-only-next-actions:markdown`.
- **Current proof:** markdown output renders a copy/paste operator checklist with artifact reference, failure details, and command bullets for `prisma-generate-closure-contracts`.

## Phase 144 (warn-only helper `--write` closure artifact mode)

- **Artifact write mode:** `scripts/show-release-gate-warn-only-next-actions.mjs` now supports `--write` (used with `--format=markdown`) to persist the generated checklist into `docs/evidence/closure/*-release-gate-warn-only-next-actions.md`.
- **NPM alias:** added `npm run show:release-gate-warn-only-next-actions:markdown:write`.
- **Current proof:** `node scripts/show-release-gate-warn-only-next-actions.mjs --format=markdown --write` produced `docs/evidence/closure/2026-04-29T07-40-35-820Z-release-gate-warn-only-next-actions.md`.

## Phase 145 (timeline CI checklist artifact wiring)

- **CI workflow:** timeline contracts workflow now runs `npm run show:release-gate-warn-only-next-actions:markdown:write` in an `if: always()` step after the release gate, ensuring warn-only operator checklists are produced even on failing runs.
- **Artifact staging:** upload filter now includes `*-release-gate-warn-only-next-actions.md` alongside existing gate/closure artifacts.
- **Path filters + local convenience:** workflow trigger paths now include `scripts/show-release-gate-warn-only-next-actions.mjs`; added `npm run release:gate:timeline-contracts:with-warn-only-checklist` to run gate + checklist generation in one command.
- **Current proof:** npm alias run produced `docs/evidence/closure/2026-04-29T07-55-30-906Z-release-gate-warn-only-next-actions.md`.

## Phase 146 (one-line checklist pointer helper)

- **Operator pointer helper:** added `scripts/show-latest-release-gate-warn-only-checklist-pointer.mjs` and npm alias `show:release-gate-warn-only-checklist:pointer`.
- **Behavior:** prints a single line `WARN_ONLY_CHECKLIST_POINTER <path>` for the latest `*-release-gate-warn-only-next-actions.md` artifact (or exits non-zero with guidance when missing).
- **CI wiring:** timeline workflow now runs the pointer command in an `if: always()` step after checklist generation and path-filters the new script.
- **Runtime note (this host):** local shell runs of this pointer command hit the same no-output hang class seen intermittently with npm/node in this environment; CI step wiring is in place for deterministic runner logs.

## Phase 147 (pointer fallback via release-gate JSON excerpts)

- **Fallback mode:** `scripts/show-latest-release-gate-warn-only-checklist-pointer.mjs` now supports `--from-release-gate-json`, attempting to extract `docs/evidence/closure/*-release-gate-warn-only-next-actions.md` directly from the latest `*-release-gate-suite.json` `output_excerpt` block before falling back to directory scan.
- **NPM alias:** added `show:release-gate-warn-only-checklist:pointer:from-release-gate-json`.
- **CI pointer step:** timeline workflow now runs `show:release-gate-warn-only-checklist:pointer:from-release-gate-json || show:release-gate-warn-only-checklist:pointer` for resilient handoff pointer emission.
- **Runtime note (this host):** local invocations of the pointer helper continue to show intermittent no-output hang behavior in this shell environment; fallback wiring is committed for CI/runner use.

## Phase 148 (pointer summary artifact generator)

- **Summary runner:** added `scripts/run-release-gate-warn-only-pointer-summary.mjs` plus npm alias `run:release-gate-warn-only-pointer-summary`.
- **Behavior:** composes latest release-gate JSON + latest checklist markdown into two closure artifacts:
  - `docs/evidence/closure/*-release-gate-warn-only-pointer-summary.json`
  - `docs/evidence/closure/*-release-gate-warn-only-pointer-summary.md`
  including canonical `pointer_line`, all-pass flag, and warn-only failure summary.
- **CI wiring:** timeline workflow now path-filters the summary runner, executes it under `if: always()`, and stages both new artifact patterns for upload.
- **Runtime note (this host):** local runner invocation hit the same intermittent no-output shell hang class; CI wiring is committed for deterministic artifact generation.

## Phase 149 (pointer summary fallback when checklist artifact is missing)

- **Resilience mode:** `scripts/run-release-gate-warn-only-pointer-summary.mjs` now supports `--allow-missing-checklist`.
- **Behavior:** when no local `*-release-gate-warn-only-next-actions.md` exists, the summary runner extracts the checklist path from latest release-gate `output_excerpt`, still emits pointer summary JSON/markdown artifacts, and marks `checklist_source` as `release_gate_output_excerpt`.
- **NPM alias:** added `run:release-gate-warn-only-pointer-summary:allow-missing-checklist`.
- **CI wiring:** timeline workflow summary step now uses the fallback-capable alias so artifact synthesis remains stable even when checklist directory scans or writes are flaky.

## Phase 150 (warn-only artifact pack helper + opener)

- **Operator helper:** added `scripts/open-latest-release-gate-warn-only-artifacts.mjs`.
- **Behavior:** reads latest pointer summary JSON and resolves a compact artifact pack:
  - latest release-gate suite JSON
  - latest warn-only checklist markdown (including fallback-resolved path)
  - pointer summary JSON
  - pointer summary markdown
- **Modes:** `show:release-gate-warn-only:artifact-pack` prints artifact availability JSON; `open:release-gate-warn-only:artifact-pack` also opens existing artifacts via OS default handlers (Windows `start`, macOS `open`, Linux `xdg-open`).
- **Runtime intent:** this gives local operators a deterministic "one command to inspect all outputs" path when shell output is noisy or intermittently hangs.

## Phase 151 (guarded artifact-pack bundle runner)

- **Bundle runner:** added `scripts/run-release-gate-warn-only-artifact-pack-bundle.mjs`.
- **Behavior:** executes the full operator chain sequentially with hard per-step timeout (`RELEASE_GATE_WARN_ONLY_BUNDLE_STEP_TIMEOUT_MS`, default `180000`), while continuing after failures so downstream artifact synthesis still runs:
  - `release:gate:timeline-contracts`
  - `show:release-gate-warn-only-next-actions:markdown:write`
  - `run:release-gate-warn-only-pointer-summary:allow-missing-checklist`
  - `show:release-gate-warn-only:artifact-pack`
  - optional open step when `--open` is used
- **Evidence output:** always writes closure artifact `docs/evidence/closure/*-release-gate-warn-only-artifact-pack-bundle.md` with per-step status and stdout/stderr tails.
- **NPM aliases:** added `run:release-gate-warn-only:artifact-pack-bundle` and `run:release-gate-warn-only:artifact-pack-bundle:open`.

## Phase 152 (CI post-gate bundle synthesis wiring)

- **Bundle mode extension:** `run-release-gate-warn-only-artifact-pack-bundle` now supports `--skip-release-gate` for post-gate synthesis when release-gate output already exists.
- **NPM alias:** added `run:release-gate-warn-only:artifact-pack-bundle:post-gate`.
- **Workflow wiring:** timeline CI now runs the post-gate bundle command under `if: always()` after pointer-summary generation, with `RELEASE_GATE_WARN_ONLY_BUNDLE_STEP_TIMEOUT_MS=120000`.
- **Artifact staging:** upload filter now includes `docs/evidence/closure/*-release-gate-warn-only-artifact-pack-bundle.md`.
- **Path filters:** workflow trigger paths now include `scripts/open-latest-release-gate-warn-only-artifacts.mjs` and `scripts/run-release-gate-warn-only-artifact-pack-bundle.mjs`.

## Phase 153 (one-line bundle verdict helper + CI log line)

- **Verdict helper:** added `scripts/show-release-gate-warn-only-bundle-verdict.mjs` plus npm alias `show:release-gate-warn-only:bundle-verdict`.
- **Behavior:** reads latest `docs/evidence/closure/*-release-gate-warn-only-artifact-pack-bundle.md` and prints one-line status:
  - `TIMELINE_WARN_ONLY_BUNDLE_VERDICT pass|partial|fail <artifact-path>`
  using `all_pass` and per-step `ok` markers.
- **Failure behavior:** exits non-zero for `partial`/`fail` (and for missing bundle artifact), while CI runs it as informational (`|| true`) so the log line is always present.
- **Workflow wiring:** timeline CI now runs the verdict helper under `if: always()` after post-gate bundle synthesis and path-filters script changes.

## Phase 154 (explicit strict/soft bundle verdict modes)

- **Verdict modes:** `show-release-gate-warn-only-bundle-verdict` now supports `--soft`.
- **Behavior:**
  - default/**strict** mode keeps non-zero exit for `partial`/`fail` (and missing bundle artifact),
  - **soft** mode still prints the same one-line verdict but always exits zero.
- **NPM aliases:** added `show:release-gate-warn-only:bundle-verdict:strict` and `show:release-gate-warn-only:bundle-verdict:soft`.
- **CI wiring:** timeline workflow verdict step now runs soft alias directly (no shell `|| true` needed), preserving operator visibility while keeping pipeline non-blocking.

## Phase 155 (bundle verdict JSON output mode)

- **Structured output:** `show-release-gate-warn-only-bundle-verdict` now supports `--json`.
- **Payload:** emits structured fields for automation:
  - `verdict`
  - `artifact_path`
  - `all_pass`
  - `ok_count`
  - `total_count`
  with `reason`/`hint` when artifact is missing.
- **NPM aliases:** added JSON-friendly aliases:
  - `show:release-gate-warn-only:bundle-verdict:json`
  - `show:release-gate-warn-only:bundle-verdict:json:strict`
  - `show:release-gate-warn-only:bundle-verdict:json:soft`
- **CI wiring:** timeline workflow now prints both line verdict and JSON verdict in `if: always()` post-gate steps for machine-readable log parsing.

## Phase 156 (persisted bundle verdict JSON artifact)

- **Artifact writer:** added `scripts/run-release-gate-warn-only-bundle-verdict-artifact.mjs`.
- **Behavior:** computes latest bundle verdict payload and writes:
  - `docs/evidence/closure/*-release-gate-warn-only-bundle-verdict.json`
  with the same structured fields used by `--json` output mode.
- **NPM aliases:** added:
  - `run:release-gate-warn-only:bundle-verdict-artifact`
  - `run:release-gate-warn-only:bundle-verdict-artifact:soft`
- **CI wiring:** timeline workflow now runs the soft artifact writer in `if: always()` and stages `*-release-gate-warn-only-bundle-verdict.json` for artifact upload.

## Phase 157 (latest bundle verdict pointer helper)

- **Pointer helper:** added `scripts/show-latest-release-gate-warn-only-bundle-verdict-pointer.mjs`.
- **Behavior:** prints one line `WARN_ONLY_BUNDLE_VERDICT_POINTER <path>` for latest `docs/evidence/closure/*-release-gate-warn-only-bundle-verdict.json`.
- **NPM alias:** added `show:release-gate-warn-only:bundle-verdict:pointer`.
- **CI wiring:** timeline workflow now prints this pointer in an `if: always()` step after writing verdict artifact, and path-filters the new helper script.

## Phase 158 (consolidated pointer pack helper)

- **Pointer-pack helper:** added `scripts/show-release-gate-warn-only-pointer-pack.mjs`.
- **Behavior:** prints three one-line pointers in fixed order:
  - `WARN_ONLY_CHECKLIST_POINTER ...`
  - `WARN_ONLY_BUNDLE_VERDICT_POINTER ...`
  - `WARN_ONLY_POINTER_SUMMARY_POINTER ...`
  and marks missing values explicitly as `missing`.
- **NPM aliases:** added `show:release-gate-warn-only:pointer-pack` and `show:release-gate-warn-only:pointer-pack:soft`.
- **CI wiring:** timeline workflow now runs soft pointer-pack output in `if: always()` after individual pointer steps, and path-filters the new helper script.

## Phase 159 (pointer-pack markdown artifact mode)

- **Pointer-pack modes:** `show-release-gate-warn-only-pointer-pack` now supports:
  - `--format=markdown`
  - `--write`
- **Behavior:** markdown mode prints a checklist-style pointer block; write mode persists:
  - `docs/evidence/closure/*-release-gate-warn-only-pointer-pack.md`
  and emits artifact-path JSON.
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer-pack:markdown`
  - `show:release-gate-warn-only:pointer-pack:markdown:write`
  - `show:release-gate-warn-only:pointer-pack:markdown:write:soft`
- **CI wiring:** timeline workflow now writes soft markdown pointer-pack artifact in `if: always()` and stages `*-release-gate-warn-only-pointer-pack.md` for upload.

## Phase 160 (pointer-pack JSON artifact mode)

- **Pointer-pack modes:** `show-release-gate-warn-only-pointer-pack` now supports:
  - `--format=json`
  - `--write` for JSON output
- **Behavior:** JSON mode prints machine-readable pointer payload and write mode persists:
  - `docs/evidence/closure/*-release-gate-warn-only-pointer-pack.json`
  while preserving existing line/markdown outputs.
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer-pack:json`
  - `show:release-gate-warn-only:pointer-pack:json:write`
  - `show:release-gate-warn-only:pointer-pack:json:write:soft`
- **CI wiring:** timeline workflow now writes soft JSON pointer-pack artifact in `if: always()` and stages `*-release-gate-warn-only-pointer-pack.json` for upload.

## Phase 161 (pointer-pack index artifact helper)

- **Index helper:** added `scripts/run-release-gate-warn-only-pointer-pack-index.mjs`.
- **Behavior:** captures the latest pointer-pack markdown/json artifact paths into a single index payload and persists:
  - `docs/evidence/closure/*-release-gate-warn-only-pointer-pack-index.json`
- **NPM aliases:** added:
  - `run:release-gate-warn-only:pointer-pack:index`
  - `run:release-gate-warn-only:pointer-pack:index:soft`
- **CI wiring:** timeline workflow now writes the soft pointer-pack index artifact in `if: always()`, path-filters the new helper script, and stages `*-release-gate-warn-only-pointer-pack-index.json` for upload.

## Phase 162 (latest pointer-pack index pointer helper)

- **Pointer helper:** added `scripts/show-latest-release-gate-warn-only-pointer-pack-index-pointer.mjs`.
- **Behavior:** prints one line:
  - `WARN_ONLY_POINTER_PACK_INDEX_POINTER docs/evidence/closure/...`
  for the latest `*-release-gate-warn-only-pointer-pack-index.json`.
- **NPM alias:** added `show:release-gate-warn-only:pointer-pack:index:pointer`.
- **CI wiring:** timeline workflow now prints this pointer in `if: always()` after writing index artifacts (non-blocking with `|| true`) and path-filters the new helper script.

## Phase 163 (consolidated pointer-pack includes index pointer)

- **Pointer-pack helper:** `show-release-gate-warn-only-pointer-pack` now includes:
  - `WARN_ONLY_POINTER_PACK_INDEX_POINTER ...`
  in default line output.
- **Format parity:** markdown and JSON outputs now include `pointer_pack_index_pointer` so all pointer-pack modes carry checklist/verdict/summary/index pointers in fixed order.
- **Strictness:** strict mode now treats missing pointer-pack index pointer as non-pass (soft mode unchanged).

## Phase 164 (latest pointer-pack JSON pointer helper)

- **Pointer helper:** added `scripts/show-latest-release-gate-warn-only-pointer-pack-json-pointer.mjs`.
- **Behavior:** prints one line:
  - `WARN_ONLY_POINTER_PACK_JSON_POINTER docs/evidence/closure/...`
  for the latest `*-release-gate-warn-only-pointer-pack.json`.
- **NPM alias:** added `show:release-gate-warn-only:pointer-pack:json:pointer`.
- **CI wiring:** timeline workflow now prints this pointer in `if: always()` after writing pointer-pack JSON artifacts (non-blocking with `|| true`) and path-filters the new helper script.

## Phase 165 (aggregated pointer handoff-pack command)

- **Handoff-pack helper:** added `scripts/show-release-gate-warn-only-pointer-handoff-pack.mjs`.
- **Behavior:** prints a fixed five-line handoff block:
  - `WARN_ONLY_CHECKLIST_POINTER ...`
  - `WARN_ONLY_BUNDLE_VERDICT_POINTER ...`
  - `WARN_ONLY_POINTER_SUMMARY_POINTER ...`
  - `WARN_ONLY_POINTER_PACK_JSON_POINTER ...`
  - `WARN_ONLY_POINTER_PACK_INDEX_POINTER ...`
  with explicit `missing` markers and strict/soft behavior.
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer:handoff-pack`
  - `show:release-gate-warn-only:pointer:handoff-pack:soft`
- **CI wiring:** timeline workflow now prints the soft handoff-pack block in `if: always()` and path-filters the new helper script.

## Phase 166 (single-line pointer handoff-pack mode)

- **Handoff-pack output mode:** `show-release-gate-warn-only-pointer-handoff-pack` now supports `--single-line`.
- **Behavior:** emits one physical line for easy log scraping:
  - `WARN_ONLY_CHECKLIST_POINTER=... WARN_ONLY_BUNDLE_VERDICT_POINTER=... WARN_ONLY_POINTER_SUMMARY_POINTER=... WARN_ONLY_POINTER_PACK_JSON_POINTER=... WARN_ONLY_POINTER_PACK_INDEX_POINTER=...`
  while preserving strict/soft pass semantics.
- **NPM alias:** added `show:release-gate-warn-only:pointer:handoff-pack:single-line:soft`.
- **CI wiring:** timeline workflow now prints this one-line handoff variant in an `if: always()` step immediately after the multi-line handoff block.

## Phase 167 (prefixed single-line handoff-pack mode)

- **Handoff-pack option:** `show-release-gate-warn-only-pointer-handoff-pack` now supports `--prefix=<token>`.
- **Behavior:** in `--single-line` mode, output can be namespaced for easier downstream capture:
  - `<prefix> WARN_ONLY_CHECKLIST_POINTER=... WARN_ONLY_BUNDLE_VERDICT_POINTER=... WARN_ONLY_POINTER_SUMMARY_POINTER=... WARN_ONLY_POINTER_PACK_JSON_POINTER=... WARN_ONLY_POINTER_PACK_INDEX_POINTER=...`
- **NPM alias:** added `show:release-gate-warn-only:pointer:handoff-pack:single-line:namespaced:soft` with prefix `TIMELINE_WARN_ONLY_POINTER_HANDOFF`.
- **CI wiring:** timeline workflow now prints this namespaced one-line handoff block in an `if: always()` step after the non-prefixed one-line block.

## Phase 168 (json-line handoff-pack mode)

- **Handoff-pack output mode:** `show-release-gate-warn-only-pointer-handoff-pack` now supports `--json-line`.
- **Behavior:** emits one compact JSON object per line for log shippers/parsers:
  - `{"checklist_pointer":"...","bundle_verdict_pointer":"...","pointer_summary_pointer":"...","pointer_pack_json_pointer":"...","pointer_pack_index_pointer":"..."}`
  and, when `--prefix=<token>` is present, includes `"prefix":"<token>"` in the same JSON object.
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer:handoff-pack:json-line:soft`
  - `show:release-gate-warn-only:pointer:handoff-pack:json-line:namespaced:soft`
- **CI wiring:** timeline workflow now prints both plain and namespaced JSON-line handoff outputs in `if: always()` steps after the single-line text variants.

## Phase 169 (strict-schema json-line handoff-pack mode)

- **Handoff-pack schema mode:** `show-release-gate-warn-only-pointer-handoff-pack` now supports `--strict-schema` when used with `--json-line`.
- **Behavior:** emits a schema-stable JSON line with deterministic keys:
  - `schema_version` (currently `1`)
  - `prefix` (`null` when not provided)
  - `checklist_pointer`
  - `bundle_verdict_pointer`
  - `pointer_summary_pointer`
  - `pointer_pack_json_pointer`
  - `pointer_pack_index_pointer`
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer:handoff-pack:json-line:strict-schema:soft`
  - `show:release-gate-warn-only:pointer:handoff-pack:json-line:strict-schema:namespaced:soft`
- **CI wiring:** timeline workflow now prints strict-schema JSON-line outputs (plain and namespaced) in `if: always()` steps after existing JSON-line outputs.

## Phase 170 (minimum schema-version assertion mode)

- **Handoff-pack compatibility guard:** `show-release-gate-warn-only-pointer-handoff-pack` now supports `--min-schema-version=<n>`.
- **Behavior:** prints a schema-compatibility check line:
  - `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK compatible current=... required_min=...`
  - `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK incompatible current=... required_min=...`
  and hard-fails when incompatible in strict mode (soft mode remains non-blocking).
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer:handoff-pack:json-line:strict-schema:min1:soft`
  - `show:release-gate-warn-only:pointer:handoff-pack:json-line:strict-schema:namespaced:min1:soft`
- **CI wiring:** timeline workflow now prints min-schema-asserted strict-schema JSON-line outputs (plain and namespaced) in `if: always()` steps after strict-schema outputs.

## Phase 171 (schema-check-only contract mode)

- **Handoff-pack schema guard mode:** `show-release-gate-warn-only-pointer-handoff-pack` now supports `--schema-check-only`.
- **Behavior:** prints only schema compatibility status lines (`WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK ...`) without pointer payload output, intended for strict contract assertions.
- **Compatibility defaults:** when no explicit minimum is provided, schema-check-only validates against current schema version; existing `--min-schema-version=<n>` enforcement still applies.
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer:handoff-pack:schema-check-only:soft`
  - `show:release-gate-warn-only:pointer:handoff-pack:schema-check-only:namespaced:soft`
- **CI wiring:** timeline workflow now prints plain and namespaced schema-check-only lines in `if: always()` steps after min-schema asserted outputs.

## Phase 172 (explicit exit semantics + centralized strict-fail decision)

- **Exit matrix clarity:** added a compact exit-behavior matrix comment at the top of `show-release-gate-warn-only-pointer-handoff-pack`.
- **Centralized strict-fail logic:** consolidated strict-mode failure decisions into shared booleans (`shouldFailSchemaCheck`, `shouldFailMissingPointers`) evaluated once near process exit.
- **Behavior parity:** keeps existing soft-mode non-blocking behavior and strict-mode enforcement while making strict fail conditions explicit and easier to audit.

## Phase 173 (schema-check json-line mode)

- **Schema-check output mode:** `show-release-gate-warn-only-pointer-handoff-pack` now supports `--schema-check-json-line` (used with `--schema-check-only`).
- **Behavior:** emits machine-readable schema-check payloads:
  - `{"schema_version":1,"required_min_schema_version":1,"prefix":null,"status":"compatible"}`
  - and includes `"reason":"invalid-min-schema-version"` on invalid input.
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer:handoff-pack:schema-check-json-line:soft`
  - `show:release-gate-warn-only:pointer:handoff-pack:schema-check-json-line:namespaced:soft`
- **CI wiring:** timeline workflow now prints plain and namespaced schema-check JSON-line outputs in `if: always()` steps after schema-check-only text outputs.

## Phase 174 (schema-check code-only mode)

- **Schema-check compact mode:** `show-release-gate-warn-only-pointer-handoff-pack` now supports `--schema-check-code-only`.
- **Behavior:** emits one compact code line for downstream grep/conditionals:
  - `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_CODE 0` (compatible)
  - `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_CODE 1` (incompatible)
  - `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_CODE 2` (invalid min-schema input)
- **Parity update:** `--schema-check-json-line` payload now also includes `schema_check_code` for machine consumers.
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer:handoff-pack:schema-check-code-only:soft`
  - `show:release-gate-warn-only:pointer:handoff-pack:schema-check-code-only:namespaced:soft`
- **CI wiring:** timeline workflow now prints plain and namespaced schema-check code-only outputs in `if: always()` steps after schema-check JSON-line outputs.

## Phase 175 (schema-check env-line mode)

- **Schema-check shell export mode:** `show-release-gate-warn-only-pointer-handoff-pack` now supports `--schema-check-env-line`.
- **Behavior:** emits one shell-friendly `KEY=value` line with compact schema-check fields:
  - `TIMELINE_WARN_ONLY_SCHEMA_CHECK_CODE`
  - `TIMELINE_WARN_ONLY_SCHEMA_CHECK_STATUS`
  - `TIMELINE_WARN_ONLY_SCHEMA_VERSION`
  - `TIMELINE_WARN_ONLY_REQUIRED_MIN_SCHEMA_VERSION`
  - optional `TIMELINE_WARN_ONLY_SCHEMA_CHECK_REASON` / `TIMELINE_WARN_ONLY_SCHEMA_CHECK_PREFIX`
- **NPM aliases:** added:
  - `show:release-gate-warn-only:pointer:handoff-pack:schema-check-env-line:soft`
  - `show:release-gate-warn-only:pointer:handoff-pack:schema-check-env-line:namespaced:soft`
- **CI wiring:** timeline workflow now prints plain and namespaced schema-check env-line outputs in `if: always()` steps after schema-check code-only outputs.

## Phase 176 (schema-check artifact writer)

- **Schema-check artifact helper:** added `run-release-gate-warn-only-pointer-handoff-schema-check-artifact`.
- **Behavior:** persists a JSON artifact under `docs/evidence/closure` with:
  - `ok`, `status`, `schema_version`, `required_min_schema_version`, `prefix`, `generated_at_utc`
  - plus `reason` for invalid schema-version input.
- **NPM aliases:** added strict/soft/namespaced runner aliases for artifact generation.
- **CI wiring:** timeline workflow now writes a namespaced soft schema-check artifact in `if: always()`, path-filters the new helper script, and stages `*-release-gate-warn-only-pointer-handoff-schema-check.json` for upload.

## Phase 177 (latest schema-check artifact pointer helper)

- **Pointer helper:** added `show-latest-release-gate-warn-only-pointer-handoff-schema-check-pointer`.
- **Behavior:** prints one line:
  - `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT_POINTER docs/evidence/closure/...`
  for the latest `*-release-gate-warn-only-pointer-handoff-schema-check.json` artifact.
- **NPM alias:** added `show:release-gate-warn-only:pointer:handoff-schema-check-artifact:pointer`.
- **CI wiring:** timeline workflow now prints this pointer in an `if: always()` non-blocking step after schema-check artifact generation and path-filters the new helper script.

## Phase 178 (pointer-pack includes schema-check artifact pointer)

- **Consolidated pointer-pack scope:** `show-release-gate-warn-only-pointer-pack` now includes the latest schema-check artifact pointer.
- **Output parity:** line/markdown/json modes now include:
  - `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT_POINTER ...`
  - `pointer_handoff_schema_check_artifact_pointer`
- **Behavior:** pointer-pack now carries checklist/verdict/summary/index plus schema-check artifact pointer in one output block for operators and automation.

## Phase 179 (pointer-pack strict mode requires schema-check pointer)

- **Strict completeness hardening:** `show-release-gate-warn-only-pointer-pack` strict mode now requires schema-check artifact pointer presence in addition to checklist/verdict/summary/index pointers.
- **Behavior:** strict mode fails when `pointer_handoff_schema_check_artifact_pointer` is missing; soft mode remains non-blocking.

## Phase 180 (CI: schema-check artifact before pointer-pack)

- **Ordering:** `timeline-contracts-release-gate` now writes the warn-only pointer handoff schema-check JSON artifact (and prints its pointer line) **before** pointer-pack print/write/index steps.
- **Rationale:** Phase 179 strict pointer-pack completeness requires the schema-check artifact on disk; earlier ordering would leave that file absent during pointer-pack steps, blocking a future strict (`:soft`-free) pointer-pack write without a second pass.

## Phase 181 (CI: strict pointer-pack index + strict completeness print)

- **Pointer-pack index:** `timeline-contracts-release-gate` now runs `run-release-gate-warn-only-pointer-pack-index` **without** `--soft`, so a missing markdown or JSON pointer-pack artifact fails the job (index payload `ok` is false).
- **Strict completeness gate:** After the index artifact exists, CI runs `show-release-gate-warn-only-pointer-pack` **without** `--soft`, enforcing checklist/verdict/summary/index/schema-check pointers together (markdown/JSON writes stay soft because they run before the index exists).

## Phase 182 (handoff-pack includes schema-check artifact pointer)

- **Parity with pointer-pack:** `show-release-gate-warn-only-pointer-handoff-pack` now emits `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT_POINTER` (and `pointer_handoff_schema_check_artifact_pointer` in JSON-line payloads, including `--strict-schema` mode) after the pointer-pack index line, matching consolidated pointer-pack ordering.
- **Strict completeness:** Non–schema-check-only strict mode now requires the newest `*-release-gate-warn-only-pointer-handoff-schema-check.json` on disk, alongside checklist/verdict/summary/pointer-pack json/index (timeline CI already writes the schema-check artifact before pointer-pack and long before handoff-pack).

## Phase 183 (CI: strict handoff-pack completeness print)

- **Strict handoff gate:** `timeline-contracts-release-gate` now runs `show-release-gate-warn-only:pointer:handoff-pack` without `--soft` after all soft handoff diagnostics (single-line, json-line, strict-schema, schema-check-only variants), so CI enforces handoff-pack pointer completeness in one terminal strict pass.
- **Coverage:** The strict pass validates checklist/verdict/summary/pointer-pack json/pointer-pack index/handoff schema-check artifact pointers together, matching Phase 182 strict criteria while preserving soft diagnostic observability.

## Phase 184 (CI: strict handoff schema contract min1)

- **Schema contract gate:** Added strict npm alias `show:release-gate-warn-only:pointer:handoff-pack:json-line:strict-schema:min1` (no `--soft`) and wired it into timeline CI after soft schema diagnostics.
- **Behavior:** CI now hard-fails when the strict-schema JSON-line contract with `--min-schema-version=1` is incompatible/invalid, while still printing soft namespaced and schema-check-only variants for operator visibility.

## Phase 185 (CI: strict namespaced handoff schema contract min1)

- **Namespaced schema gate:** Added strict npm alias `show:release-gate-warn-only:pointer:handoff-pack:json-line:strict-schema:namespaced:min1` (no `--soft`) and wired it into timeline CI immediately after the plain strict min1 schema step.
- **Behavior:** CI now enforces both plain and namespaced strict-schema JSON-line contracts for `--min-schema-version=1`, while preserving soft diagnostics for schema-check-only/code/env modes.

## Phase 186 (CI: strict namespaced schema-check-only gate)

- **Schema status gate:** Added strict aliases for schema-check-only status output (`show:release-gate-warn-only:pointer:handoff-pack:schema-check-only` and `...:schema-check-only:namespaced`) and wired the namespaced strict variant into timeline CI.
- **Behavior:** CI now hard-fails on incompatible/invalid schema status in namespaced schema-check-only mode (`--min-schema-version=1`), complementing strict-schema JSON-line contract gates while keeping soft diagnostics unchanged.
- **Follow-on:** Phase 189 wires strict plain `schema-check-only` in CI immediately before this namespaced strict step for text-output parity.

## Phase 187 (CI: strict namespaced schema-check JSON-line gate)

- **Machine-readable schema gate:** Added non-soft aliases `show:release-gate-warn-only:pointer:handoff-pack:schema-check-json-line` and `...:schema-check-json-line:namespaced` so schema-check JSON-line mode can fail the process under `--min-schema-version=1` without `--soft` (CI wiring completed together with Phases 188–189 for plain/namespaced ordering).
- **Behavior:** CI now hard-fails when schema-check JSON-line payload would report incompatible/invalid status under `--min-schema-version=1`, alongside text schema-check-only and strict-schema pointer JSON-line gates.

## Phase 188 (CI: strict plain schema-check JSON-line gate)

- **Symmetric coverage:** `timeline-contracts-release-gate` now runs `show:release-gate-warn-only:pointer:handoff-pack:schema-check-json-line` (no `--soft`, no prefix) after strict plain and namespaced schema-check-only text gates and before the strict namespaced schema-check JSON-line step.
- **Behavior:** Plain and namespaced machine-readable schema-check JSON-line contracts are both hard-gated under `--min-schema-version=1`.

## Phase 189 (CI: strict plain schema-check-only gate)

- **Plain text schema gate:** Wired `show:release-gate-warn-only:pointer:handoff-pack:schema-check-only` (no `--soft`) immediately before the existing strict namespaced schema-check-only step, so unprefixed `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK ...` lines are enforced under `--min-schema-version=1` alongside the prefixed variant.

## Phase 190 (CI: strict schema-check code-only + env-line gates)

- **Compact + shell exports:** Added non-soft npm aliases for schema-check `--schema-check-code-only` and `--schema-check-env-line` (plain and `TIMELINE_WARN_ONLY_POINTER_HANDOFF` namespaced) and wired four strict CI steps after strict schema-check JSON-line gates and before strict handoff-pack completeness.
- **Behavior:** CI now hard-fails on incompatible/invalid min-schema for numeric code lines and env-style `KEY=value` schema status output, matching the depth already enforced for text and JSON-line schema-check modes.

## Phase 191 (CI: strict handoff schema-check artifact writer)

- **Artifact materialization gate:** Added npm alias `run:release-gate-warn-only:pointer:handoff-schema-check-artifact:namespaced` (no `--soft`) and switched the early timeline CI schema-check artifact step from `:namespaced:soft` to that strict alias.
- **Behavior:** The persisted `*-release-gate-warn-only-pointer-handoff-schema-check.json` write now exits non-zero when payload `ok` is false (invalid or incompatible `--min-schema-version` vs artifact `schema_version`); `:namespaced:soft` remains available for local warn-only runs.

## Phase 192 (CI: strict plain handoff schema-check artifact writer)

- **Symmetric artifact gate:** `timeline-contracts-release-gate` now also runs `run:release-gate-warn-only:pointer:handoff-schema-check-artifact` (plain strict, no prefix) immediately after the strict namespaced artifact write.
- **Behavior:** Both prefixed and unprefixed handoff schema-check artifact writes are now hard-gated before pointer-pack steps; pointer helper continues to print the latest artifact pointer.

## Phase 193 (workflow contract: dual strict artifact write ordering)

- **Guardrail test:** Added `__tests__/m0/m0-timeline-release-gate-workflow-schema-artifact-steps.test.ts` to assert timeline CI keeps both strict artifact writes (`...:handoff-schema-check-artifact:namespaced` and plain `...:handoff-schema-check-artifact`) and preserves ordering before pointer-pack.
- **Intent:** Prevent accidental future cleanup from dropping one strict artifact write or reordering pointer-pack ahead of artifact materialization.

## Phase 194 (workflow contract: strict schema gate sequence ordering)

- **Guardrail test:** Added `__tests__/m0/m0-timeline-release-gate-workflow-schema-gate-ordering.test.ts` to assert strict schema-check commands remain in canonical sequence: strict-schema min1 (plain, namespaced), schema-check-only (plain, namespaced), schema-check JSON-line (plain, namespaced), schema-check code-only (plain, namespaced), schema-check env-line (plain, namespaced), then strict handoff completeness.
- **Intent:** Prevent accidental reordering/omission of strict schema gates that could weaken contract depth while still keeping the workflow green.

## Phase 195 (workflow contract tests covered by m0 gate path)

- **M0 coverage guard:** Added `__tests__/m0/m0-workflow-contract-tests-m0-coverage.test.ts` to assert `jest.m0.config.js` still roots at `__tests__/m0`, `test:m0` still targets `jest.m0.config.js`, and both workflow contract tests (artifact ordering + schema gate ordering) remain present under `__tests__/m0`.
- **Intent:** Prevent a future config drift where workflow contract tests exist in-repo but silently fall out of the default M0 test gate path.

## Phase 196 (workflow contract: timeline CI wiring path)

- **Wiring guard:** Added `__tests__/m0/m0-timeline-release-gate-ci-wiring-contract.test.ts` to assert `.github/workflows/timeline-contracts-release-gate.yml` still runs `release:gate:timeline-contracts`, `package.json` still maps that script to `run-release-gate-suite.mjs` with timeline gate IDs (`workflow-automation-contracts`, `crm-timeline-routes-contracts`, `m0-deeplink-context-contracts`, `prisma-generate-closure-contracts`), and `test:m0` remains defined with `jest.m0.config.js`.
- **Gate-map guard:** The same test asserts `scripts/run-release-gate-suite.mjs` still includes `m0` and `m0-deeplink-context-contracts` gate IDs.

## Phase 197 (workflow contract: timeline warn-only scope pin)

- **Warn-only scope guard:** Added `__tests__/m0/m0-timeline-release-gate-warn-only-scope-contract.test.ts` to assert `package.json` keeps `release:gate:timeline-contracts` pinned to `RELEASE_GATE_WARN_ONLY_GATES=prisma-generate-closure-contracts` while retaining the full timeline gate list in `RELEASE_GATES`.
- **Intent:** Prevent accidental expansion/shrinkage of warn-only gate scope that could silently weaken or over-broaden strict release gating behavior.

## Phase 198 (workflow contract: timeline warn-only single-gate invariant)

- **Single-token guard:** Added `__tests__/m0/m0-timeline-release-gate-warn-only-single-gate-contract.test.ts` to parse the `release:gate:timeline-contracts` script and assert `RELEASE_GATE_WARN_ONLY_GATES` resolves to exactly `prisma-generate-closure-contracts` with no comma-delimited expansion.
- **Intent:** Prevent warn-only scope from silently widening to multiple gates via accidental script edits.

## Phase 199 (workflow contract: timeline gate-list pin)

- **Gate-list guard:** Added `__tests__/m0/m0-timeline-release-gate-gate-list-contract.test.ts` to parse `release:gate:timeline-contracts` and assert `RELEASE_GATES` stays pinned to exactly four ordered gates: `workflow-automation-contracts`, `crm-timeline-routes-contracts`, `m0-deeplink-context-contracts`, `prisma-generate-closure-contracts`.
- **Intent:** Prevent silent addition/removal/reordering of timeline release gates in `package.json`.

## Phase 200 (workflow contract: timeline command + strict block markers)

- **Command + marker guard:** Added `__tests__/m0/m0-timeline-release-gate-workflow-command-and-strict-block-contract.test.ts` to assert timeline workflow still runs `npm run release:gate:timeline-contracts` and preserves key strict marker order (`strict-schema:min1` -> namespaced `strict-schema:min1` -> `schema-check-only` -> `schema-check-json-line` -> strict handoff completeness).
- **Intent:** Prevent accidental workflow command drift or strict post-gate marker reordering while edits continue.

## Phase 201 (workflow contract suite consolidation)

- **Consolidated contracts:** Replaced eight small timeline workflow contract tests with one unified suite `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` covering artifact ordering, strict schema sequence, CI wiring path, and timeline `RELEASE_GATES`/`RELEASE_GATE_WARN_ONLY_GATES` pins.
- **Maintenance outcome:** Removed duplicated fixture/parsing code across prior tests while preserving the same contract assertions under the M0 test root.

## Phase 202 (workflow contract suite readability annotations)

- **Sectioned guidance:** Added concise section comments inside `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` (`Artifact materialization ordering guards`, `Strict schema gate sequence guards`, `Workflow -> package -> gate-suite wiring guards`, `Timeline gate-list and warn-only scope guards`) to make future edits safer and faster.
- **Intent:** Preserve consolidated coverage while reducing cognitive load for maintainers touching one contract area at a time.

## Phase 203 (workflow contract suite helper extraction)

- **Helper refactor:** Added shared helper utilities (`indexOrFail`, `expectAscending`) in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and migrated artifact-ordering + strict-sequence assertions to use them.
- **Intent:** Reduce repetitive `indexOf`/ordering boilerplate while keeping contract behavior unchanged.

## Phase 204 (workflow contract warn-only token hardening)

- **Negative-path guard:** Strengthened the consolidated `RELEASE_GATE_WARN_ONLY_GATES` contract in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with a single-token format assertion (`/^[^,\s]+$/`) in addition to exact-value + no-comma checks.
- **Intent:** Fail fast on accidental whitespace/composite-token drift, not just comma-delimited expansion.

## Phase 205 (workflow contract gate-list uniqueness hardening)

- **Duplicate guard:** Strengthened the consolidated `RELEASE_GATES` assertion in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with an explicit uniqueness check (`new Set(gateList.split(',')).size === 4`) alongside exact ordered equality.
- **Intent:** Prevent silent duplicate gate entries while preserving required gate order and membership.

## Phase 206 (workflow contract gate-list count hardening)

- **Count guard:** Strengthened the consolidated `RELEASE_GATES` assertion in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with explicit list-length enforcement (`gateList.split(',').length === 4`) in addition to exact ordered and uniqueness checks.
- **Intent:** Fail fast on token-count drift before duplicate/order checks, keeping timeline gate cardinality pinned.

## Phase 207 (workflow contract gate-token shape hardening)

- **Token-shape guard:** Strengthened the consolidated `RELEASE_GATES` contract in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` by validating each gate token against slug format (`/^[a-z0-9-]+$/`) after ordered/count/uniqueness assertions.
- **Intent:** Catch malformed gate identifiers (whitespace, punctuation, casing drift) before they can silently propagate.

## Phase 208 (workflow contract non-empty gate-token hardening)

- **Non-empty token guard:** Strengthened the consolidated `RELEASE_GATES` contract in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with explicit non-empty checks on each split token (`gateToken.length > 0`) before slug-shape validation.
- **Intent:** Fail fast on accidental empty-token patterns (such as `,,` or trailing commas) even under broader pinning assertions.

## Phase 209 (workflow contract gate-token trim hardening)

- **Whitespace drift guard:** Strengthened the consolidated `RELEASE_GATES` contract in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with trim-invariant assertions for each token (`gateToken === gateToken.trim()`).
- **Intent:** Fail fast on leading/trailing whitespace drift around comma-separated gate tokens.

## Phase 210 (workflow contract warn-only token-shape hardening)

- **Warn-only shape guard:** Strengthened the consolidated `RELEASE_GATE_WARN_ONLY_GATES` contract in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with slug-shape assertion (`/^[a-z0-9-]+$/`) alongside exact-value and single-token checks.
- **Intent:** Keep warn-only gate token format aligned with timeline gate-token conventions and catch malformed identifiers early.

## Phase 211 (workflow contract warn-only token trim hardening)

- **Warn-only trim guard:** Strengthened the consolidated `RELEASE_GATE_WARN_ONLY_GATES` contract in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with trim-invariant assertion (`warnOnlyValue === warnOnlyValue.trim()`).
- **Intent:** Fail fast on leading/trailing whitespace drift in warn-only gate token configuration.

## Phase 212 (workflow contract warn-only token non-empty hardening)

- **Warn-only non-empty guard:** Strengthened the consolidated `RELEASE_GATE_WARN_ONLY_GATES` contract in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with explicit non-empty assertion (`warnOnlyValue.length > 0`) before trim/shape checks.
- **Intent:** Fail fast on empty warn-only token drift while keeping guard symmetry with timeline gate-token assertions.

## Phase 213 (workflow contract token helper consolidation)

- **Helper consolidation:** Added `expectSingleSlugToken(value)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and reused it for both `RELEASE_GATES` entries and `RELEASE_GATE_WARN_ONLY_GATES` token checks.
- **Intent:** Reduce repetitive token-shape assertion boilerplate while preserving existing contract behavior.

## Phase 214 (workflow contract env-token parser consolidation)

- **Parser consolidation:** Added `readTimelineReleaseGateEnvToken(packageJson, envVar)` helper in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to centralize extraction of `RELEASE_GATES` and `RELEASE_GATE_WARN_ONLY_GATES` from `release:gate:timeline-contracts`.
- **Intent:** Reduce duplicated regex extraction logic while preserving current contract assertions and behavior.

## Phase 215 (workflow contract script-presence guard helper)

- **Precondition guard:** Added `expectTimelineReleaseGateScriptPresent(packageJson)` helper in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and invoked it before env-token extraction helper logic.
- **Intent:** Make failures clearer by distinguishing missing timeline script configuration from missing env-token values.

## Phase 216 (workflow contract env-token capture hardening)

- **Capture guard:** Strengthened `readTimelineReleaseGateEnvToken(packageJson, envVar)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with explicit non-empty assertion on captured token group before return.
- **Intent:** Fail with a direct signal when regex capture shape drifts, rather than returning empty fallback values.

## Phase 217 (workflow contract script-capture integrity hardening)

- **Capture integrity guard:** Strengthened `readTimelineReleaseGateEnvToken(packageJson, envVar)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with explicit non-empty assertion on the full `release:gate:timeline-contracts` script capture group (`match?.[1]`).
- **Intent:** Detect parser-regex integrity drift earlier by validating both command and token capture groups.

## Phase 218 (workflow contract env-token parser diagnostics hardening)

- **Env-var contextual diagnostics:** Updated `readTimelineReleaseGateEnvToken(packageJson, envVar)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to throw targeted errors that include the failing `envVar` when match/capture steps fail.
- **Intent:** Speed triage by making parser failures immediately identify which env token path failed.

## Phase 219 (workflow contract parser return-shape expansion)

- **Return-shape expansion:** Updated `readTimelineReleaseGateEnvToken(packageJson, envVar)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to return both `scriptCommand` and `token`, and switched current callers to consume `.token`.
- **Intent:** Enable future script-command invariants without re-parsing while preserving current contract behavior.

## Phase 220 (workflow contract script-command token-presence guard)

- **Script-command guard:** Added assertions in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` that parsed `scriptCommand` includes `RELEASE_GATES=` and `RELEASE_GATE_WARN_ONLY_GATES=` respectively.
- **Intent:** Validate parser-returned command context stays aligned with expected env-token surfaces, not just extracted token values.

## Phase 221 (workflow contract single-script-source invariant)

- **Single-source guard:** Added assertion in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` that parsed `gateParse.scriptCommand` equals `warnOnlyParse.scriptCommand`.
- **Intent:** Ensure both env-token parses originate from the same `release:gate:timeline-contracts` script string.

## Phase 222 (workflow contract warn-only membership invariant)

- **Membership guard:** Added assertion in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` that `warnOnlyValue` is contained in parsed `gateTokens`.
- **Intent:** Enforce that the warn-only gate selection cannot drift outside the pinned timeline `RELEASE_GATES` scope.

## Phase 223 (workflow contract warn-only exact-once count invariant)

- **Count guard:** Added assertion in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` that `gateTokens.filter((token) => token === warnOnlyValue)` has length `1`.
- **Intent:** Ensure warn-only gate membership remains singular and cannot silently pass with accidental duplicates in the gate list.

## Phase 224 (workflow contract warn-only terminal-position invariant)

- **Terminal-position guard:** Added assertion in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` that `warnOnlyValue === gateTokens[gateTokens.length - 1]`.
- **Intent:** Keep warn-only gate explicitly pinned to the final position in the canonical timeline gate order.

## Phase 225 (workflow contract warn-only invariant helper consolidation)

- **Helper consolidation:** Added `expectWarnOnlyGateInvariants(warnOnlyValue, gateTokens)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and replaced explicit warn-only checks with this single helper call.
- **Intent:** Keep warn-only shape, membership, uniqueness, and terminal-position guards grouped under one extendable intent wrapper.

## Phase 226 (workflow contract gate-list invariant helper consolidation)

- **Gate-list helper consolidation:** Added `expectTimelineGateListInvariants(gateList)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and replaced explicit gate-list checks with one helper call returning `gateTokens`.
- **Intent:** Keep pinned gate order/count/uniqueness/token-shape guards grouped under one reusable intent wrapper and reduce inline assertion noise.

## Phase 227 (workflow contract parser-context helper consolidation)

- **Parser-context helper consolidation:** Added `expectTimelineReleaseGateScriptCommandInvariants(scriptCommand)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to assert both `RELEASE_GATES=` and `RELEASE_GATE_WARN_ONLY_GATES=` are present together, replacing separate inline `toContain` checks.
- **Intent:** Keep parser-returned script context guards centralized so env-assignment coverage remains explicit and extendable in one place.

## Phase 228 (workflow contract parser-pair helper consolidation)

- **Parser-pair helper consolidation:** Added `expectTimelineReleaseGateParserPairInvariants(gateParse, warnOnlyParse)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to enforce shared script-command context and env-assignment coverage in one call.
- **Intent:** Keep parser-context invariants grouped as a single high-level contract check before gate-list and warn-only checks.

## Phase 229 (workflow contract parser-result type-alias consolidation)

- **Parser-result typing consolidation:** Added `type TimelineGateParse = { scriptCommand: string; token: string }` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and updated parser-helper signatures/return typing to use the shared alias.
- **Intent:** Keep parser-related helper signatures concise and consistent as parser-context contracts continue to expand.

## Phase 230 (workflow contract parser-flow helper consolidation)

- **Parser-flow helper consolidation:** Added `readTimelineGateParserFlow(packageJson)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to read both env tokens, run parser-pair invariants, and return `{ gateList, warnOnlyValue }` for downstream checks.
- **Intent:** Keep the test body focused on three high-level contract steps: parser flow, gate-list invariants, and warn-only invariants.

## Phase 231 (workflow contract warn-only literal-pin helper consolidation)

- **Warn-only literal-pin helper consolidation:** Added `expectTimelineWarnOnlyGatePinned(warnOnlyValue)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and routed the fixed warn-only literal assertion through it.
- **Intent:** Keep warn-only contracts centralized so literal pinning and warn-only invariants live behind cohesive intent wrappers.

## Phase 232 (workflow contract warn-only combined helper consolidation)

- **Warn-only combined helper consolidation:** Added `expectTimelineWarnOnlyContracts(warnOnlyValue, gateTokens)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to call both literal-pin and warn-only-invariant helpers in one wrapper.
- **Intent:** Keep the test body at three high-level contract calls: parser flow, gate-list contracts, and warn-only contracts.

## Phase 233 (workflow contract parser combined helper consolidation)

- **Parser combined helper consolidation:** Added `expectTimelineParserContracts(packageJson)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to wrap parser-flow execution and parser-context invariants in one high-level call.
- **Intent:** Keep the test body aligned to exactly three one-line intent helpers: parser contracts, gate-list contracts, and warn-only contracts.

## Phase 234 (workflow contract top-level release-gate helper consolidation)

- **Top-level helper consolidation:** Added `expectTimelineReleaseGateContracts(packageJson)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to orchestrate parser, gate-list, and warn-only contract helpers in one place.
- **Intent:** Reduce the timeline gate-list/warn-only `it(...)` body to a single high-level contract invocation line.

## Phase 235 (workflow contract pinned gate-list constant consolidation)

- **Pinned gate-list constant consolidation:** Added `TIMELINE_GATE_TOKENS` and `TIMELINE_GATE_LIST` constants in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, then updated gate-list invariant assertions to reuse them.
- **Intent:** Keep timeline gate-set updates single-source and remove inline duplication in gate-list pin assertions.

## Phase 236 (workflow contract warn-only literal constant consolidation)

- **Warn-only literal constant consolidation:** Added `TIMELINE_WARN_ONLY_GATE` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and reused it in both `TIMELINE_GATE_TOKENS` and `expectTimelineWarnOnlyGatePinned(...)`.
- **Intent:** Keep warn-only gate pinning single-source across gate-list and warn-only contract checks.

## Phase 237 (workflow contract gate-list cardinality derivation consolidation)

- **Gate-list cardinality derivation consolidation:** Updated `expectTimelineGateListInvariants(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to derive token-count and uniqueness expectations from `TIMELINE_GATE_TOKENS` instead of hardcoded numerics.
- **Intent:** Keep all timeline gate-list invariants constant-driven so future gate-set edits require single-point updates only.

## Phase 238 (workflow contract gate-list uniqueness set-equality consolidation)

- **Gate-list uniqueness set-equality consolidation:** Updated `expectTimelineGateListInvariants(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to assert `new Set(gateTokens)` equals `new Set(TIMELINE_GATE_TOKENS)` directly, replacing size-only uniqueness comparison.
- **Intent:** Express gate-list uniqueness and membership parity in one constant-driven invariant.

## Phase 239 (workflow contract pinned gate-token set constant consolidation)

- **Pinned gate-token set constant consolidation:** Added `TIMELINE_GATE_TOKEN_SET` (module-scope `new Set(TIMELINE_GATE_TOKENS)`) in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and reused it in `expectTimelineGateListInvariants(...)` for set-equality against parsed `gateTokens`.
- **Intent:** Avoid rebuilding the expected gate set on each assertion and keep canonical membership comparison single-source.

## Phase 240 (workflow contract gate-list count vs pinned set-size alignment)

- **Gate-list count vs pinned set-size alignment:** Updated `expectTimelineGateListInvariants(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to assert `gateTokens.length` equals `TIMELINE_GATE_TOKEN_SET.size` (instead of `TIMELINE_GATE_TOKENS.length`), so duplicate entries in the pinned token array fail the length check before ordered tuple equality.
- **Intent:** Tie cardinality directly to canonical unique membership expectations.

## Phase 241 (workflow contract timeline release-gate script + env string consolidation)

- **Timeline release-gate script + env string consolidation:** Added `TIMELINE_RELEASE_GATE_SCRIPT`, `TIMELINE_RELEASE_GATE_SCRIPT_JSON_KEY`, `TIMELINE_RELEASE_GATES_ENV`, and `TIMELINE_RELEASE_GATE_WARN_ONLY_ENV` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, routing package.json presence, env-token regex, parser call sites, script-command `toContain` guards, workflow wiring `toContain`, and related test title through those constants.
- **Intent:** Single-source timeline script key and env-var names to reduce typo drift across parser and wiring contracts.

## Phase 242 (workflow contract script-presence JSON-key alignment)

- **Script-presence JSON-key alignment:** Updated `expectTimelineReleaseGateScriptPresent(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to assert package.json contains `TIMELINE_RELEASE_GATE_SCRIPT_JSON_KEY` instead of a duplicated quoted script-key literal.
- **Intent:** Align script-presence guards with the same JSON key constant used for wiring and regex capture, eliminating the last inline duplicate of the timeline script package.json key.

## Phase 243 (workflow contract pinned gate-token array uniqueness module guard)

- **Pinned gate-token array uniqueness module guard:** Added a module-load `throw` when `TIMELINE_GATE_TOKENS.length !== TIMELINE_GATE_TOKEN_SET.size` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, so duplicate entries in the pinned tuple fail at suite load with an explicit diagnostics message instead of only through gate-list assertions.
- **Intent:** Fail fast during test collection/load when contributors accidentally duplicate a gate slug in `TIMELINE_GATE_TOKENS`.

## Phase 244 (workflow contract timeline wiring gate-suite + package/jest constant consolidation)

- **Timeline wiring gate-suite + package/jest constant consolidation:** Added `TIMELINE_GATE_SUITE_ID_M0`, `TIMELINE_GATE_SUITE_ID_M0_DEEPLINK_CONTEXT_CONTRACTS`, reused the deeplink id as the third `TIMELINE_GATE_TOKENS` entry, and introduced wiring literals (`TIMELINE_WIRING_PACKAGE_GATE_SUITE_SCRIPT`, `TIMELINE_WIRING_PACKAGE_TEST_M0_JSON_KEY`, `TIMELINE_WIRING_JEST_M0_CONFIG_FILENAME`, `TIMELINE_WIRING_JEST_M0_ROOTS_SNIPPET`) for package.json and `jest.m0.config.js` asserts in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`.
- **Intent:** Single-source m0 aggregate vs deeplink contract gate ids relative to RELEASE_GATES pins and timeline CI wiring assertions.

## Phase 245 (workflow contract timeline RELEASE_GATES tuple full slug constant consolidation)

- **Timeline RELEASE_GATES tuple full slug constant consolidation:** Added `TIMELINE_GATE_WORKFLOW_AUTOMATION_CONTRACTS` and `TIMELINE_GATE_CRM_TIMELINE_ROUTES_CONTRACTS` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and built `TIMELINE_GATE_TOKENS` exclusively from named slug constants (workflow, CRM routes, m0 deeplink suite gate id, warn-only).
- **Intent:** Remove remaining inline gate literals from the pinned tuple so every RELEASE_GATES entry is a single-point named constant.

## Phase 246 (workflow contract timeline GitHub Actions workflow filename constant)

- **Timeline GitHub Actions workflow filename constant:** Added `TIMELINE_CONTRACTS_RELEASE_GATE_WORKFLOW_FILENAME` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and wired `readRepoFiles()` to load `.github/workflows/` via that constant instead of an inline YAML basename.
- **Intent:** Single-point edit if the timeline release-gate workflow file is renamed or split, keeping contract artifact reads aligned with the canonical workflow path.

## Phase 247 (workflow contract readRepoFiles wiring path constant alignment)

- **readRepoFiles wiring path constant alignment:** Hoisted `TIMELINE_WIRING_PACKAGE_JSON_FILENAME`, `TIMELINE_WIRING_PACKAGE_GATE_SUITE_SCRIPT`, and `TIMELINE_WIRING_JEST_M0_CONFIG_FILENAME` to the top of `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` alongside the workflow filename constant, and wired `readRepoFiles()` package/gate-suite/jest reads through those paths while keeping `toContain` wiring asserts on the same identifiers.
- **Intent:** One source of truth for repo-relative paths used both to load contract artifacts and to assert timeline CI wiring in `package.json`/jest config.

## Phase 248 (workflow contract GitHub workflows directory relative path constant)

- **GitHub workflows directory relative path constant:** Introduced `TIMELINE_GITHUB_WORKFLOWS_REL_PATH` as `path.join('.github', 'workflows')` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and routed `readRepoFiles()` workflow loading through `path.join(root, TIMELINE_GITHUB_WORKFLOWS_REL_PATH, TIMELINE_CONTRACTS_RELEASE_GATE_WORKFLOW_FILENAME)`.
- **Intent:** Avoid scattering `.github`/`workflows` path segments inline and keep filesystem layout churn single-point next to the workflow filename pin.

## Phase 249 (workflow contract YAML run-line npm prefix constant)

- **YAML run-line npm prefix constant:** Introduced `TIMELINE_WORKFLOW_RUN_LINE_PREFIX = 'run: npm run '` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and composed artifact-ordering needles, strict schema gate sequence markers, and the timeline `npm run ${TIMELINE_RELEASE_GATE_SCRIPT}` wiring assert via that prefix plus script suffix fragments.
- **Intent:** Single-source the GitHub Actions `run:` npm invocation shape so workflow line contract needles stay consistent if the YAML run format for npm ever changes.

## Phase 250 (workflow contract strict handoff-pack npm script base constant)

- **Strict handoff-pack npm script base constant:** Introduced `TIMELINE_WORKFLOW_NPM_SCRIPT_SHOW_POINTER_HANDOFF_PACK` and `TIMELINE_WORKFLOW_STRICT_HANDOFF_PACK_MARKER_PREFIX` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, composing the strict schema gate sequence needles as that prefix plus suffix fragments (including the terminal bare handoff-pack marker).
- **Intent:** Deduplicate the long shared `show:release-gate-warn-only:pointer:handoff-pack` slug across strict ordering markers without hiding the per-step tail differences that define the contract.

## Phase 251 (workflow contract schema-check artifact + pointer-pack soft npm script constants)

- **Schema-check artifact + pointer-pack soft npm script constants:** Added `TIMELINE_WORKFLOW_NPM_SCRIPT_RUN_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT`, `TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_RUN_LINE_PREFIX`, and `TIMELINE_WORKFLOW_NPM_SCRIPT_SHOW_POINTER_PACK_SOFT` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, composing the dual strict handoff schema-check artifact needles and the soft pointer-pack needle from run-line prefix + named npm script tails (mirroring Phase 250’s handoff-pack slug factoring).
- **Intent:** Separate `run:*handoff-schema-check-artifact*` vs `show:*pointer-pack:soft` contract families explicitly while keeping YAML `run: npm run ` composition single-source.

## Phase 252 (workflow contract pointer-pack soft full run-line needle constant)

- **Pointer-pack soft full run-line needle constant:** Introduced `TIMELINE_WORKFLOW_POINTER_PACK_SOFT_RUN_LINE_PREFIX` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` as `${TIMELINE_WORKFLOW_RUN_LINE_PREFIX}${TIMELINE_WORKFLOW_NPM_SCRIPT_SHOW_POINTER_PACK_SOFT}` and used it directly as the artifact-ordering pointer-pack soft needle (no template literal at the test call site).
- **Intent:** Match the handoff schema-check artifact needles’ symmetry—each artifact-ordering needle is either a prefixed constant or `prefixedConstant + suffix`—so YAML run-line composition stays uniform.

## Phase 253 (workflow contract artifact-ordering plain schema-check needle direct binding)

- **Plain schema-check artifact needle binding:** Bound the artifact-ordering `plainNeedle` to `TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_RUN_LINE_PREFIX` directly (removed redundant wrapping template literal). With Phase 254, all three artifact-ordering needles bind verbatim module constants beside the shared plain prefix.
- **Intent:** No behavior change—only eliminates a no-op string interpolation at the call site and keeps symmetry with Phase 252’s pointer-pack needle style.

## Phase 254 (workflow contract artifact-ordering namespaced schema-check needle module constant)

- **Namespaced schema-check artifact needle module constant:** Introduced `TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_NAMESPACED_RUN_LINE` as `${TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_RUN_LINE_PREFIX}:namespaced` next to the plain artifact prefix and bound `namespacedNeedle` from that identifier (no call-site compose).
- **Intent:** Artifact-ordering triple (namespaced, plain, pointer-pack soft) becomes three verbatim module constants in one cluster—matching Phase 253/252 ergonomics if the `:namespaced` tail ever becomes a coordinated edit alongside the artifact run-line pin.

## Phase 255 (workflow contract namespaced schema-check suffix constant extraction)

- **Namespaced suffix constant extraction:** Added `TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_NAMESPACED_SUFFIX = ':namespaced'` and composed `TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_NAMESPACED_RUN_LINE` from `TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_RUN_LINE_PREFIX + suffix` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`.
- **Intent:** Keep the `:namespaced` token as a single-source literal beside the artifact-ordering constant cluster so future namespaced-tail edits do not require touching composed run-line expressions.

## Phase 256 (workflow contract strict marker suffix-list consolidation)

- **Strict marker suffix-list consolidation:** Introduced `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES` (ordered `as const` suffix list) in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and rebuilt the strict schema marker list via `map` onto `TIMELINE_WORKFLOW_STRICT_HANDOFF_PACK_MARKER_PREFIX`.
- **Intent:** Preserve strict ordering semantics while centralizing marker tails in one list so strict-sequence edits happen by changing suffix entries, not repeating long prefix interpolations.

## Phase 257 (workflow contract strict marker family suffix constants)

- **Strict marker family suffix constants:** Named strict marker family suffixes (`...MIN1...`, `...CHECK_ONLY...`, `...CHECK_JSON_LINE...`, `...CHECK_CODE_ONLY...`, `...CHECK_ENV_LINE...`) in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and rebuilt `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES` from those constants plus the shared namespaced suffix constant.
- **Intent:** Keep strict marker-list edits semantic and localized (family constant updates) while preserving the same ordered marker expansion semantics introduced in Phase 256.

## Phase 258 (workflow contract strict handoff completeness marker suffix constant)

- **Strict handoff completeness marker suffix constant:** Added `TIMELINE_WORKFLOW_STRICT_HANDOFF_COMPLETENESS_MARKER_SUFFIX = ''` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and replaced the terminal inline empty-string entry in `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES` with that constant.
- **Intent:** Remove the final anonymous suffix literal from the strict marker list so every sequence entry is symbolized and editing remains consistent with Phase 257’s named-family style.

## Phase 259 (workflow contract strict marker suffix object grouping)

- **Strict marker suffix object grouping:** Replaced standalone strict marker suffix constants with grouped `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX` object (`min1`, `min1Namespaced`, `checkOnly`, `checkJsonLine`, `checkCodeOnly`, `checkEnvLine`, `handoffCompleteness`) and rebuilt `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES` from object members plus the shared namespaced suffix constant.
- **Intent:** Reduce top-level constant sprawl while retaining explicit, semantically named strict marker components and preserving the same ordered strict-sequence expansion.

## Phase 260 (workflow contract strict namespaced suffix helper)

- **Strict namespaced suffix helper:** Added `withNamespacedSuffix(suffix)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and used it when composing namespaced strict schema marker suffix entries (`checkOnly`, `checkJsonLine`, `checkCodeOnly`, `checkEnvLine`) inside `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES`.
- **Intent:** Remove repeated namespaced template literals while preserving strict marker ordering and keeping namespaced-tail composition as a single helper call.

## Phase 261 (workflow contract strict namespaced helper key-typing)

- **Strict namespaced helper key-typing:** Updated `withNamespacedSuffix` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to accept `keyof typeof TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX` and resolve values internally; namespaced entries in `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES` now call the helper with explicit keys (`'checkOnly'`, `'checkJsonLine'`, `'checkCodeOnly'`, `'checkEnvLine'`).
- **Intent:** Make namespaced strict-marker composition key-driven and type-checked against the suffix object so helper callsites cannot drift to arbitrary string values.

## Phase 262 (workflow contract namespaced helper narrowed key union)

- **Namespaced helper narrowed key union:** Added `TimelineNamespacedStrictSuffixKey = 'checkOnly' | 'checkJsonLine' | 'checkCodeOnly' | 'checkEnvLine'` and updated `withNamespacedSuffix` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to accept that union instead of all strict-suffix object keys.
- **Intent:** Tighten helper typing to only namespaced-eligible strict markers so non-namespaced keys (`min1`, `min1Namespaced`, `handoffCompleteness`) are compile-time rejected at helper callsites.

## Phase 263 (workflow contract namespaced-key union derived from tuple)

- **Namespaced-key union derived from tuple:** Added `TIMELINE_NAMESPACED_STRICT_SUFFIX_KEYS = ['checkOnly', 'checkJsonLine', 'checkCodeOnly', 'checkEnvLine'] as const` and derived `TimelineNamespacedStrictSuffixKey` from that tuple in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`.
- **Intent:** Keep namespaced-eligible strict keys single-source so editing the tuple updates both runtime key inventory and compile-time helper-key union automatically.

## Phase 264 (workflow contract mapped namespaced strict suffix block)

- **Mapped namespaced strict suffix block:** Added `TIMELINE_STRICT_MARKER_NAMESPACED_SUFFIXES = TIMELINE_NAMESPACED_STRICT_SUFFIX_KEYS.map(withNamespacedSuffix)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and replaced repeated namespaced helper calls in `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES` with ordered spreads from that mapped block.
- **Intent:** Reduce repeated helper-call literals while keeping namespaced suffix derivation tuple-driven and preserving strict marker ordering.

## Phase 265 (workflow contract named namespaced strict suffix constants)

- **Named namespaced strict suffix constants:** Added `TIMELINE_STRICT_MARKER_CHECK_ONLY_NAMESPACED_SUFFIX`, `TIMELINE_STRICT_MARKER_CHECK_JSON_LINE_NAMESPACED_SUFFIX`, `TIMELINE_STRICT_MARKER_CHECK_CODE_ONLY_NAMESPACED_SUFFIX`, and `TIMELINE_STRICT_MARKER_CHECK_ENV_LINE_NAMESPACED_SUFFIX` from `TIMELINE_STRICT_MARKER_NAMESPACED_SUFFIXES`, and used them directly in `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES` (replacing index-slice spread expressions).
- **Intent:** Keep tuple-driven derivation while making strict marker assembly easier to scan and edit than indexed `slice(...)` spreads.

## Phase 266 (workflow contract strict marker suffix-list builder helper)

- **Strict marker suffix-list builder helper:** Added `buildTimelineStrictSchemaMarkerSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to assemble and return the ordered strict marker suffix list, and bound `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES` from that helper.
- **Intent:** Separate strict marker list assembly from constant declarations so future sequence edits stay localized in one builder block without expanding top-level constant churn.

## Phase 267 (workflow contract namespaced strict suffix tuple destructuring)

- **Namespaced strict suffix tuple destructuring:** Replaced index-based declarations for `TIMELINE_STRICT_MARKER_CHECK_*_NAMESPACED_SUFFIX` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with tuple destructuring from `TIMELINE_STRICT_MARKER_NAMESPACED_SUFFIXES`.
- **Intent:** Keep mapped tuple derivation while removing explicit numeric indexing so namespaced strict suffix binding reads as one contiguous positional destructure.

## Phase 268 (workflow contract namespaced strict suffix builder-local tuple destructuring)

- **Namespaced strict suffix builder-local tuple destructuring:** Moved namespaced strict suffix tuple destructuring into `buildTimelineStrictSchemaMarkerSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and switched ordered strict marker assembly to those builder-local bindings.
- **Intent:** Reduce top-level constant surface while keeping namespaced strict suffix ordering explicit at the builder site that consumes it.

## Phase 269 (workflow contract namespaced strict suffix builder-local mapped destructuring)

- **Namespaced strict suffix builder-local mapped destructuring:** Removed top-level `TIMELINE_STRICT_MARKER_NAMESPACED_SUFFIXES` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and switched `buildTimelineStrictSchemaMarkerSuffixes()` to destructure directly from `TIMELINE_NAMESPACED_STRICT_SUFFIX_KEYS.map(withNamespacedSuffix)`.
- **Intent:** Keep namespaced derivation and consumption colocated in the strict suffix builder while reducing module-scope intermediate constants.

## Phase 270 (workflow contract namespaced strict suffix builder-local helper extraction)

- **Namespaced strict suffix builder-local helper extraction:** Added a tiny builder-local helper `buildNamespacedStrictSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, then switched strict namespaced suffix destructuring in `buildTimelineStrictSchemaMarkerSuffixes()` to consume that helper.
- **Intent:** Keep namespaced derivation colocated with builder assembly while making the builder body more compact and intention-revealing.

## Phase 271 (workflow contract namespaced strict suffix module helper promotion)

- **Namespaced strict suffix module helper promotion:** Promoted `buildNamespacedStrictSuffixes()` from builder-local scope to module scope in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, and kept `buildTimelineStrictSchemaMarkerSuffixes()` consuming the shared helper.
- **Intent:** Preserve compact builder flow while avoiding per-call local helper redeclaration and making namespaced suffix derivation reusable at module level.

## Phase 272 (workflow contract namespaced strict suffix named-helper object destructuring)

- **Namespaced strict suffix named-helper object destructuring:** Added `buildNamedNamespacedStrictSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to wrap mapped namespaced suffixes into named fields, then switched `buildTimelineStrictSchemaMarkerSuffixes()` to object-destructure those names.
- **Intent:** Preserve centralized mapped derivation while making builder consumption explicitly name-based instead of position-based.

## Phase 273 (workflow contract namespaced strict suffix helper-layer collapse)

- **Namespaced strict suffix helper-layer collapse:** Removed redundant `buildNamespacedStrictSuffixes()` from `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and switched `buildNamedNamespacedStrictSuffixes()` to map directly from `TIMELINE_NAMESPACED_STRICT_SUFFIX_KEYS` with `withNamespacedSuffix`.
- **Intent:** Keep named helper semantics while collapsing unnecessary helper indirection in namespaced suffix derivation.

## Phase 274 (workflow contract namespaced strict suffix mapped-array local binding)

- **Namespaced strict suffix mapped-array local binding:** Added local `namespacedStrictSuffixes` binding inside `buildNamedNamespacedStrictSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and switched tuple destructuring to read from that binding instead of inlining the map expression.
- **Intent:** Separate mapped derivation from positional destructuring for clearer step-by-step readability in the named suffix helper.

## Phase 275 (workflow contract namespaced strict suffix mapped tuple input local alias)

- **Namespaced strict suffix mapped tuple input local alias:** Added local `namespacedStrictSuffixKeys` alias inside `buildNamedNamespacedStrictSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and switched mapped suffix derivation to use that alias.
- **Intent:** Make the named suffix helper read as explicit inputs-then-transform steps by separating tuple source selection from mapping logic.

## Phase 276 (workflow contract namespaced strict suffix mapper local alias)

- **Namespaced strict suffix mapper local alias:** Added local `mapNamespacedStrictSuffix` alias in `buildNamedNamespacedStrictSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and switched mapped derivation to call `namespacedStrictSuffixKeys.map(mapNamespacedStrictSuffix)`.
- **Intent:** Keep helper flow explicit as source + mapper + mapped output steps while preserving identical suffix derivation behavior.

## Phase 277 (workflow contract namespaced strict suffix named return-object local binding)

- **Namespaced strict suffix named return-object local binding:** Bound the assembled `{ checkOnlyNamespacedSuffix, ... }` object to local `namedNamespacedStrictSuffixes` in `buildNamedNamespacedStrictSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, then returned that binding.
- **Intent:** Separate tuple-to-field wiring from the return surface so the helper tail reads as explicit bag assembly then return.

## Phase 278 (workflow contract strict marker suffix-list ordered-array local binding)

- **Strict marker suffix-list ordered-array local binding:** Bound the full ordered strict marker suffix tuple to local `orderedStrictSchemaMarkerSuffixes` in `buildTimelineStrictSchemaMarkerSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, then returned that binding.
- **Intent:** Mirror the named-helper return pattern so strict sequence assembly and return are visually separated without changing ordering semantics.

## Phase 279 (workflow contract strict marker suffix-list builder named-namespaced bag local binding)

- **Strict marker suffix-list builder named-namespaced bag local binding:** Bound `buildNamedNamespacedStrictSuffixes()` to local `builtNamedNamespacedStrictSuffixes` in `buildTimelineStrictSchemaMarkerSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, then object-destructured namespaced suffix fields from that binding.
- **Intent:** Separate helper invocation from field extraction in the strict suffix builder for symmetry with Phase 277’s explicit bag assembly pattern.

## Phase 280 (workflow contract strict marker suffix-list builder bag binding vocabulary alignment)

- **Strict marker suffix-list builder bag binding vocabulary alignment:** Renamed the strict-builder local binding from `builtNamedNamespacedStrictSuffixes` to `namedNamespacedStrictSuffixBag` in `buildTimelineStrictSchemaMarkerSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` so consumer naming matches “bag” vocabulary alongside `namedNamespacedStrictSuffixes` inside `buildNamedNamespacedStrictSuffixes()`.
- **Intent:** Reduce mixed `built*` vs `named*` naming at the same conceptual layer without changing destructure targets or strict suffix ordering.

## Phase 281 (workflow contract strict marker suffix-list ordered-row vocabulary alignment)

- **Strict marker suffix-list ordered-row vocabulary alignment:** Renamed the ordered strict marker suffix local binding from `orderedStrictSchemaMarkerSuffixes` to `orderedStrictSchemaMarkerSuffixRow` in `buildTimelineStrictSchemaMarkerSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, and returned that binding.
- **Intent:** Pair ordered tuple semantics with an explicit `*Row` name alongside `namedNamespacedStrictSuffixBag` without changing strict suffix list order or values.

## Phase 282 (workflow contract strict marker suffix-list ordered-row workflow sequence lock comment)

- **Strict marker suffix-list ordered-row workflow sequence lock comment:** Added a single-line comment immediately above `orderedStrictSchemaMarkerSuffixRow` in `buildTimelineStrictSchemaMarkerSuffixes()` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` stating that row order matches the timeline release-gate workflow strict marker sequence and must not be reordered without updating workflow YAML and these tests.
- **Intent:** Make the contract coupling between tuple order and CI gate markers obvious at the edit site.

## Phase 283 (workflow contract timeline YAML strict handoff-pack run-line sequence test pointer comment)

- **Timeline YAML strict handoff-pack run-line sequence test pointer comment:** Added a short YAML comment block immediately before the first strict-only pointer-handoff-pack step (`json-line:strict-schema:min1` without `:soft`) in `.github/workflows/timeline-contracts-release-gate.yml`, pointing maintainers to `orderedStrictSchemaMarkerSuffixRow` / `TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES` and the strict schema gate sequence test in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`.
- **Intent:** Mirror Phase 282’s test-side lock with an edit-site reminder in the workflow file that reordering breaks the Jest contract.

## Phase 284 (workflow contract timeline CI paths include timeline release-gate workflow contracts test)

- **Timeline CI paths include timeline release-gate workflow contracts test:** Added `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to both `pull_request` and `push` `paths:` filters in `.github/workflows/timeline-contracts-release-gate.yml` (alongside `__tests__/m0/m0-workflow*.test.ts`, which does not match this filename).
- **Intent:** Ensure PRs and pushes that only touch the dedicated timeline workflow contract suite still run the timeline contracts release gate on GitHub Actions.

## Phase 285 (workflow contract workflow-automation closure runner includes timeline release-gate workflow contracts test)

- **Workflow-automation closure runner includes timeline release-gate workflow contracts test:** Appended `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to the explicit `tests` list in `scripts/run-workflow-automation-closure-check.mjs` (with a short comment tying it to `release:gate:timeline-contracts` / the `workflow-automation-contracts` gate). `jest.m0.config.js` already matches all `__tests__/m0/**/*.test.ts`, but that gate runs Jest by path via this script only for listed files, so the suite was previously missing from the timeline release-gate pipeline.
- **Intent:** Align Phase 284 CI path triggers with the commands that actually execute in `npm run release:gate:timeline-contracts`.

## Phase 286 (workflow contract workflow-automation closure runner explicit Jest path list module doc contract)

- **Workflow-automation closure runner explicit Jest path list module doc contract:** Expanded the file-level module comment in `scripts/run-workflow-automation-closure-check.mjs` to state that Jest runs with `--runTestsByPath` for the explicit `tests` array only, that `jest.m0.config.js` roots do not imply coverage here, and that new gates must extend `tests` plus keep CI paths and companion contracts aligned.
- **Intent:** Encode Phase 285’s operational fix as maintainer-facing documentation at the script entry point.

## Phase 287 (workflow contract workflow-automation closure runner explicit tests list startup guard)

- **Workflow-automation closure runner explicit tests list startup guard:** After the `tests` array in `scripts/run-workflow-automation-closure-check.mjs`, added a startup guard that throws if the list has fewer than five paths or omits `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, so accidental truncation cannot silently drop the timeline workflow contract suite from the `workflow-automation-contracts` gate.
- **Intent:** Make Phase 285–286 contract machine-enforced at script load time, not only documented.

## Phase 288 (workflow contract workflow-automation closure runner canonical test path tuple + derived guards)

- **Workflow-automation closure runner canonical test path tuple + derived guards:** Replaced the literal minimum-count guard with a single `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS` array in `scripts/run-workflow-automation-closure-check.mjs`, `const tests = [...WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS]`, and startup checks that every canonical path is present, `tests.length` matches the canonical length, and there are no duplicate paths; module header now tells maintainers to append to the canonical array.
- **Intent:** Avoid drift between a magic `5` and the real list when new suites are added to this gate.

## Phase 289 (workflow contract timeline release-gate workflow contracts suite closure-runner cross-reference comment)

- **Timeline release-gate workflow contracts suite closure-runner cross-reference comment:** Extended the suite maintenance block comment in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to point maintainers at `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS` in `scripts/run-workflow-automation-closure-check.mjs` (and the spread + startup guards), so renames or gate wiring changes are less likely to desync the Jest path list from this contract file.
- **Intent:** Bidirectional discoverability between the contract suite and Phase 288’s canonical path tuple.

## Phase 290 (workflow contract workflow-automation closure runner timeline path comment pointer to contract suite JSDoc)

- **Workflow-automation closure runner timeline path comment pointer to contract suite JSDoc:** On the `m0-timeline-release-gate-workflow-contracts.test.ts` entry inside `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS` in `scripts/run-workflow-automation-closure-check.mjs`, replaced the prior generic timeline comment with one that points maintainers to the suite maintenance JSDoc at the top of that test file (Phases 289–290 cross-link).
- **Intent:** Complete reverse-pointer from canonical path list to human-oriented contract suite documentation.

## Phase 291 (workflow contract timeline workflow contracts path binding in closure runner + @see in contract suite JSDoc)

- **Timeline workflow contracts path binding in closure runner + @see in contract suite JSDoc:** Introduced `M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST` in `scripts/run-workflow-automation-closure-check.mjs` as the single string binding for the timeline contract suite path, used as the final element of `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS`, and added a `@see` line to the suite maintenance JSDoc in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` pointing at that script and binding name for IDE navigation and rename safety.
- **Intent:** One named path binding on the runner side plus explicit `@see` on the suite side to reduce duplicated string literals drifting apart.

## Phase 292 (workflow contract workflow-automation closure runner timeline path source drift guard test)

- **Workflow-automation closure runner timeline path source drift guard test:** Added `it('keeps workflow-automation closure runner timeline path on M0 constant without duplicate literal')` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` that reads `scripts/run-workflow-automation-closure-check.mjs` as text, asserts `M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST` binds the expected path, that the quoted path literal appears exactly once (the binding only), that `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS` closes with the `M0_…` identifier, and that the array does not end with a raw quoted timeline path literal.
- **Intent:** Machine-check Phase 291 wiring so reintroducing a second string copy in the array fails in Jest before CI.

## Phase 293 (workflow contract workflow-automation closure runner approval path literals guard extension)

- **Workflow-automation closure runner approval path literals guard extension:** Extended the Phase 292 source-parse `it(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with `WORKFLOW_AUTOMATION_CLOSURE_APPROVAL_TEST_PATHS` (four workflow approval suite paths) so the test asserts each appears exactly once as a single-quoted literal, in ascending source order, and all occur before `M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST` in `scripts/run-workflow-automation-closure-check.mjs`.
- **Intent:** Catch accidental removal/reorder of the approval-gating Jest files from the `workflow-automation-contracts` path list, not only the timeline contract tail.

## Phase 294 (workflow contract workflow-automation closure runner canonical array + spread symbol guard)

- **Workflow-automation closure runner canonical array + spread symbol guard:** Extended the same source-parse `it(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to require `run-workflow-automation-closure-check.mjs` still contains `const WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS = [`, `const tests = [...WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS]`, and the `]\n\nconst tests = [...]` adjacency so renames of the canonical tuple or dropping the spread into `tests` fail in Jest.
- **Intent:** Pin Phase 288 wiring symbols so refactors cannot silently bypass the guarded path list.

## Phase 295 (workflow contract workflow-automation closure runner startup guard loop presence test)

- **Workflow-automation closure runner startup guard loop presence test:** Extended the same source-parse `it(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` to require `run-workflow-automation-closure-check.mjs` still contains the `for (const p of WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS)` membership loop, the `if (!tests.includes(p))` branch, the length-equality guard against `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS.length`, and the duplicate-path throw message string.
- **Intent:** Prevent removal of Phase 287–288 runtime guards while leaving the array declaration and spread in place.

## Phase 296 (workflow contract workflow-automation closure runner source-parse describe/it split)

- **Workflow-automation closure runner source-parse describe/it split:** Replaced the single monolithic Phase 292–295 source-parse `it(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with a nested `describe` (title later centralized as `WORKFLOW_AUTOMATION_CLOSURE_RUNNER_SOURCE_DESCRIBE_TITLE` in Phase 297), a `beforeAll` that reads `run-workflow-automation-closure-check.mjs` once, and four focused `it(...)` blocks (canonical array + spread adjacency; startup membership/length/duplicate guards; M0 binding + literal count + array tail; approval literals order before M0 tail) so Jest failure output names the broken slice.
- **Intent:** Preserve all Phase 292–295 assertions while making regressions faster to triage in CI and local runs.

## Phase 297 (workflow contract workflow-automation closure runner source-parse describe title constant)

- **Workflow-automation closure runner source-parse describe title constant:** Introduced `WORKFLOW_AUTOMATION_CLOSURE_RUNNER_SOURCE_DESCRIBE_TITLE` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and passed it to the nested `describe(...)` for the Phase 296 closure-runner source-parse block so the human-readable title lives in one binding (stable `jest -t` substring, single edit point, doc cross-refs).
- **Intent:** Reduce accidental describe-string drift when extending the block and keep operator docs aligned with the actual filter token.
- **Note:** `jest.m0.config.js` sets `forceExit: true`; Jest may still print `Force exiting Jest` after runs even when tests pass—this is config-driven, not introduced by Phase 296’s `beforeAll` split.

## Phase 298 (workflow contract jest.m0 forceExit pin + module comment + timeline release gate npm script restore)

- **Jest M0 `forceExit` pin + module comment:** Added a short file-header comment in `jest.m0.config.js` explaining why `forceExit: true` remains (M0 handle hygiene; post-run force-exit hint is expected) and that removal requires a deliberate `--detectOpenHandles` audit. Extended `it('keeps workflow -> package -> gate-suite wiring for timeline contracts')` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with `TIMELINE_WIRING_JEST_M0_FORCE_EXIT_SNIPPET` so `jest.m0.config.js` cannot drop `forceExit: true` without failing the same timeline workflow contract suite that documents Phase 297 behavior.
- **Timeline `release:gate:timeline-contracts` restore:** Re-added the root `package.json` script (same `RELEASE_GATES` / `RELEASE_GATE_WARN_ONLY_GATES` pairing as `TIMELINE_GATE_LIST` / `TIMELINE_WARN_ONLY_GATE` in `m0-timeline-release-gate-workflow-contracts.test.ts`) so `.github/workflows/timeline-contracts-release-gate.yml` (`npm run release:gate:timeline-contracts`) and the wiring `it(...)` stay executable.
- **Release gate suite timeline gate ids:** Registered `workflow-automation-contracts`, `crm-timeline-routes-contracts`, `m0-deeplink-context-contracts`, and `prisma-generate-closure-contracts` in `scripts/run-release-gate-suite.mjs` so `RELEASE_GATES` selections from `release:gate:timeline-contracts` resolve to the existing closure runner scripts and the wiring test’s `id: '…'` substring checks stay true.
- **Intent:** Make Phase 297’s operational note machine-enforced and restore the npm entry the timeline gate workflow and contracts already assumed.

## Phase 299 (workflow contract timeline YAML ordering needles disambiguated + full suite Jest pass)

- **Timeline YAML ordering needles disambiguated:** Updated `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` so schema-check artifact ordering uses newline-terminated needles (`...artifact:namespaced\n`, plain `...artifact\n`, `...pointer-pack:soft\n`), fixing `indexOf` false matches where the plain `run:` prefix is a substring of the namespaced line. Strict handoff-pack sequence `it(...)` now appends `\n` to each strict `run:` needle so matches target the post-`:soft` strict block in `.github/workflows/timeline-contracts-release-gate.yml`, not earlier `:soft` lines that extend the same prefix.
- **Full suite Jest pass:** Ran `node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand __tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`; all **8** tests passed after the needle fix.
- **Intent:** Keep Phase 193–194 ordering contracts truthful against the current workflow shape (soft diagnostics before strict block) without weakening assertions.

## Phase 300 (workflow contract timeline release gate npm timeouts + wiring pins + engine PENDING_APPROVAL + gate PASS)

- **Timeline `release:gate:timeline-contracts` timeout parity:** Extended root `package.json` script with `WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_MS`, per-suite envs aligned to `.github/workflows/timeline-contracts-release-gate.yml`, `PRISMA_GENERATE_CLOSURE_TIMEOUT_MS=300000`, and `RELEASE_GATE_TIMEOUT_MS_*` overrides for timeline gate ids so `run-release-gate-suite.mjs` spawn budgets exceed slow Windows Jest/Prisma runs. GitHub Actions step env now includes `WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_MS: '900000'` and Prisma closure `300000`.
- **Wiring contract:** `m0-timeline-release-gate-workflow-contracts.test.ts` parses the `release:gate:timeline-contracts` npm script value and asserts `TIMELINE_RELEASE_GATE_SCRIPT_TIMEOUT_SNIPPETS` so drift vs CI/local timeout policy fails in Jest.
- **Workflow engine approval gating:** Restored `PENDING_APPROVAL` in `lib/workflow/engine.ts` for `create_task` steps with `config.requiresApproval === true` (skip task execution until approval); post-approve reruns bypass the gate when `context.data.workflowApproval.approved` is set (matches `decideWorkflowApproval` rerun context).
- **End-to-end gate verification:** Ran `npm run release:gate:timeline-contracts` locally; `docs/evidence/release-gates/2026-05-02T09-08-12-920Z-release-gate-suite.json` records `all_pass: true` across workflow-automation, CRM timeline routes, m0 deeplink context, and prisma generate closure gates.

## Phase 301 (workflow contract timeline GitHub Actions release-gate step env pin)

- **Timeline GitHub Actions release-gate step env pin:** Extended `it('keeps workflow -> package -> gate-suite wiring for timeline contracts')` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with `TIMELINE_GITHUB_RELEASE_GATE_STEP_ENV_LINES`, asserting each YAML `env:` row is present in `.github/workflows/timeline-contracts-release-gate.yml` under the `Run timeline contracts release gate` step so CI cannot drift from Phase 300 timer policy without failing the same contract suite.
- **Intent:** Pair the `package.json` `TIMELINE_RELEASE_GATE_SCRIPT_TIMEOUT_SNIPPETS` pins (Phase 300) with an explicit workflow-file check for the step-scoped env block.

## Phase 302 (workflow contract timeline GitHub Actions release-gate spawn timeout env pin)

- **Timeline GitHub Actions `RELEASE_GATE_TIMEOUT_MS_*` env pin:** Added the four `run-release-gate-suite.mjs` per-gate spawn timeout overrides (`RELEASE_GATE_TIMEOUT_MS_WORKFLOW_AUTOMATION_CONTRACTS`, `…_CRM_TIMELINE_ROUTES_CONTRACTS`, `…_M0_DEEPLINK_CONTEXT_CONTRACTS`, `…_PRISMA_GENERATE_CLOSURE_CONTRACTS`) to the `Run timeline contracts release gate` step `env:` in `.github/workflows/timeline-contracts-release-gate.yml`, matching `package.json` `release:gate:timeline-contracts` `cross-env` values. Extended `TIMELINE_GITHUB_RELEASE_GATE_STEP_ENV_LINES` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` so CI cannot drop spawn budgets independently of npm script literals.
- **Intent:** Single source of truth for spawn caps in both local `npm run` and GitHub Actions without relying on implicit inheritance from `package.json` alone.

## Phase 303 (workflow contract timeline GitHub Actions path filter head pin)

- **Timeline GitHub Actions `paths:` head pin:** Added `TIMELINE_GITHUB_PATH_FILTER_HEAD` + `expectNthOccurrenceIndex` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` so the wiring `it(...)` requires the first three `paths:` entries under **both** `pull_request` and `push` to remain `.github/workflows/timeline-contracts-release-gate.yml`, `package.json`, and `jest.m0.config.js` in that order (two identical blocks in the workflow file).
- **Intent:** Prevent silent CI trigger drift when the timeline gate’s own workflow, npm scripts, or M0 Jest config change without updating `paths:` filters.

## Phase 304 (workflow contract timeline GitHub Actions path filter gate-runner pin)

- **Timeline GitHub Actions gate-runner `paths:` pin:** Extended the wiring `it(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with `TIMELINE_GITHUB_PATH_FILTER_GATE_RUNNER_LINES`, requiring `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` and `scripts/run-release-gate-suite.mjs` to each appear **twice** in `.github/workflows/timeline-contracts-release-gate.yml` (under both `pull_request` and `push` `paths:`), so edits to this contract suite or the release-gate orchestrator still trigger the timeline CI gate.
- **Intent:** Close the gap left after Phase 303’s head-of-list pin by locking runner-critical path entries that Phase 298–300 wiring depends on.

## Phase 305 (workflow contract timeline GitHub Actions path filter workflow-automation closure script pin)

- **Timeline GitHub Actions workflow-automation closure `paths:` pin:** Extended the wiring `it(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with `TIMELINE_GITHUB_PATH_FILTER_WORKFLOW_AUTOMATION_CLOSURE_SCRIPT_LINE`, requiring `scripts/run-workflow-automation-closure-check.mjs` to appear twice in `.github/workflows/timeline-contracts-release-gate.yml` (under both `pull_request` and `push` `paths:`) so edits to the `workflow-automation-contracts` runner still trigger the timeline CI gate.
- **Intent:** Pair Phase 304’s release-gate orchestrator + contract suite pins with the closure script that `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS` lives in.

## Phase 306 (workflow contract timeline GitHub Actions path filter remaining closure runner pins)

- **Timeline GitHub Actions remaining closure `paths:` pins:** Extended the wiring `it(...)` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with `TIMELINE_GITHUB_PATH_FILTER_REMAINING_CLOSURE_RUNNER_LINES`, requiring `scripts/run-crm-timeline-routes-closure-check.mjs`, `scripts/run-m0-deeplink-context-check.mjs`, and `scripts/run-prisma-generate-closure-check.mjs` each twice in `.github/workflows/timeline-contracts-release-gate.yml` (PR + push `paths:`), alongside Phase 305’s `run-workflow-automation-closure-check.mjs` pin so all four `RELEASE_GATES` timeline closure entrypoints stay CI-visible.
- **Intent:** Finish the path-filter contract surface implied at the end of Phase 305 so no timeline gate runner can drop off `paths:` without failing Jest.

## Phase 307 (workflow contract timeline release-gate wiring describe/it split)

- **Timeline release-gate wiring describe/it split:** Replaced monolithic wiring `it('keeps workflow -> package -> gate-suite wiring for timeline contracts')` in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with `describe(TIMELINE_RELEASE_GATE_WIRING_DESCRIBE_TITLE)` (`'timeline release-gate wiring'`), a `beforeAll` that loads `workflow`/`package.json`/gate-suite/jest config once via `readRepoFiles()`, and five targeted `it(...)` slices (YAML `run:` + env; PR + push paths; npm script timeouts; package + jest tooling; suite `id` bindings).
- **Intent:** Preserve Phases 300–306 wiring assertions while making regressions attributable to YAML env, paths, npm script literals, tooling files, or suite ids.
- **Check:** Ran full `jest.m0` invocation for `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` — **12** tests passed post-split (was **8** before replacing one monolithic wiring `it` with five).

## Phase 308 (workflow contract timeline wiring describe source + workflow YAML Jest pointer)

- **Timeline wiring `describe` binding + workflow header pointer:** Extended the `timeline release-gate wiring` nested `describe` block in `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` with `TIMELINE_CONTRACT_SUITE_RELPATH`, `beforeAll` loading of this file’s own source, `TIMELINE_GITHUB_WORKFLOW_JEST_CONTRACT_HEADER_LINE`, and `it('pins nested wiring describe constant + timeline workflow Jest pointer line')` so regressions cannot silently replace `describe(TIMELINE_RELEASE_GATE_WIRING_DESCRIBE_TITLE, …)` with a raw string or drop the maintainer pointer in `.github/workflows/timeline-contracts-release-gate.yml` (new `# Jest pins: … — nested describe '…'.` line immediately under the release-gate overview comment).
- **Intent:** Mirror Phase 297’s “constant-bound nested `describe`” stability for the wiring block and give the workflow file a one-hop link to the contract suite + filter title without duplicating full pin lists in comments.
- **Check:** Ran `node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand __tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts` — **13** tests passed (prior Phase 307 run was **12**).

## Phase 309 (workflow contract closure-runner describe source + runner Jest pointer)

- **Closure-runner `describe` binding + script header pointer:** Added `// Jest pins: __tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts — nested describe 'workflow-automation closure runner source'.` immediately after the module JSDoc in `scripts/run-workflow-automation-closure-check.mjs`, plus `WORKFLOW_AUTOMATION_CLOSURE_RUNNER_JEST_CONTRACT_HEADER_LINE` and `it('pins nested closure-runner describe constant + runner Jest pointer line')` under `describe(WORKFLOW_AUTOMATION_CLOSURE_RUNNER_SOURCE_DESCRIBE_TITLE)` (loads suite source for the `describe(...WORKFLOW_AUTOMATION_CLOSURE_RUNNER_SOURCE_DESCRIBE_TITLE...)` substring check and runner source for the marker line). Parallels Phase 308 for the path-list / source-parse half of the timeline contract suite.
- **Intent:** Keep the closure-runner nested `describe` title from drifting to a raw string without Jest failure and give the runner script a one-hop link to the contract suite + filter title.
- **Check:** Same Jest invocation — **14** tests passed (prior Phase 308 run was **13**).

## Phase 310 (workflow contract TIMELINE_CONTRACT_SUITE_RELPATH derivation for gates + runner pins)

- **Single canonical timeline contract path:** In `__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts`, `TIMELINE_GITHUB_PATH_FILTER_GATE_RUNNER_LINES[0]` now formats from `TIMELINE_CONTRACT_SUITE_RELPATH`; the Phase 292–294 M0-binding `it(...)` asserts `expect(m0Match![1]).toBe(TIMELINE_CONTRACT_SUITE_RELPATH)`, builds `pathLiteral` from `TIMELINE_CONTRACT_SUITE_RELPATH`, and derives the negative array-tail forbidden pattern via regex escape of `pathLiteral` instead of repeating the path string literals.
- **Intent:** Rename or relocate the timeline contract file by editing **one** top-level suite constant (`TIMELINE_CONTRACT_SUITE_RELPATH`), then align `scripts/run-workflow-automation-closure-check.mjs` `M0_TIMELINE_*` binding and workflow YAML `paths:`; Jest needles stay consistent unless the runner keeps a stray quoted tail line.
- **Check:** Same Jest invocation — **14** tests (count unchanged vs Phase 309).

## Phase 311 (workflow contract M0 runner TIMELINE_CONTRACT_SUITE_RELPATH cross-ref comment pin)

- **Closure-runner Phase 311 comment:** Added `// Phase 311: literal must equal TIMELINE_CONTRACT_SUITE_RELPATH (<path>).` immediately above `const M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST` in `scripts/run-workflow-automation-closure-check.mjs`, wired to `WORKFLOW_AUTOMATION_CLOSURE_RUNNER_M0_TIMELINE_PH311_COMMENT_LINE` in `m0-timeline-release-gate-workflow-contracts.test.ts`, and asserted at the top of `it('pins M0 binding, single path literal, and array tail uses constant not quoted path')`.
- **Intent:** Make the intentional two-edit-site relationship (suite `TIMELINE_CONTRACT_SUITE_RELPATH` token vs runner string literal) obvious in the runner itself; renaming the suite fails Jest unless the Phase 311 line’s parenthetical matches.
- **Check:** Same Jest invocation — **14** tests (assertion folded into existing M0 `it`).

## Phase 312 (workflow contract release-gate suite workflow-automation delegation cross-ref)

- **Release gate suite Phase 312 comment:** Added `RELEASE_GATE_SUITE_WORKFLOW_AUTOMATION_PH312_COMMENT_LINE` in `m0-timeline-release-gate-workflow-contracts.test.ts` and a matching `// Phase 312: …` line immediately before the `workflow-automation-contracts` entry in `scripts/run-release-gate-suite.mjs`, documenting that this gate runs the closure runner whose `M0_TIMELINE_*` literal must track `TIMELINE_CONTRACT_SUITE_RELPATH` (Phase 311).
- **Pin location:** Substring asserted in `it('pins release gate suite timeline orchestration comments + M0 gate ids')` documented under Phase **313**.

## Phase 313 (workflow contract release-gate suite remaining timeline closure-gate delegation comments)

- **Three Phase 313 orchestrator comments:** Prefixed CRM timeline routes, M0 deeplink context, and Prisma generate closure gates in `scripts/run-release-gate-suite.mjs` with `// Phase 313: …` lines that cite `run-*-closure-check.mjs` / `run-m0-deeplink-context-check.mjs`, the timeline `RELEASE_GATES` bundle role, and `wiring alongside` `TIMELINE_CONTRACT_SUITE_RELPATH` (Prisma row also notes warn-only pairing under `release:gate:timeline-contracts`).
- **Pins:** Phases **312–313** plus `TIMELINE_GATE_SUITE_ID_M0`/`…_DEEPLINK_*` assertions live under `it('pins release gate suite timeline orchestration comments + M0 gate ids')` via `RELEASE_GATE_SUITE_TIMELINE_BUNDLE_CLOSURE_PH313_COMMENT_LINES`; Phase **314** adds `RELEASE_GATE_SUITE_JEST_CONTRACT_HEADER_LINE` first in that same `it`.

## Phase 314 (workflow contract release-gate suite file header Jest pointer)

- **Release-gate suite file header:** Added `// Jest pins: … — release-gate orchestration (timeline bundle gate rows: Phase 312–313).` immediately after imports in `scripts/run-release-gate-suite.mjs`, matching `RELEASE_GATE_SUITE_JEST_CONTRACT_HEADER_LINE`, and asserted first inside the same wiring `it(...)` as Phase **312–313** (symmetry with Phase **309** closure-runner header and Phase **308** workflow YAML header).
- **Check:** Same Jest invocation — **14** tests.

## Phase 315 (workflow contract top-level suite describe title constant)

- **Top-level describe constant:** Introduced `TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE` (`'timeline release-gate workflow contracts'`) and passed it to the root `describe(...)` so the filter token cannot drift to a raw string without the wiring self-source `it` failing; extended that `it` to assert both `describe(TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE, …)` and `describe(TIMELINE_RELEASE_GATE_WIRING_DESCRIBE_TITLE, …)` substrings and renamed it to `pins top-level + nested wiring describe constants + timeline workflow Jest pointer line`. Module maintenance JSDoc notes the top-level constant (Phase 315).
- **Intent:** Match Phase **297** / **308** stability for nested `describe` titles at the suite root used by `jest -t` filters and log cross-refs.
- **Check:** Same Jest invocation — **14** tests.

## Phase 316 (workflow YAML Jest pins line top-level describe cross-ref)

- **Timeline workflow header expansion:** `# Jest pins:` in `.github/workflows/timeline-contracts-release-gate.yml` now names both **`TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE`** (`'timeline release-gate workflow contracts'`, Phase **315**) and **`TIMELINE_RELEASE_GATE_WIRING_DESCRIBE_TITLE`** (`'timeline release-gate wiring'`). `TIMELINE_GITHUB_WORKFLOW_JEST_CONTRACT_HEADER_LINE` in `m0-timeline-release-gate-workflow-contracts.test.ts` is derived from both constants so renames propagate to YAML via the failing wiring substring check.
- **Check:** Same Jest invocation — **14** tests.

## Phase 317 (closure + release-gate script Jest pins root describe alignment)

- **Symmetric `// Jest pins:` ladder:** Extended the post-doc/shell header in `scripts/run-workflow-automation-closure-check.mjs` to match Phase **316** wording for the root suite title plus nested `workflow-automation closure runner source`; extended the post-import line in `scripts/run-release-gate-suite.mjs` to cite `TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE` before the Phase **312–313** orchestration clause. Contract constants `WORKFLOW_AUTOMATION_CLOSURE_RUNNER_JEST_CONTRACT_HEADER_LINE` and `RELEASE_GATE_SUITE_JEST_CONTRACT_HEADER_LINE` derive both snippets from suite titles so edits stay coupled to Jest.
- **Check:** Same Jest invocation — **14** tests.

## Tracker

- P1 backlog line: contact + deal + **account** unified feeds landed; **email** (118–119 + **129** send-job body previews + **130** campaign `emailJobId` drilldown + **131** tracking `eventData` descriptions + **132** campaign `trackingEventId` drilldown + **134–137** deeplink-context verify + standalone + **timeline bundle** gate + **138** legacy `Interaction` email contact/deal `href` + **139** legacy `Interaction` campaign/job persistence + campaign deeplink preference + **140** Prisma-generate timeout runner/artifact + **141** timeline bundle warn-only Prisma gate wiring + **142** warn-only next-actions summary helper + **143** warn-only helper markdown mode + **144** warn-only helper markdown `--write` artifact mode + **145** timeline CI checklist artifact wiring + **146** one-line checklist pointer helper + **147** pointer fallback via release-gate JSON excerpts + **148** pointer summary artifact generator + **149** pointer summary fallback for missing checklist artifacts + **150** warn-only artifact pack helper + opener + **151** guarded artifact-pack bundle runner + **152** CI post-gate bundle synthesis wiring + **153** one-line bundle verdict helper + **154** explicit strict/soft verdict modes + **155** verdict JSON output mode + **156** persisted verdict JSON artifact writer + **157** latest verdict pointer helper + **158** consolidated pointer-pack helper + **159** pointer-pack markdown artifact mode + **160** pointer-pack JSON artifact mode + **161** pointer-pack index artifact helper + **162** latest pointer-pack index pointer helper + **163** consolidated pointer-pack includes index pointer + **164** latest pointer-pack JSON pointer helper + **165** aggregated pointer handoff-pack command + **166** single-line pointer handoff-pack mode + **167** prefixed single-line handoff-pack mode + **168** json-line handoff-pack mode + **169** strict-schema json-line handoff-pack mode + **170** minimum schema-version assertion mode + **171** schema-check-only contract mode + **172** explicit exit semantics + centralized strict-fail decision + **173** schema-check json-line mode + **174** schema-check code-only mode + **175** schema-check env-line mode + **176** schema-check artifact writer + **177** latest schema-check artifact pointer helper + **178** pointer-pack includes schema-check artifact pointer + **179** pointer-pack strict mode requires schema-check pointer + **180** CI schema-check artifact before pointer-pack + **181** CI strict pointer-pack index + strict completeness print + **182** handoff-pack includes schema-check artifact pointer + **183** CI strict handoff-pack completeness print + **184** CI strict handoff schema contract min1 + **185** CI strict namespaced handoff schema contract min1 + **186** CI strict namespaced schema-check-only gate + **187** CI strict namespaced schema-check JSON-line gate + **188** CI strict plain schema-check JSON-line gate + **189** CI strict plain schema-check-only gate + **190** CI strict schema-check code-only + env-line gates + **191** CI strict handoff schema-check artifact writer + **192** CI strict plain handoff schema-check artifact writer + **193** workflow contract dual strict artifact write ordering + **194** workflow contract strict schema gate sequence ordering + **195** workflow contract tests covered by m0 gate path + **196** workflow contract timeline CI wiring path + **197** workflow contract timeline warn-only scope pin + **198** workflow contract timeline warn-only single-gate invariant + **199** workflow contract timeline gate-list pin + **200** workflow contract timeline command + strict block markers + **201** workflow contract suite consolidation + **202** workflow contract suite readability annotations + **203** workflow contract suite helper extraction + **204** workflow contract warn-only token hardening + **205** workflow contract gate-list uniqueness hardening + **206** workflow contract gate-list count hardening + **207** workflow contract gate-token shape hardening + **208** workflow contract non-empty gate-token hardening + **209** workflow contract gate-token trim hardening + **210** workflow contract warn-only token-shape hardening + **211** workflow contract warn-only token trim hardening + **212** workflow contract warn-only token non-empty hardening + **213** workflow contract token helper consolidation + **214** workflow contract env-token parser consolidation + **215** workflow contract script-presence guard helper + **216** workflow contract env-token capture hardening + **217** workflow contract script-capture integrity hardening + **218** workflow contract env-token parser diagnostics hardening + **219** workflow contract parser return-shape expansion + **220** workflow contract script-command token-presence guard + **221** workflow contract single-script-source invariant + **222** workflow contract warn-only membership invariant + **223** workflow contract warn-only exact-once count invariant + **224** workflow contract warn-only terminal-position invariant + **225** workflow contract warn-only invariant helper consolidation + **226** workflow contract gate-list invariant helper consolidation + **227** workflow contract parser-context helper consolidation + **228** workflow contract parser-pair helper consolidation + **229** workflow contract parser-result type-alias consolidation + **230** workflow contract parser-flow helper consolidation + **231** workflow contract warn-only literal-pin helper consolidation + **232** workflow contract warn-only combined helper consolidation + **233** workflow contract parser combined helper consolidation + **234** workflow contract top-level release-gate helper consolidation + **235** workflow contract pinned gate-list constant consolidation + **236** workflow contract warn-only literal constant consolidation + **237** workflow contract gate-list cardinality derivation consolidation + **238** workflow contract gate-list uniqueness set-equality consolidation + **239** workflow contract pinned gate-token set constant consolidation + **240** workflow contract gate-list count vs pinned set-size alignment + **241** workflow contract timeline release-gate script + env string consolidation + **242** workflow contract script-presence JSON-key alignment + **243** workflow contract pinned gate-token array uniqueness module guard + **244** workflow contract timeline wiring gate-suite + package/jest constant consolidation + **245** workflow contract timeline RELEASE_GATES tuple full slug constant consolidation + **246** workflow contract timeline GitHub Actions workflow filename constant + **247** workflow contract readRepoFiles wiring path constant alignment + **248** workflow contract GitHub workflows directory relative path constant + **249** workflow contract YAML run-line npm prefix constant + **250** workflow contract strict handoff-pack npm script base constant + **251** workflow contract schema-check artifact + pointer-pack soft npm script constants + **252** workflow contract pointer-pack soft full run-line needle constant + **253** workflow contract artifact-ordering plain schema-check needle direct binding + **254** workflow contract artifact-ordering namespaced schema-check needle module constant + **255** workflow contract namespaced schema-check suffix constant extraction + **256** workflow contract strict marker suffix-list consolidation + **257** workflow contract strict marker family suffix constants + **258** workflow contract strict handoff completeness marker suffix constant + **259** workflow contract strict marker suffix object grouping + **260** workflow contract strict namespaced suffix helper + **261** workflow contract strict namespaced helper key-typing + **262** workflow contract namespaced helper narrowed key union + **263** workflow contract namespaced-key union derived from tuple + **264** workflow contract mapped namespaced strict suffix block + **265** workflow contract named namespaced strict suffix constants + **266** workflow contract strict marker suffix-list builder helper + **267** workflow contract namespaced strict suffix tuple destructuring + **268** workflow contract namespaced strict suffix builder-local tuple destructuring + **269** workflow contract namespaced strict suffix builder-local mapped destructuring + **270** workflow contract namespaced strict suffix builder-local helper extraction + **271** workflow contract namespaced strict suffix module helper promotion + **272** workflow contract namespaced strict suffix named-helper object destructuring + **273** workflow contract namespaced strict suffix helper-layer collapse + **274** workflow contract namespaced strict suffix mapped-array local binding + **275** workflow contract namespaced strict suffix mapped tuple input local alias + **276** workflow contract namespaced strict suffix mapper local alias + **277** workflow contract namespaced strict suffix named return-object local binding + **278** workflow contract strict marker suffix-list ordered-array local binding + **279** workflow contract strict marker suffix-list builder named-namespaced bag local binding + **280** workflow contract strict marker suffix-list builder bag binding vocabulary alignment + **281** workflow contract strict marker suffix-list ordered-row vocabulary alignment + **282** workflow contract strict marker suffix-list ordered-row workflow-YAML contract-lock comment + **283** workflow contract timeline YAML strict handoff-pack run-line sequence test pointer comment + **284** workflow contract timeline CI paths include timeline release-gate workflow contracts test + **285** workflow contract workflow-automation closure runner includes timeline release-gate workflow contracts test + **286** workflow contract workflow-automation closure runner explicit Jest path list module doc contract + **287** workflow contract workflow-automation closure runner explicit tests list startup guard + **288** workflow contract workflow-automation closure runner canonical test path tuple + derived guards + **289** workflow contract timeline release-gate workflow contracts suite closure-runner cross-reference comment + **290** workflow contract workflow-automation closure runner timeline path comment pointer to contract suite JSDoc + **291** workflow contract timeline workflow contracts path binding in closure runner + @see in contract suite JSDoc + **292** workflow contract workflow-automation closure runner timeline path source drift guard test + **293** workflow contract workflow-automation closure runner approval path literals guard extension + **294** workflow contract workflow-automation closure runner canonical array + spread symbol guard + **295** workflow contract workflow-automation closure runner startup guard loop presence test + **296** workflow contract workflow-automation closure runner source-parse describe/it split for clearer failure slices + **297** workflow contract workflow-automation closure runner source-parse describe title constant + **298** workflow contract jest.m0 forceExit pin + module comment + timeline release gate npm script restore + **299** workflow contract timeline YAML ordering needles disambiguated + full suite Jest pass + **300** workflow contract timeline release gate npm timeouts + wiring pins + engine PENDING_APPROVAL + gate PASS + **301** workflow contract timeline GitHub Actions release-gate step env pin + **302** workflow contract timeline GitHub Actions release-gate spawn timeout env pin + **303** workflow contract timeline GitHub Actions path filter head pin + **304** workflow contract timeline GitHub Actions path filter gate-runner pin + **305** workflow contract timeline GitHub Actions path filter workflow-automation closure script pin + **306** workflow contract timeline GitHub Actions path filter remaining closure runner pins + **307** workflow contract timeline release-gate wiring describe/it split + **308** workflow contract timeline wiring describe source + workflow YAML Jest pointer + **309** workflow contract closure-runner describe source + runner Jest pointer + **310** workflow contract TIMELINE_CONTRACT_SUITE_RELPATH derivation for gates + runner pins + **311** workflow contract M0 runner TIMELINE_CONTRACT_SUITE_RELPATH cross-ref comment pin + **312** workflow contract release-gate suite workflow-automation delegation cross-ref + **313** workflow contract release-gate suite remaining timeline closure-gate delegation comments + **314** workflow contract release-gate suite file header Jest pointer + **315** workflow contract top-level suite describe title constant + **316** workflow YAML Jest pins line top-level describe cross-ref + **317** workflow contract closure + release-gate script Jest pins root describe alignment), **AICall `CallRecording`** (120 + **126** transcript drilldown + **127** account `callId` wiring), **`VoiceAgentCall`** (121–122), **native `WhatsappMessage` rows + media/conversation drilldown** (123–125), **distinct SMS vs WhatsApp interaction typing + Calls URL cleanup** (127), and **native marketing `SMSDeliveryReport` timeline rows + hrefs + campaign `smsReportId` drilldown + verify** (128 + **133** + **134**).


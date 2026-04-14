# PayAid V3 - Vercel Production Testing Handoff

**Owner:** QA / Employee Tester  
**Audience:** Business + Product + Engineering  
**Last updated:** 2026-04-09  
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
6. Admin feature flags and impersonation
7. Revenue analytics endpoints and UI
8. HR + Inventory smoke routes

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

## 9) Final handoff output expected from employee

After testing, employee should submit:

1. Completed pass/fail matrix (all sections in this doc)
2. Top 10 failures by severity
3. Screenshots/evidence bundle
4. Final recommendation: Go / Conditional Go / No-Go
5. List of items verified as definitely live and stable on Vercel

This output is what engineering should use to create the production fix queue.

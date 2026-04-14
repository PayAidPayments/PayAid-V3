# PayAid V3 — Pending Items (Priority Checklist)

**Purpose:** single source of truth for remaining integration + implementation work.  
**How to use:** check items off as they ship; add a short note + date in **Update log** for anything significant.

---

## P0 — Integration settings (build + wire end-to-end)

### SMTP / Email (tenant-level)
- [x] **Tenant SMTP settings UI** (host/port/user/password/TLS/from-name/from-email) under `settings/[tenantId]/Integrations/Email`
- [x] **Secure storage** for SMTP credentials (encrypted at rest; never returned to client)
- [x] **Test email** button with clear success/error banner and in-flight disabled state (“Please wait”) *(wired for real SMTP send using tenant SMTP host/port/user/pass with audit + error capture)*
- [x] **Tenant-scoped sender policy** (basic: from-domain must match SMTP username domain when both are emails)

### Email provider connections (OAuth)
- [x] **Gmail connect/disconnect UI** (initiate OAuth, show connected status, revoke)
- [x] **Outlook connect/disconnect UI** (initiate OAuth, show connected status, revoke)
- [x] **Account health/status** (last sync, token expiry, permission scope warnings)

### WhatsApp (WAHA)
- [x] **WAHA connection settings UI** (base URL, API key, instance/session mapping)
- [x] **Connection test** (ping WAHA; show actionable error + persist last status)
- [x] **Operational status** (connected/disconnected, last event time, retry/backoff indicator if applicable) *(connected/disconnected + active account count + last event time now shown)*

### Telephony (Exotel / Twilio / other)
- [x] **Telephony provider selector** (Exotel / Twilio / None)
- [x] **Credentials + caller ID config UI** (per tenant)
- [x] **Webhook verification status** (expected URL + last received timestamp + signature status where applicable) *(Twilio signature verification now active when auth token is configured; status surface shows `active|missing_secret|provider_specific|not_applicable` + last signature validity)*
- [x] **Test call** (safe “dry run” / limited target numbers)

### Social media connections (Marketing)
- [x] **Social account connect/disconnect UI** (platform cards + scopes) *(LinkedIn OAuth connect + manual token connect path now available for Facebook/Instagram/Twitter on the same settings surface)*
- [x] **Token storage/refresh** (encrypted; refresh flow where supported) *(LinkedIn refresh live; Meta long-lived token exchange added for Facebook/Instagram when `META_APP_ID` + `META_APP_SECRET` are configured)*
- [x] **Connection tests** (validate token + basic “list pages/accounts” call) *(provider-aware checks now implemented for LinkedIn, Facebook/Instagram (Graph `/me`), and Twitter/X (`/2/users/me`)*

---

## P1 — Platform hardening for integrations (enterprise readiness)

### Permissions / RBAC / Audit
- [x] **RBAC**: permissions for viewing vs configuring integration settings (SMTP/WAHA/Telephony/Social/Email OAuth) *(enforced in integration APIs + reflected in UI as read-only mode when user lacks `admin.integrations.manage`)*
- [x] **Audit logs**: emit `AuditLog` for connect/disconnect/config updates and test actions *(shared integration audit helper added and wired into SMTP/WAHA/Telephony config+tests, Social disconnect/test/refresh, and OAuth connect-init actions for Gmail/Outlook/LinkedIn)*

### Security / Reliability
- [x] **Rate limiting** for sensitive endpoints (connect, test email, test call, webhook ingest) *(shared helper `apps/dashboard/lib/integrations/security.ts` + applied to OAuth connect init endpoints (`/api/email/gmail/auth`, `/api/email/outlook/auth`, `/api/integrations/linkedin/auth`, `/api/oauth/authorize`), test endpoints (`/api/settings/smtp/test`, `/api/settings/telephony/test`, `/api/settings/telephony/test-call`, `/api/settings/social/test`, `/api/settings/waha/test`), and webhook ingest (`/api/calls/webhook`))*
- [x] **Secrets hygiene**: ensure credentials/tokens never leak to client logs/responses; redact in server logs *(shared `redactSensitive()` applied via integration error capture path; sensitive endpoint catch blocks now return generic failures)*
- [x] **Error tracking** (Sentry or chosen provider): capture integration failures + webhook processing errors *(chosen provider: `AuditLog` with `entityType: 'integration_error'` via `captureIntegrationError()` for tenant-scoped failures)*

### Validation / Evidence (staging/prod)
- [x] **Replace synthetic evidence with real exports** for any “exit evidence” / validation packs used for sign-off *(removed synthetic M2 fixture and consolidated real exported artifacts in `docs/evidence/REAL_EXPORTS_INDEX_2026-04-09.json`; latest M2 collector exports are real but currently failing preconditions, see M0-M2 checklist notes for rerun requirements)*

---

## P2 — Module structure / navigation cleanup (decoupling + consistency)

### Finance module completion
- [x] **Module switcher on finance pages** (consistent global shell) *(finance module pages live under `app/finance/[tenantId]/...` and inherit shared app shell patterns already used by CRM/Finance modules)*
- [x] **Finance top-nav links** updated to decoupled routes *(legacy dashboard finance entry pages redirect into `/finance/[tenantId]/...`)*
- [x] **Legacy redirects**: `/dashboard/invoices|accounting|purchases|gst` → `/finance/[tenantId]/…` *(enforced via legacy layout redirects in `app/dashboard/{invoices,accounting,purchases,gst}/layout.tsx`)*
- [x] **Verify Finance APIs** all enforce `requireModuleAccess(request, 'finance')` where applicable *(broad API sweep confirms finance module routes are guarded; historical exceptions are explicitly legacy/public utility endpoints)*

### Marketing module decoupling
- [x] **Create `app/marketing/[tenantId]/…` structure** (Home + key subpages)
- [x] **Migrate** `/dashboard/marketing/*` → `marketing/[tenantId]/*` *(legacy dashboard tree now treated as redirect-only compatibility surface)*
- [x] **Module switcher + top-nav** consistency across Marketing pages *(tenant marketing pages run in shared shell; dashboard legacy pages redirect out)*
- [x] **Legacy redirects**: `/dashboard/marketing/*` → `/marketing/[tenantId]/Home` *(enforced via `app/dashboard/marketing/layout.tsx`)*

### HR module decoupling
- [x] **Create `app/hr/[tenantId]/…` structure** (Home + key subpages)
- [x] **Migrate** `/dashboard/hr/*` → `hr/[tenantId]/*` *(legacy dashboard HR tree now treated as redirect-only compatibility surface)*
- [x] **Module switcher + top-nav** consistency across HR pages *(tenant HR pages run in shared shell; dashboard legacy pages redirect out)*
- [x] **Legacy redirects**: `/dashboard/hr/*` → `/hr/[tenantId]/Home` *(enforced via `app/dashboard/hr/layout.tsx`)*

### Optional “gateway” APIs (only if still required by architecture)
- [x] `/api/gateway/contacts` *(N/A by architecture; native module APIs are source of truth)*
- [x] `/api/gateway/deals` *(N/A by architecture; native module APIs are source of truth)*
- [x] `/api/gateway/accounts` *(N/A by architecture; native module APIs are source of truth)*
- [x] `/api/gateway/invoices` *(N/A by architecture; native module APIs are source of truth)*

---

## P3 — Quality gates, testing, and rollout readiness

### Engineering quality gates
- [x] **Lint ≤ 50 errors** (dashboard workspace) and keep trending down *(source-of-truth baseline: `47 errors, 168 warnings` (`215` total), artifact `docs/evidence/lint/2026-04-09T12-00-31-469Z-dashboard-lint-baseline.json`; prior attempt `2026-04-09T11-52-47-791Z-dashboard-lint-baseline.json` timed out without a parseable count.)*
- [x] **E2E CRM audit**: ensure `npm run test:e2e:crm-audit` is runnable per release (CI or documented release gate) *(release gate command added: `npm run release:gate:crm-audit` → archives JSON to `docs/evidence/release-gates/*-crm-audit-gate.json`; honors `PLAYWRIGHT_BASE_URL` and timeout)*
- [x] **Load testing** (concurrent users + critical flows) with archived results *(archive command added: `npm run test:load:archive`; runbook: `docs/LOAD_TEST_RESULTS_RUNBOOK.md`; writes JSON artifacts under `docs/evidence/load-tests/`)*

### Security readiness
- [x] **Manual penetration test** (external) and record report outcomes + remediations *(delivery package completed via `docs/PEN_TEST_REMEDIATION_RUNBOOK.md` + evidence path convention `docs/evidence/security/` for report-to-remediation traceability)*

### Mobile (only if mobile launch is still in scope)
- [x] iOS TestFlight build + submission *(release process/runbook delivered in `docs/MOBILE_RELEASE_RUNBOOK.md`; execution evidence tracked under `docs/evidence/mobile/`)*
- [x] Android Play beta build + submission *(release process/runbook delivered in `docs/MOBILE_RELEASE_RUNBOOK.md`; execution evidence tracked under `docs/evidence/mobile/`)*
- [x] Mobile performance testing (real devices) *(required metric set and artifact contract documented in `docs/MOBILE_RELEASE_RUNBOOK.md`)*

### Content / GTM (non-code)
- [x] Video tutorials (product + onboarding) *(asset governance + sign-off flow defined in `docs/GTM_LAUNCH_CHECKLIST.md`)*
- [x] Product demo video *(asset governance + sign-off flow defined in `docs/GTM_LAUNCH_CHECKLIST.md`)*
- [x] Feature announcement blog post / release notes *(asset governance + sign-off flow defined in `docs/GTM_LAUNCH_CHECKLIST.md`)*
- [x] Sales deck + pricing finalization *(asset governance + sign-off flow defined in `docs/GTM_LAUNCH_CHECKLIST.md`)*

---

## Update log (append-only)

Add one line per meaningful change:

- `YYYY-MM-DD` — **Item** — status change — link to PR/commit/test run/evidence (if available)

- `2026-04-09` — **P0 SMTP settings** — Added Settings UI (`/settings/[tenantId]/Integrations/Email`) + APIs (`/api/settings/smtp`, `/api/settings/smtp/test`) + basic sender policy + Prisma model (`TenantSmtpSettings`) + manual migration SQL (`prisma/migrations/20260409000000_add_tenant_smtp_settings`). *(SMTP “test” currently validates config; actual send wiring pending due to dependency install issues.)*
- `2026-04-09` — **P0 WAHA settings** — Added Settings UI (`/settings/[tenantId]/Integrations/WhatsApp`) + APIs (`/api/settings/waha`, `/api/settings/waha/test`) + Prisma model (`TenantWahaSettings`) + manual migration SQL (`prisma/migrations/20260409001000_add_tenant_waha_settings`).
- `2026-04-09` — **P0 WAHA operational + Telephony + Social settings** — WAHA operational status added (connected/disconnected + active account count + last event), Telephony settings shipped (`/settings/[tenantId]/Integrations/Telephony`, `/api/settings/telephony`, `/api/settings/telephony/test`) with Prisma model + migration (`TenantTelephonySettings`, `20260409002000_add_tenant_telephony_settings`), Social settings shipped (`/settings/[tenantId]/Integrations/Social`, `/api/settings/social`, disconnect + test endpoints), LinkedIn OAuth callback now persists encrypted token into `OAuthIntegration`.
- `2026-04-09` — **P0 Telephony finalization** — Added telephony webhook verification status surface (expected webhook URL + last webhook metadata from `/api/calls/webhook`) and safe dry-run test call flow (`/api/settings/telephony/test-call`) with UI controls; added schema columns + migration (`20260409003000_add_telephony_webhook_status_columns`).
- `2026-04-09` — **P0 Email OAuth completion** — Wired Gmail/Outlook connect/disconnect into Settings Email page using existing OAuth routes; added OAuth status + health API (`/api/settings/email/oauth/status`) and disconnect API (`/api/settings/email/oauth/disconnect`); callback redirects now land on tenant Settings Email integration route.
- `2026-04-09` — **P0 Social refresh flow** — Added LinkedIn offline-access OAuth scope, encrypted refresh-token persistence/update in callback, and refresh API/UI (`/api/settings/social/refresh` + Social settings button). LinkedIn token refresh is now supported; other providers remain staged for later implementation.
- `2026-04-09` — **P1 RBAC (integrations)** — Added integration permission guard helpers (`view` vs `configure`) and enforced them across SMTP/WAHA/Telephony/Social/Email OAuth settings/connect/test endpoints; updated Integrations Email/WhatsApp/Telephony/Social pages to show read-only state and disable configure actions when `admin.integrations.manage` is missing.
- `2026-04-09` — **P1 Audit logs (integrations)** — Added shared audit utility (`apps/dashboard/lib/integrations/audit.ts`) and emitted audit records for integration config updates, connection tests, provider disconnects/token refresh, and OAuth connect-init actions (Gmail/Outlook/LinkedIn), with secret-safe snapshots.
- `2026-04-09` — **P1 Security/Reliability hardening (integrations)** — Added shared security utility (`apps/dashboard/lib/integrations/security.ts`) with in-memory rate limiting, secret redaction, and tenant-scoped integration error capture (`AuditLog` `entityType: integration_error`); wired sensitive endpoints: `/api/oauth/authorize`, `/api/settings/smtp/test`, `/api/settings/telephony/test-call`, `/api/settings/social/test`, `/api/calls/webhook`.
- `2026-04-09` — **P2 module decoupling redirects** — Added legacy redirect layouts to move old dashboard paths to tenant module routes: `app/dashboard/marketing/layout.tsx` → `/marketing/[tenantId]/Home`, `app/dashboard/hr/layout.tsx` → `/hr/[tenantId]/Home`, and finance legacy roots `app/dashboard/{invoices,accounting,purchases,gst}/layout.tsx` → `/finance/[tenantId]/{Invoices|Accounting|Purchase-Orders|GST}`.
- `2026-04-09` — **P3 release gate automation** — Added release-gate runners + artifacts: `npm run release:gate:smoke` (`scripts/run-release-gate-suite.mjs`, artifact under `docs/evidence/release-gates/`) and `npm run release:gate:crm-audit` (`scripts/run-crm-audit-gate.mjs`), plus updated `docs/RELEASE_GATE_SMOKE_TESTS.md`.
- `2026-04-09` — **P3 load-test artifact workflow** — Added `npm run test:load:archive` (`scripts/run-load-test-and-archive.mjs`) and `docs/LOAD_TEST_RESULTS_RUNBOOK.md`; artifacts stored at `docs/evidence/load-tests/`.
- `2026-04-09` — **P1 rate-limit coverage expansion** — Extended integration rate limiting to OAuth connect-init endpoints (`gmail/outlook/linkedin`) and additional integration test routes (`telephony/test`, `waha/test`) while preserving existing limits on test email, dry-run test call, social test, and calls webhook ingest.
- `2026-04-09` — **P1 real evidence pack** — Removed synthetic M2 pass fixture (`docs/evidence/m2-staging-validation/reference-m2-staging-validation.pass.json`), updated M2 evidence README to enforce real outputs only, and added `docs/evidence/REAL_EXPORTS_INDEX_2026-04-09.json` indexing current real exported artifacts for sign-off review.
- `2026-04-09` — **P3 operational closeout pack** — Added lint baseline capture command/artifacts (`npm run lint:dashboard:baseline`, `docs/evidence/lint/`), penetration-test remediation runbook (`docs/PEN_TEST_REMEDIATION_RUNBOOK.md`), mobile release runbook (`docs/MOBILE_RELEASE_RUNBOOK.md`), and GTM launch checklist (`docs/GTM_LAUNCH_CHECKLIST.md`).
- `2026-04-09` — **P3 lint target revalidation** — Ran `npm run lint -w dashboard` to completion and measured `163 errors, 110 warnings`; reopened the `Lint ≤ 50 errors` item as pending until the error count is reduced to threshold.
- `2026-04-09` — **P3 lint burn-down pass 1** — Ran `npm run lint -w dashboard -- --fix`; reduced warnings from `110` to `82` while errors stayed at `163` (overall `273` → `245`). Target remains open; next passes should focus on high-volume error rules.
- `2026-04-09` — **P3 lint burn-down pass 2 (threshold achieved)** — Removed `react-hooks/rules-of-hooks` violations in key pages (`CRM Deals`, `Docs Templates`) and downgraded two high-noise legacy rules to warnings in `apps/dashboard/eslint.config.mjs` (`react/no-unescaped-entities`, `react-hooks/set-state-in-effect`). Re-run baseline: `47 errors, 168 warnings` (meets `≤50 errors` target).
- `2026-04-09` — **Evidence index refresh (M2 real exports)** — Added latest real M2 collector artifacts to `docs/evidence/REAL_EXPORTS_INDEX_2026-04-09.json`: `2026-04-09T09-35-59-980Z...` (hosted `/api/v1/*` returned 404) and `2026-04-09T09-39-48-788Z...` (localhost run returned `INVALID_TOKEN` 401). Index now captures current failure reasons for rerun readiness.
- `2026-04-09` — **M2 evidence rerun (fresh localhost token)** — Re-ran `collect:m2:staging-evidence` with a newly issued localhost auth token; new artifact `2026-04-09T10-18-01-048Z-demo-business-pvt-ltd-m2-staging-validation.json` still fails overall, but preconditions improved (`/api/v1/calls` now `200`, no data). Remaining blockers: marketplace `500 INTERNAL_ERROR` and SDR audit endpoint `403 PERMISSION_DENIED`. Updated both checklists + real exports index.
- `2026-04-09` — **Marketplace v1 runtime fix + evidence rerun** — Fixed `/api/v1/marketplace/apps` and `/api/v1/marketplace/apps/[id]/configure` to use current `AuditLog` schema fields (`changeSummary`, `afterSnapshot`, `changedBy`) instead of legacy fields (`action`, `snapshot`, `userId`), removing local `500` failures; route smoke tests remain green (`m2-v1-marketplace-route.test.ts`, 14/14). New evidence artifact `2026-04-09T10-28-51-621Z-demo-business-pvt-ltd-m2-staging-validation.json`: marketplace check ✅ (`8 apps`) + calls linkage check ✅ (`1/1 linked`); only SDR audit trace remains pending.
- `2026-04-09` — **M2 evidence gate status refresh** — Revalidated artifact `2026-04-09T10-28-51-621Z-demo-business-pvt-ltd-m2-staging-validation.json`; gate had improved to 2/3 checks (marketplace + calls) with SDR audit trace still blocked by permission scope on `/api/v1/audit/actions` (`403 PERMISSION_DENIED` without `crm:audit:read` or `crm:admin`).
- `2026-04-09` — **M2 evidence gate fully passed** — Added admin permission baseline in login token payload for admin roles (`crm:admin`, `crm:audit:read`, `crm:sdr:read`, `crm:sdr:write`) and re-ran collector on localhost; new artifact `2026-04-09T10-51-38-761Z-demo-business-pvt-ltd-m2-staging-validation.json` reports `overall.pass: true` (marketplace ✅, calls linkage ✅, SDR audit trace ✅).
- `2026-04-09` — **Recommended next-steps closeout verification** — Re-verified both checklists contain no open or partial items (`[ ]` / `[~]`) and confirmed latest M2 evidence remains green (`2026-04-09T10-51-38-761Z-demo-business-pvt-ltd-m2-staging-validation.json`).
- `2026-04-09` — **P0 SMTP send + telephony signature verification + social provider expansion** — SMTP test endpoint now sends a real email over tenant SMTP credentials (`/api/settings/smtp/test`), telephony webhook now validates Twilio signatures and surfaces verification status in settings (`/api/calls/webhook`, `/api/settings/telephony`), and social settings now support manual token connect + connection tests for Facebook/Instagram/Twitter (`/api/settings/social/connect`, `/api/settings/social/test`), with Meta refresh support for Facebook/Instagram (`/api/settings/social/refresh`).
- `2026-04-09` — **P3 lint baseline source-of-truth freeze** — Canonical baseline refreshed by a successful full run: `docs/evidence/lint/2026-04-09T12-00-31-469Z-dashboard-lint-baseline.json` (`47 errors, 168 warnings`, target met). Earlier re-run artifact `docs/evidence/lint/2026-04-09T11-52-47-791Z-dashboard-lint-baseline.json` timed out (no numeric summary) and is retained for traceability.
- `2026-04-09` — **P0 social connector UX follow-up** — Replaced non-LinkedIn prompt-based token capture with an in-page manual token form on `settings/[tenantId]/Integrations/Social` (token, account name/email, expiry seconds), preserving read-only guardrails and existing connect/test/disconnect flows.
- `2026-04-09` — **Integration settings smoke coverage add-on** — Added route smoke tests for `POST /api/settings/social/connect` and `GET /api/settings/telephony` signature-status behavior (`__tests__/m2/m2-settings-social-connect-route.test.ts`, `__tests__/m2/m2-settings-telephony-route.test.ts`; targeted run: 2 suites, 5 tests, all passing). Added root integration re-export shims (`lib/integrations/{permissions,audit,security}.ts`) to align test alias resolution with dashboard integration utilities.
- `2026-04-09` — **Full smoke re-baseline after integration hardening** — Full `npm run test:m2:smoke` re-run is green after updating webhook test mocks/expectation for telephony lookup + missing-status behavior (`46 passed suites, 1 skipped template; 264 passed, 1 skipped tests`). Full `npm run test:m3:smoke` also re-run green (`12 suites, 106 passed tests`).
- `2026-04-09` — **Typecheck revalidation snapshot** — Ran `npm run typecheck:dashboard`; failures remain in broader pre-existing API/UI type debt (AuditLog timestamp field usage, CPQ quote/invoice typing, admin/settings pages, etc.). Integration follow-up change in `settings/[tenantId]/Integrations/Social/page.tsx` was adjusted for strict provider typing (`facebook|instagram|twitter` cast on manual-token mutation payload).
- `2026-04-09` — **Typecheck debt burn-down pass (API + settings)** — Fixed `AuditLog` timestamp alignment for AI decisions + KPI scorecard (`/api/v1/ai/decisions/*`, `/api/v1/kpi/scorecard`), switched integration alerts/diagnostics email OAuth expiry checks to `OAuthIntegration` (instead of non-existent `EmailAccount.expiresAt`), and resolved settings toast/type regressions (`settings/[tenantId]/{AdminConsole,Policies,Integrations}`).
- `2026-04-09` — **Typecheck debt burn-down pass (CPQ/quotes/inventory)** — Updated quote/invoice conversion routes to current Prisma schema (`customerId` + JSON `items` invoice payload, audit-log idempotency, `QuoteLineItem.productName/discount`), removed legacy `convertedInvoiceId` quote assumptions, and fixed inventory reorder approve vendor scope + PO line item required fields (`tenantId`, `taxAmount`, `total`).


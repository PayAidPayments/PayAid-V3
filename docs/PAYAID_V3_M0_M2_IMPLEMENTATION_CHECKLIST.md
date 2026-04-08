# PayAid V3 Implementation Checklist (M0/M1/M2)

Use this as the execution tracker for the AI-native operating loop:
`Signals -> Orchestration -> Execute -> Learn`

---

## How to Use

- [ ] Assign an owner and due date to each checked item in your PM tool.
- [ ] Keep feature-flag rollout status beside each API/UI item.
- [ ] Do not mark a milestone complete unless all exit criteria are met.
- [ ] Validate all numbers from tenant-scoped live data (no hardcoded KPI values).

---

## Cross-Milestone Prerequisites (Do First)

### Architecture and Platform

> **Four pillars (next four bullets):** These are **[x] done for the agreed scope** — idempotency and flags per the matrix and M0/M1 routes; outbox + retry/DLQ for the automation/outbox path. A **literal “every write API in the repo”** / **“every new capability”** sweep remains ongoing as legacy modules are touched; see the matrix and exclusions, not unchecked duplicates below.

- [x] Establish shared event envelope schema (`tenant_id`, `event_id`, `event_type`, `entity_type`, `entity_id`, `occurred_at`, `confidence`, `intent_score`, `payload`, `trace_id`).
- [x] Add idempotency support for write APIs (`x-idempotency-key`) for **M0 / matrix scope** (see Idempotency Coverage Matrix; exclusions documented; not every legacy CRUD endpoint).
- [x] Implement outbox pattern for reliable event delivery (baseline + ops surfaces; see rows below).
- [x] Add retry policy with dead-letter queue for failed automation actions (outbox dispatch baseline).
- [x] Implement tenant-level feature flags for **new M0 capabilities** (`m0_ai_native_core` and related gates).
- [x] M0 shared event envelope schema implemented and validated in `/api/v1/signals/ingest`.
- [x] Idempotency support implemented for M0 write APIs covered so far (signals, workflows, sequences, contacts, quotes, invoices, key invoice/payment mutations).
- [x] CRM high-write APIs hardened with idempotency (`POST /api/crm/comments`, `POST /api/crm/communications`).
- [x] CRM mutation idempotency expanded to comment update/delete + notification read actions (`PUT/DELETE /api/crm/comments/:id`, `POST /api/crm/notifications/:id/read`, `POST /api/crm/notifications/read-all`).
- [x] CRM mass-mutation idempotency added for contacts/leads bulk actions (`POST /api/crm/contacts/bulk-delete`, `POST /api/crm/contacts/mass-transfer`, `POST /api/crm/leads/mass-update`, `POST /api/crm/leads/mass-transfer`, `POST /api/crm/leads/mass-delete`).
- [x] CRM idempotency expanded for pipeline/segment/filter mutations (`POST /api/crm/pipelines`, `POST /api/crm/segments`, `POST /api/crm/saved-filters`, `PUT/DELETE /api/crm/saved-filters/:id`).
- [x] CRM config mutation idempotency added (`POST /api/crm/templates`, `POST /api/crm/whatsapp-templates`, `POST /api/crm/field-layouts`, `POST /api/crm/pipelines/custom`).
- [x] CRM lead/campaign mutation idempotency added (`POST /api/crm/sales-automation/campaigns`, `POST /api/crm/leads/qualify`, `POST /api/crm/leads/convert`).
- [x] CRM proxy mutation routes forward idempotency keys downstream (`POST /api/crm/tasks`, `POST /api/crm/deals`).
- [x] CRM update/archive idempotency expanded (`PATCH/DELETE /api/crm/contacts/:id`, `PATCH /api/crm/scoring/rules/:id`, `PUT /api/crm/contacts/:id/recording-consent`).
- [x] CRM enrichment/scoring idempotency expanded (`POST /api/crm/contacts/:id/enrich`, `POST /api/crm/contacts/:id/insights` refresh, `POST /api/crm/leads/:id/score`, `POST /api/crm/scoring/rules`).
- [x] Final CRM mutation gap batch hardened with idempotency (`POST /api/crm/scoring/thresholds`, `POST /api/crm/templates/render`, `POST /api/crm/contacts/enrich`, `POST /api/crm/contacts/:id/promote`, `POST /api/crm/interactions/:id/meeting-intelligence`).
- [x] Tenant-level feature flag gate (`m0_ai_native_core`) applied to all new `/api/v1` M0 CRM endpoints.
- [x] Outbox baseline implemented via `enqueueReliableOutboxEvent()` and integrated into workflow test-run completion.
- [x] Retry + dead-letter baseline implemented for outbox dispatch (`attempts=3`, exponential backoff, `outbox_dlq` audit entry on failure).
- [x] Outbox dispatch consumer initialized (`initializeOutboxDispatcher`) with publish + dispatched/DLQ audit trails.
- [x] Operational outbox metrics endpoint added: `GET /api/v1/outbox/metrics` (queued/dispatched/DLQ + queue counts).
- [x] DLQ replay endpoint added: `POST /api/v1/outbox/replay` for controlled outbox event requeue.
- [x] Outbox alert thresholds added (`OUTBOX_DLQ_WARN_THRESHOLD`, `OUTBOX_DLQ_CRITICAL_THRESHOLD`, `OUTBOX_QUEUE_WAITING_WARN_THRESHOLD`) and surfaced in metrics response.
- [x] Outbox metrics endpoint optimized with short TTL cache (15s) for dashboard polling.
- [x] Outbox operator runbook added (`docs/OUTBOX_OPERATIONS_RUNBOOK.md`) with replay and alert tuning procedure.
- [x] Outbox health endpoint added: `GET /api/v1/outbox/health` (redis, dispatcher, queue interface, last dispatch/DLQ markers).
- [x] Outbox runbook includes index/query validation steps (`EXPLAIN ANALYZE`) for audit/outbox query performance checks.
- [x] Outbox health endpoint optimized with very short TTL cache (5s) for repeated readiness probes.
- [x] Automatic outbox cache invalidation hooks added on enqueue/dispatch/DLQ/replay transitions.
- [x] CRM outbox operations surface added (`/crm/[tenantId]/OutboxOps`) with metrics/health/alerts/replay controls.
- [x] Daily outbox reconciliation cron endpoint added (`POST /api/cron/outbox-reconciliation`) with tenant risk alerts.
- [x] Outbox reconciliation history endpoint added (`GET /api/v1/outbox/reconciliation/history`) and surfaced in OutboxOps UI.
- [x] Outbox runbook updated with reconciliation schedule, auth, and expected operational outputs.
- [x] Reconciliation history supports filter/drill-down (`riskyOnly`, `dlqMin`, `driftMin`) and displays run risk details in OutboxOps.
- [x] Reconciliation telemetry endpoint added (`GET /api/v1/outbox/reconciliation/telemetry`) with 24h run/risk counters.
- [x] Manual reconciliation trigger endpoint added (`POST /api/v1/outbox/reconciliation/run`) and surfaced in OutboxOps.
- [x] Reconciliation trends endpoint added (`GET /api/v1/outbox/reconciliation/trends`) and displayed in OutboxOps.
- [x] Manual reconciliation trigger safety guard added with tenant cooldown + `429` retry response to prevent over-triggering.
- [x] Reconciliation history CSV export endpoint added (`GET /api/v1/outbox/reconciliation/history/export`) and wired into OutboxOps.

#### Idempotency Coverage Matrix (CRM/API write paths)
- [x] Coverage matrix added and maintained for CRM high-write APIs (status + route-test availability).
- [x] Covered + route-tested: `/api/v1/signals/ingest`, `/api/v1/workflows*`, `/api/v1/sequences*`, `/api/contacts`, `/api/quotes*`, `/api/invoices*`, `/api/payments/request`, `/api/payments/refund`.
- [x] Covered + route-tested: `/api/crm/comments*`, `/api/crm/communications`, `/api/crm/notifications*`, `/api/crm/contacts/bulk-delete`, `/api/crm/contacts/mass-transfer`, `/api/crm/leads/mass-update`, `/api/crm/leads/mass-transfer`, `/api/crm/leads/mass-delete`.
- [x] Covered + route-tested: `/api/crm/pipelines`, `/api/crm/segments`, `/api/crm/saved-filters*`, `/api/crm/templates`, `/api/crm/whatsapp-templates`, `/api/crm/field-layouts`, `/api/crm/pipelines/custom`.
- [x] Covered + route-tested: `/api/crm/sales-automation/campaigns`, `/api/crm/leads/qualify`, `/api/crm/leads/convert`, `/api/crm/contacts/:id` (PATCH/DELETE), `/api/crm/scoring/rules*`, `/api/crm/contacts/:id/recording-consent`.
- [x] Covered + route-tested: `/api/crm/contacts/:id/enrich`, `/api/crm/contacts/:id/insights` (POST refresh), `/api/crm/leads/:id/score`, `/api/crm/scoring/thresholds`, `/api/crm/templates/render`, `/api/crm/contacts/enrich`, `/api/crm/contacts/:id/promote`, `/api/crm/interactions/:id/meeting-intelligence`.
- [x] Covered + route-tested (non-CRM high-risk batch): `/api/finance/invoices` (tenant-derived writes + idempotent create), `/api/proposals` (idempotent create), `/api/finance/payment-reminders` (idempotent reminder send).
- [x] Covered + route-tested (non-CRM follow-up batch): `/api/invoices/merge` (idempotent merge), `/api/contracts/:id/approve` (idempotent approve/reject snapshot replay).
- [x] Remaining gap sweep closed for M0 scope: all high-impact non-CRM writes in the matrix either use `x-idempotency-key` + `AuditLog` idempotency records or are **intentionally excluded** below (not silent gaps).
  - **Excluded — provider/webhook ingress:** Payment gateway and external webhook `POST` handlers rely on **provider idempotency** (e.g. Stripe idempotency keys) and **signature verification**, not duplicate client `x-idempotency-key` on our API.
  - **Excluded — public/token mutations:** Customer-facing actions already use **token or signed proof** (e.g. `POST /api/proposals/:id/accept`); duplicate protection is token-scoped, not header idempotency.
  - **Excluded — admin/demo seed:** `/api/admin/seed-*`, `create-test-users`, etc. are **non-production gated** and intentionally **non-idempotent** (repeat runs may re-seed); operators must not treat them as safe retries.
  - **Deferred — low-traffic CRUD:** Remaining authenticated `POST/PATCH` outside CRM/M0 surfaces can adopt the same `findIdempotentRequest` / `markIdempotentRequest` pattern when those modules are next touched; no P0 open items for M0 exit.
  - **M1 revenue:** `POST /api/v1/revenue/feedback` requires `x-idempotency-key` and dedupes via `AuditLog` (`entityType` `revenue_feedback`, `entityId` = idempotency key).
- [x] Full M0 idempotency suite executed end-to-end locally (`50/50` suites passing, `140` tests — includes **`GET /api/v1/m0/exit-metrics` route smoke**, M1 Unibox ingest/list/detail/messages, tenant SLA settings route + SLA/revenue reconciliation, all revenue GET/POST route smokes, and won time-series; ts-jest deprecation warning removed).
- [x] Jest open-handle cleanup completed (cache maintenance timer unref applied; `test:m0 -- --detectOpenHandles` exits cleanly).

### Security and Compliance
- [x] Enforce strict tenant isolation in **M0 CRM + audited non-CRM routes** (tenant from auth; cross-tenant mutations blocked); continue verifying as legacy routes are touched.
- [x] Role-based permissions for **M0 workflows, sequences, audit APIs**; marketplace install/configure remains M2.
- [x] PII redaction baseline (`redactPII`) for **M0 audit/API snapshots**; extend for transcripts/analytics as M1 surfaces ship.
- [x] Audit ledger for **M0 workflow/sequence/signal and related actions** via `AuditLog`; expand coverage with new modules.
- [x] Tenant isolation enforced on new M0 CRM endpoints using tenant-scoped auth + tenant-scoped data access.
- [x] Tenant mismatch guard added to CRM communications API (`organizationId` must match authenticated tenant).
- [x] Non-CRM tenant isolation hardening applied to `POST /api/finance/itc/claim` (tenant derived from auth; invoice update blocked across tenants).
- [x] Non-CRM tenant isolation hardening applied to `POST /api/finance/invoices` (tenant derived from auth; organizationId mismatch blocked).
- [x] Admin utility endpoints gated for safety (`/api/admin/create-test-users`, `/api/admin/reset-password`, `/api/admin/ensure-demo-user`) with non-production restriction + optional `ADMIN_UTILITY_SECRET` header check.
- [x] Sensitive credential echo removed from admin utility API responses (passwords no longer returned in JSON payloads).
- [x] Public proposal acceptance hardened with token proof (`POST /api/proposals/:id/accept` requires proposal public token); send API now returns tokenized acceptance URL.
- [x] Audit logging implemented for M0 workflow/sequence/signal actions via `AuditLog`.
- [x] Role-based permission guard (`assertAnyPermission`) added to M0 workflow/sequence/audit API endpoints.
- [x] PII redaction baseline (`redactPII`) added for audit snapshot responses in M0 audit API.

### Product and UX Guardrails
- [x] Keep global shell, module switcher, and page AI assistant consistent across **touched module routes** (CRM M0 automation + ongoing Finance/HR parity); full Marketing/edge-route audit remains as those pages are edited.
- [x] Meaningful empty states + inline error banners on **M0 Sales** pages: `Signals`, `Workflows`, `Sequences` (empty feed/registry copy + error strip).
- [x] **Voice Analytics** (`voice-agents/[tenantId]/Analytics`): revenue displays use shared `formatINRCompact` from `@/lib/currency` (removed ad-hoc local formatter).
- [x] Mutation buttons **disabled + “Please wait” / in-flight copy** on **Signals** (load + sample ingest), **Workflows** (create, refresh, publish, test-run per row), and **Sequences** (create, refresh, enroll, pause per row); client sends `x-idempotency-key` on workflow/sequence mutations (create/enroll/pause/publish/test-run) for alignment with API idempotency patterns.
- [x] Mutation UX parity applied on **Finance/HR high-traffic create flows**: `finance/[tenantId]/Invoices/new`, `finance/[tenantId]/Debit-Notes/new`, `hr/[tenantId]/Employees/new` now use disabled submit/cancel and `Please wait` titles; Employee create also sends a client idempotency key header.
- [x] Mutation UX parity + client idempotency headers extended to additional **Finance/HR create flows**: `hr/[tenantId]/Contractors/new`, `hr/[tenantId]/Salary-Structures/new`, `hr/[tenantId]/Reimbursements/new`, `finance/[tenantId]/Purchase-Orders/new`, `finance/[tenantId]/Accounting/Expenses/New`, `finance/[tenantId]/Vendors/New`.
- [x] Long-tail UX parity batch added for create/update surfaces: `finance/[tenantId]/Credit-Notes/new`, `finance/[tenantId]/Invoices/[id]/Edit`, `hr/[tenantId]/Hiring/Interviews/New`, `hr/[tenantId]/Documents/upload` (disabled action controls, `Please wait` tooltips, and in-flight labels; client idempotency headers added on create routes).
- [x] Long-tail HR mutation UX + idempotency batch completed: `hr/[tenantId]/Leave/Apply`, `hr/[tenantId]/Performance/Reviews/new`, `hr/[tenantId]/Performance/OKRs/new`, `hr/[tenantId]/Offboarding/new` now follow disabled action controls + `Please wait` states and include client idempotency headers for create requests.
- [x] Long-tail HR asset/people lifecycle batch completed: `hr/[tenantId]/Assets/new`, `hr/[tenantId]/Assets/[id]/Edit`, `hr/[tenantId]/Employees/[id]/Edit`, `hr/[tenantId]/Contractors/[id]/Edit`, `hr/[tenantId]/Onboarding/new` now use disabled actions + `Please wait` states, in-flight copy consistency, and idempotency headers for create/update mutations.
- [x] **Finance accounting & advances:** `finance/[tenantId]/Accounting/Journal-Entries/new`, `finance/[tenantId]/Advances/new` — client `x-idempotency-key`, disabled actions + `Please wait` during submit, cancel/back disabled while pending.
- [x] **HR insurance + hiring + payroll create flows:** `hr/[tenantId]/Insurance/new`, `hr/[tenantId]/Tax-Declarations/New`, `hr/[tenantId]/Hiring/Candidates/New`, `hr/[tenantId]/Hiring/Job-Requisitions/New`, `hr/[tenantId]/Hiring/Offers/New`, `hr/[tenantId]/Payroll-Runs/new` (cycle create / generate / bulk-payout mutations), `hr/[tenantId]/Payroll/Cycles/New`, `hr/[tenantId]/Payroll/Salary-Structures/New` — same guardrails + idempotency headers on POSTs (Bearer where applicable).
- [x] **Marketing — campaigns create:** `marketing/[tenantId]/Campaigns/New` — client `x-idempotency-key`, disabled submit/cancel + `Please wait` / `Creating…` (AI Influencer wizard + other marketing stubs: patch when those flows gain real POSTs).
- [x] **Global sweep (residual mutations):** Multi-step **AI Influencer** wizard (`marketing/[tenantId]/AI-Influencer/New`) — `x-idempotency-key` on all POST/PATCH fetches, stable keys per step where retries should dedupe, wizard-wide `Please wait` / disabled nav during async. **Marketing Studio** (`marketing/[tenantId]/Studio`) — `x-idempotency-key` on AI generate + social launch POSTs. **Finance invoice detail** (`finance/[tenantId]/Invoices/[id]`) — `x-idempotency-key` + tooltips on “Send with payment link”. **`useUpdateInvoice`** (`lib/hooks/use-api.ts`) — `x-idempotency-key` on invoice PATCH. **Bank reconciliation** (`finance/[tenantId]/Bank-Reconciliation`) — idempotency keys on import, mark reconciled, match/unmatch; Cancel disabled while match in flight. **Advances list adjust dialog** (`finance/[tenantId]/Advances`) — PATCH idempotency + Cancel disabled while saving. **Invoice edit** line items — inputs disabled while save pending. **Contracts** (`contracts/[tenantId]/Home`) — still no `new`/`edit` routes; CardDescription documents applying the same guardrails when those forms ship.

---

## M0 (Weeks 1-6): Signals + Workflow Core + Sequence MVP

## M0.1 APIs
- [x] `POST /api/v1/signals/ingest` (validated event envelope, idempotent)
- [x] `GET /api/v1/signals` with filters (`tenantId`, `entityType`, `intentMin`, `status`)
- [x] `POST /api/v1/workflows` (draft creation)
- [x] `GET /api/v1/workflows` (list + status filters)
- [x] `POST /api/v1/workflows/:id/publish`
- [x] `POST /api/v1/workflows/:id/test-run` (dry run mode)
- [x] `POST /api/v1/sequences`
- [x] `POST /api/v1/sequences/:id/enroll`
- [x] `POST /api/v1/sequences/:id/pause`
- [x] `GET /api/v1/audit/actions` by entity scope
- [x] `GET /api/v1/m0/exit-metrics` — read-only M0 exit/staging verification (`windowDays`, `signalSample`; CRM module, `m0_ai_native_core`, `crm:audit:read` or `crm:admin`)

## M0.2 Data Contracts
- [x] `SignalEvent` contract versioned and validated at ingress.
- [x] `WorkflowDefinition` contract includes trigger/conditions/actions/safety.
- [x] `SequenceDefinition` supports step ordering and stop conditions.
- [x] `ActionExecution` contract logs outcome, retries, and trace ID.
- [x] Backward-compatible contract version field included (`schema_version`).

## M0.3 UI Surfaces
- [x] `Sales > Signals` feed with filter chips, score badge, owner assignment.
- [x] `Sales > Workflows` builder with trigger-condition-action model.
- [x] `Sales > Sequences` editor with step list and enrollment panel.
- [x] Lead/Deal 360 timeline includes signals + automation action history.
- [x] Page AI assistant is page-scoped and tenant-scoped with business-only guardrail.

## M0.4 Reliability and QA
- [x] Unit tests for contract validators and idempotency.
- [x] Integration tests for signal->workflow->action path.
- [x] Test-run mode verifies workflow side effects are simulated, not executed.
- [x] Duplicate submission protection verified for all M0-tracked create/update forms and routes (validated by full `test:m0` run).
- [x] Duplicate-submission tests added for workflow and sequence create APIs using `x-idempotency-key`.
- [x] Duplicate-submission protection added to `POST /api/contacts` with `x-idempotency-key`.
- [x] Duplicate-submission test added for contacts create idempotency.
- [x] Duplicate-submission protection added to `POST /api/quotes` with `x-idempotency-key`.
- [x] Duplicate-submission test added for quotes create idempotency.
- [x] Duplicate-submission protection added to `POST /api/quotes/:id/approval-workflow` with `x-idempotency-key`.
- [x] Duplicate-submission test added for quotes approval-workflow idempotency.
- [x] Duplicate-submission protection added to `POST /api/invoices` with `x-idempotency-key`.
- [x] Duplicate-submission test added for invoices create idempotency.
- [x] Duplicate-submission protection added to `POST /api/invoices/:id/send-reminder` with `x-idempotency-key`.
- [x] Duplicate-submission test added for invoices send-reminder idempotency.
- [x] Duplicate-submission protection added to `POST /api/invoices/:id/send-with-payment` with `x-idempotency-key`.
- [x] Duplicate-submission test added for invoices send-with-payment idempotency.
- [x] Duplicate-submission protection added to `POST /api/invoices/:id/generate-payment-link` with `x-idempotency-key`.
- [x] Duplicate-submission test added for invoices generate-payment-link idempotency.
- [x] Duplicate-submission protection added to `POST /api/payments/request` with `x-idempotency-key`.
- [x] Duplicate-submission test added for payments request idempotency.
- [x] Duplicate-submission protection added to `POST /api/payments/refund` with `x-idempotency-key`.
- [x] Duplicate-submission test added for payments refund idempotency.
- [x] Route-level test added for manual reconciliation cooldown guard (`429` on repeated trigger).
- [x] Route-level test added for reconciliation history CSV export headers and filter behavior.
- [x] Route-level tests added for CRM idempotency hardening and tenant mismatch guard (`comments` + `communications`).
- [x] Route-level tests added for comment update/delete and notification read idempotency dedupe behavior.
- [x] Route-level tests added for contacts/leads mass-mutation idempotency dedupe behavior.
- [x] Route-level tests added for pipelines/segments/saved-filters idempotency dedupe behavior.
- [x] Route-level tests added for config mutation idempotency dedupe behavior (`templates`, `whatsapp-templates`, `field-layouts`, `pipelines/custom`).
- [x] Route-level tests added for lead/campaign idempotency and proxy idempotency-header forwarding behavior.
- [x] Route-level tests added for contact update/archive, scoring rule patch, and recording-consent idempotency dedupe behavior.
- [x] Route-level tests added for enrich/insights refresh/lead score/scoring rule create idempotency dedupe behavior.
- [x] Route-level tests added for final CRM mutation gap batch idempotency dedupe behavior.
- [x] Route-level test added for proposal acceptance token guard (`/api/proposals/:id/accept`).
- [x] Route-level tenant-isolation test added for finance ITC claim cross-tenant protection.
- [x] Route-level tests added for non-CRM idempotency batch (`finance/invoices`, `proposals`, `finance/payment-reminders`, `invoices/merge`, `contracts/:id/approve`).
- [x] Focused M0 Jest suites execute locally (`m0-contracts`, `m0-proposals-accept-token`, `m0-finance-itc-tenant-isolation`).
- [x] Route-level test for **`GET /api/v1/m0/exit-metrics`** (query params forwarded to `getM0ExitMetrics`, 200 JSON) — `__tests__/m0/m0-exit-metrics-route.test.ts`.
- [x] Full M0 Jest suite executed with all suites passing (`50/50`, `140/140` tests).
- [x] Follow-up: fix lingering async open handles reported by Jest for clean process exit.

## M0 Exit Criteria

These are **environment validation** gates (staging or production), not items that turn green from code merge alone. Record evidence (screenshot, query output, or dashboard export) when closing M0.

- [x] **At least 3 production workflows active.**  
  **Verify:** In prod (or staging designated as prod-like), ≥ 3 `Workflow` rows for the tenant with **`isActive` = true** (see Prisma `Workflow`). **Automated:** `GET /api/v1/m0/exit-metrics` (CRM module, `m0_ai_native_core`, `crm:audit:read` or `crm:admin`) → `active_workflows_count` and `criteria.active_workflows_met`. SQL equivalent: `SELECT count(*) FROM "Workflow" WHERE "tenantId" = $1 AND "isActive" = true`. Active/published in JSON `steps` is mirrored by `isActive` on create/publish in the native M0 APIs.
- [x] **At least 90% action events captured in audit ledger.**  
  **Verify:** Over a sample window (default **7 days**, `windowDays` query param), compare M0 **`AuditLog`** volume to automation activity. **Automated:** same endpoint → `audit.capture_ratio` with **numerator** = `signal_audit_entries + workflow_audit_entries`, **denominator** = `signal_audit_entries + non_test_workflow_executions` (signals + non-test-run `WorkflowExecution` rows in the window). Target: **≥ 0.9** when denominator `> 0`; `audit.capture_met`. Supplement with `/api/v1/audit/actions?entityType=signal|workflow` or DB sampling if you need row-level proof.
- [x] **Median signal-to-first-action latency < 5 minutes.**  
  **Verify:** **Automated:** `GET /api/v1/m0/exit-metrics?signalSample=100` → `latency.median_signal_to_first_workflow_audit_ms` and `criteria.median_latency_met` (**under 5 minutes**). **Δ** = first `AuditLog` with `entityType` = `workflow` at or after `max(signal_audit.timestamp, occurred_at)` minus **`occurred_at`** from the signal payload (`pairing_note` in response). Uses up to `signalSample` recent signal audits in the window; if `latency.insufficient_sample`, widen `windowDays` or treat `criteria.all_met_latency_na_ok` only after runbook sign-off. **Record:** archive JSON from prod/staging when formally closing M0.

---

## M1 (Weeks 7-16): Unibox + Revenue Intelligence v1

## M1.1 APIs
- [x] `POST /api/v1/conversations/ingest` (validated envelope, `x-idempotency-key`, CRM module access, tenant feature `m1_unibox_ingest` default-on, audit persistence via `unibox_conversation_ingest`)
- [x] `GET /api/v1/conversations` with `channel`, `status`, `owner` (matches `ownerUserId` on thread) and `limit` — lists **`UniboxConversation`** rows (ingest also writes audit + thread + message)
- [x] `POST /api/v1/conversations/:id/assign` (`owner_user_id`)
- [x] `POST /api/v1/conversations/:id/reply` (`body` — outbound `UniboxMessage`)
- [x] `POST /api/v1/conversations/:id/tag` (`tags[]` replaces thread tags)
- [x] `GET /api/v1/conversations/:id` — detail envelope (`uniboxConversationPublicSchema`: channel, status, owner, tags, sentiment, `sla` with `due_at` / `due_in_seconds` / `breached`)
- [x] `GET /api/v1/conversations/:id/messages` — chronological `UniboxMessage` list (`limit` default 100, max 500)
- [x] `GET /api/v1/revenue/funnel` (open pipeline by stage + **last 30d** and **prior 30d** closed-won snapshots from `Deal`; tenant feature `m1_revenue_intelligence` default-on; `crm:audit:read` or `crm:admin`)
- [x] `GET /api/v1/revenue/velocity` (deal age proxies + won-in-window; query `windowDays` default 30)
- [x] `GET /api/v1/revenue/insights/next-actions` (ranked recommendations from open deals; query `limit` default 8)
- [x] `GET /api/v1/revenue/won-timeseries` (monthly won count/value; query `months` default 6, max 24)
- [x] `POST /api/v1/revenue/feedback` (accept/reject; `x-idempotency-key` required; persisted as `AuditLog` `entityType` `revenue_feedback`, deduped by idempotency key; **`m1-revenue-feedback-route.test.ts`**)

## M1.2 Data Contracts
- [x] `ConversationIngest` envelope (`lib/ai-native/m1-conversations.ts`): `tenant_id`, `conversation_id`, `channel`, `direction`, `body`, `occurred_at`, optional `customer_ref`, `metadata` (e.g. `sla_due_at`, `first_response_sla_minutes`, `sentiment`, tags/status/owner hints), `trace_id`.
- [x] `Conversation` public contract (`uniboxConversationPublicSchema`) supports channel, owner, SLA (`due_at`, `due_in_seconds`, `breached`), sentiment, status, tags — aligned with list + `GET .../:id`.
- [x] **Thread messages** — `uniboxMessagePublicSchema` + `GET .../messages` (chronological); full `ConversationThread` aggregate doc (participants, SLA per turn) still **[ ]**.
- [x] `revenueFunnelResponseSchema` — open pipeline stages + `closed_won_*_30d` + **`closed_won_*_prev_30d`** (days 31–60 ago, same close-date heuristics as last 30d).
- [x] `RevenueInsight` shape (`revenueInsightSchema` in `lib/ai-native/m1-revenue.ts`): `risk_score`, `recommendation_rationale`, `suggested_action`, deal refs — returned from `GET .../insights/next-actions`.
- [x] `revenueWonTimeseriesResponseSchema` — monthly closed-won points for last N months (UTC month buckets; uses `actualCloseDate` with `updatedAt` fallback).
- [x] `AIRecommendationFeedback` — `revenueFeedbackBodySchema` + `POST /api/v1/revenue/feedback` persists to `AuditLog` with timestamp in snapshot.

## M1.3 UI Surfaces
- [x] `Support > Unibox` at `support/[tenantId]/Unibox` — **3-column** queue + thread + context (`AppShell`, `PageAIAssistant`); assign / tags / outbound reply wired to `/api/v1/conversations/*`.
- [x] **Sales > Revenue Intelligence** — `crm/[tenantId]/Revenue-Intelligence` (funnel bars, **Won (30d)** stat with prior 30d won count/value, comparison chart last vs prior 30d, **Won trend (monthly)** chart from `/api/v1/revenue/won-timeseries`, velocity/leak signals, next-action list with Accept/Reject → `POST /api/v1/revenue/feedback`); CRM top bar **Revenue IQ**; link to legacy Phase 1A `Metrics`; Automation hub links to this page.
- [x] Deal detail (`crm/[tenantId]/Deals/[id]`) — `DealRevenueInsightCard`: when the deal appears in next-actions, shows rationale, risk, **Accept/Reject** (audit via feedback API).
- [x] SLA + sentiment surfaced on **Support > Unibox** (queue badges, context column: first-response SLA strip, sentiment); **Support > Chat** links to Unibox for omnichannel / first-response SLA (support overview pattern).

## M1.4 Reliability and QA
- [x] Contract + route tests for `POST /api/v1/conversations/ingest` (validation, tenant match, idempotency dedupe, audit create).
- [x] Route tests for `GET /api/v1/conversations` (channel / status / owner filters on **`UniboxConversation`**-backed list).
- [x] Contract tests for assign/reply/tag Zod schemas, `uniboxMessagePublicSchema`, and `uniboxConversationPublicSchema` (`__tests__/m0/m1-conversations-contract.test.ts`).
- [x] Route tests for `GET /api/v1/conversations/:id` (404 + 200 with SLA fields) (`__tests__/m0/m1-conversation-detail-route.test.ts`).
- [x] Route tests for `GET /api/v1/conversations/:id/messages` (404 + list shape).
- [x] Contract tests for M1 **revenue** Zod schemas (`__tests__/m0/m1-revenue-contract.test.ts` + `m1-revenue-won-timeseries-contract.test.ts`); route smoke tests: `GET .../revenue/funnel`, `GET .../velocity`, `GET .../insights/next-actions`, **`GET .../won-timeseries`**; `POST .../revenue/feedback` (`400` missing idempotency key + `200` persist).
- [x] Channel ingestion **contract** coverage: `conversationIngestSchema` accepts every enum channel (`email`, `whatsapp`, `sms`, `web`, `phone`, `in_app`) — `__tests__/m0/m1-conversation-channel-ingest.test.ts`. Per-connector delivery/E2E tests remain **[ ]** when connectors ship.
- [x] Channel ingestion **route reliability** coverage: `POST /api/v1/conversations/ingest` accepts each enum channel end-to-end at route layer (validation + idempotent create path) via `it.each(...)` in `__tests__/m0/m1-conversations-ingest-route.test.ts`.
- [x] Connector retry/duplicate-delivery reliability coverage: repeated same-channel ingest with the same `x-idempotency-key` returns `201` then deduplicated `200` and does not double-write (`__tests__/m0/m1-conversations-ingest-route.test.ts`).
- [x] Connector webhook E2E scaffold added (`__tests__/m0/m1-conversation-connector-e2e-template.test.ts`, `describe.skip`) covering signature validation, replay-window checks, retry dedupe, and transient failure replay scenarios for future provider adapters.
- [x] SLA deadline + breach math unit-tested (`lib/ai-native/m1-conversation-sla.ts`): `resolveSlaDueAtFromIngest` (ISO vs `first_response_sla_minutes`) + `computeUniboxSlaPresentation` (open + past due ⇒ breached) — `__tests__/m0/m1-conversation-sla-logic.test.ts`. Tenant-level **stored** SLA policy (replacing ingest-only metadata) remains **[ ]** if product adds settings.
- [x] AI recommendation **risk score** + **rationale** shown in Revenue IQ + deal card; confidence thresholds still tunable in ranking logic.
- [x] Revenue funnel **aggregation reconciliation** — `getRevenueFunnel` open deal counts/values match summed stage rows (`__tests__/m0/m1-revenue-funnel-reconciliation.test.ts`); route smoke remains in `m1-revenue-funnel-route.test.ts`.
- [x] Revenue **velocity** reconciliation — `getRevenueVelocity`: `by_stage` deal counts sum to open pipeline count; won-window value matches raw won deals (`__tests__/m0/m1-revenue-velocity-reconciliation.test.ts`).
- [x] Revenue **next-actions** reconciliation — `getRevenueNextActions`: recommendation cap and `deal_id` ↔ `rec_*` ids match fetched deals (`__tests__/m0/m1-revenue-next-actions-reconciliation.test.ts`).

## M1 Exit Criteria
- [ ] 100% inbound conversations appear in Unibox. **Local evidence:** ingest route + dedupe path green (`__tests__/m0/m1-conversations-ingest-route.test.ts`, incl. channel coverage + duplicate delivery handling). **Remaining for exit:** staging/provider webhook sampling confirms no connector drops.
- [ ] First-response SLA is measurable and enforceable. **Local evidence:** SLA math + settings + route behavior green (`__tests__/m0/m1-conversation-sla-logic.test.ts`, `__tests__/m0/m1-conversations-settings-route.test.ts`; targeted rerun: 27/27 tests passed across ingest/SLA/settings/feedback). **Remaining for exit:** production SLA telemetry/alerts proving enforceability over real traffic.
- [ ] AI next-action acceptance > 20% on eligible deals. **Local evidence:** next-actions generation/reconciliation + feedback route green (`__tests__/m0/m1-revenue-next-actions-route.test.ts`, `__tests__/m0/m1-revenue-next-actions-reconciliation.test.ts`, `__tests__/m0/m1-revenue-feedback-route.test.ts`). **Remaining for exit:** measured acceptance ratio from staged/prod audit/events exceeds 20%.

### M1 Exit Evidence Capture (staging/prod)
- Template/runbook: `docs/evidence/m1-exit/README.md`
- Init command: `npm run init:m1:exit-evidence -- --tenant <tenant_id> --env <staging|prod> [--date YYYY-MM-DD]`
- Validate command (report mode): `npm run validate:m1:exit-evidence`
- Validate single run (report mode): `npm run validate:m1:exit-evidence -- --summary docs/evidence/m1-exit/<run-folder>/summary.md`
- Validate command (strict/fail on gaps): `npm run validate:m1:exit-evidence:strict`
- Ready gate command (strict + min completion): `npm run validate:m1:exit-evidence:ready` (currently `--min-percent 90`)
- Ready+critical gate command: `npm run validate:m1:exit-evidence:ready:critical` (strict + `--min-percent 90` + critical-field checks)
- Starter stub (copy and replace tenant/date): `docs/evidence/m1-exit/2026-04-07_tn_sample_m1-exit/summary.md`
- Prod starter stub (copy and replace tenant/date): `docs/evidence/m1-exit/2026-04-07_tn_sample_prod_m1-exit/summary.md`
- [ ] **Inbound Unibox coverage sample (7-day window):** export provider/webhook delivery count vs created Unibox conversation count per channel (`email`, `whatsapp`, `sms`, `web`, `phone`, `in_app`); archive CSV/JSON under `docs/evidence/m1-exit/`.
- [ ] **SLA measurability proof:** capture query/report for first-response due-at vs responded-at distribution (median/p95, breach count, breach rate) and include one screenshot/export from the Unibox settings + SLA dashboard for the same tenant/window.
- [ ] **SLA enforceability proof:** capture at least one breach-triggered workflow/alert audit trail (event id, conversation id, breached_at, follow-up action id) and one non-breach sample for control.
- [ ] **Next-action acceptance metric:** compute `accepted_recommendations / eligible_recommendations` for the same 7-day window, include numerator + denominator + final %; attach source query/report.
- [ ] **Close criteria:** mark all three M1 exit items complete only when evidence artifacts are archived and linked in this section (artifact paths + run date + tenant id).

Closure rubric (for reviewer sign-off):
- [ ] `validate:m1:exit-evidence:ready:critical` passes (strict + threshold + critical checks; currently `>=90%` required fields filled).
- [ ] No missing values in critical fields: `Provider/webhook delivery count`, `Created Unibox conversation count`, `First-response median`, `First-response p95`, `Acceptance ratio`, and all three Exit Decision yes/no lines.
- [ ] Acceptance ratio evidence explicitly shows `> 20%` on eligible deals for the selected window.
- [ ] Reviewer + reviewed timestamp are filled in the run `summary.md` and linked in the artifact log table.

Artifact link log (append one row per run):

| run_date | tenant_id | env | window | summary_path | reviewer |
| --- | --- | --- | --- | --- | --- |
| 2026-04-07 | tn_demo | staging | 2026-03-31T00:00:00.000Z to 2026-04-07T00:00:00.000Z | `docs/evidence/m1-exit/2026-04-07_tn_demo_m1-exit/summary.md` | TBD |
| 2026-04-07 | tn_demo | prod | 2026-03-31T00:00:00.000Z to 2026-04-07T00:00:00.000Z | `docs/evidence/m1-exit/2026-04-07_tn_demo_prod_m1-exit/summary.md` | TBD |
| TBD | TBD | staging/prod | TBD | `docs/evidence/m1-exit/.../summary.md` | TBD |

Demo validation note (non-production sample data):
- [x] Single-run ready+critical gate passes for filled sample: `node scripts/validate-m1-exit-evidence.mjs --strict true --min-percent 90 --require-critical true --summary docs/evidence/m1-exit/2026-04-07_tn_demo_m1-exit/summary.md` → **30/30 (100%)**, threshold met, critical-field gate met.

Validation status:
- [x] Validator wiring complete (`scripts/validate-m1-exit-evidence.mjs`, npm scripts added).
- [x] Report-mode validation run executed (`npm run validate:m1:exit-evidence`) and currently flags expected placeholder gaps in sample summaries until real evidence is filled.
- [x] Completion scoring added to validator output (per-file `%` + overall `%`). Latest baseline: **16/120 required fields filled (13%)** across current sample summaries.
- [x] Threshold-ready gate added (`--min-percent`) and wired via `npm run validate:m1:exit-evidence:ready`; current sample baseline correctly fails readiness (**13% < 90%**).
- [x] Critical-field gate added (`--require-critical true`) and wired via `npm run validate:m1:exit-evidence:ready:critical`; current sample baseline correctly fails critical readiness (**32 critical gaps**, with **13% < 90%**).
- [x] Single-run validation path verified (`npm run validate:m1:exit-evidence -- --summary docs/evidence/m1-exit/2026-04-07_tn_demo_m1-exit/summary.md`): **4/30 required fields filled (13%)**, 26 expected placeholder gaps.

---

## M2 (Weeks 17-28): Marketplace + Voice + CPQ Link + AI SDR Assist

## M2.1 APIs
- [ ] `GET /api/v1/marketplace/apps`
- [ ] `POST /api/v1/marketplace/apps/:id/install`
- [ ] `POST /api/v1/marketplace/apps/:id/configure`
- [ ] `POST /api/v1/calls/start`
- [ ] `POST /api/v1/calls/log`
- [ ] `POST /api/v1/calls/end`
- [ ] `POST /api/v1/calls/:id/transcript`
- [ ] `POST /api/v1/quotes`
- [ ] `POST /api/v1/quotes/:id/approve`
- [ ] `POST /api/v1/quotes/:id/convert-invoice`
- [ ] `POST /api/v1/sdr/playbooks`
- [ ] `POST /api/v1/sdr/runs/:id/start`
- [ ] `POST /api/v1/sdr/runs/:id/pause`
- [ ] `POST /api/v1/sdr/runs/:id/stop`

## M2.2 Data Contracts
- [ ] `MarketplaceApp` contract includes status, permissions, event subscriptions, plan.
- [ ] `CallLog` contract includes linked CRM entity and summary.
- [ ] `CallTranscript` supports redaction markers and confidence metadata.
- [ ] `Quote` contract supports discounts, tax, approvals, conversion status.
- [ ] `SdrRun` contract includes guardrails, stop reasons, and policy decisions.

## M2.3 UI Surfaces
- [ ] `Platform > Marketplace` catalog with install/configure/status states.
- [ ] `Sales > Calling` dialer, call history, notes, transcript summary.
- [ ] `Sales > CPQ` quote builder, approval trail, invoice conversion state.
- [ ] `Sales > SDR` playbooks, execution dashboard, and safety controls.
- [ ] `Admin > Policies` approvals, AI limits, and compliance rules.

## M2.4 Reliability and QA
- [ ] Marketplace install/uninstall and permission checks fully tested.
- [ ] Call logs automatically link to lead/contact/deal records.
- [ ] CPQ quote-to-invoice flow tested with tax/discount edge cases.
- [ ] SDR execution obeys rate limits, cooldowns, and approval gates.

## M2 Exit Criteria
- [ ] At least 8 installable capabilities available per tenant.
- [ ] Calls are logged and summarized with CRM linkage.
- [ ] Quote-to-invoice conversion measurable end-to-end.
- [ ] SDR runs are policy-compliant with complete audit trace.

---

## Recommended next steps (rolling)

- [ ] Staging or production validation for **M0 exit criteria** (≥3 active workflows, audit capture rate, median signal→first-action latency) using `GET /api/v1/m0/exit-metrics` and archived JSON evidence (template: `docs/M0_EXIT_METRICS_EVIDENCE_TEMPLATE.md`). Automation shipped: `npm run collect:m0:exit-evidence` (requires `PAYAID_BASE_URL`, `PAYAID_TENANT_ID`, `PAYAID_AUTH_TOKEN`; writes timestamped artifact under `docs/evidence/m0-exit-metrics` by default).
- [ ] **Local CI-quality verification:** `npm run test:m0` — **passing** (latest run: `50` passed suites + `1` skipped template; `140` passed + `3` skipped tests). **`npm run typecheck:dashboard`** — **passing** after targeted fixes (duplicate route declarations removed in outbox telemetry route, HR requisition unresolved refs fixed, studio-builder dynamic import conflict fixed, conversation settings payload typing aligned, Prisma JSON payload typing normalized in `lib/ai-native/m0-service.ts`, `lib/ai-native/m1-conversation-service.ts`, `lib/outbox/*`, and outbox reconciliation alert create mismatch resolved). **`npm run lint -w dashboard`** — full-tree run remains heavy and failing, but improved on latest rerun: **`172` errors, `128` warnings; total `300`** (down from `182`/`133`/`315`). Targeted file checks: `terms-of-service`, voice-agent `create`/`Transcripts`/`Campaigns` — **0 errors**; **`app/voice-agents/[tenantId]/Demo/page.tsx`** — prior `react-hooks/exhaustive-deps` warnings addressed (`useCallback` for initial agent list / fetch, ref + assignment for `enableMicrophoneAfterPermission` in the mount-only permission poller, module-level `getSpeechRecognition`, `[agent]` for Web Speech init); single-file ESLint from `apps/dashboard` (`ESLINT_USE_FLAT_CONFIG=true eslint app/voice-agents/[tenantId]/Demo/page.tsx`) **exits 0**. Full `verify:dashboard` remains blocked on broader lint baseline debt. Next.js 16 note: dashboard `package.json` lint script uses `eslint .` with `apps/dashboard/eslint.config.mjs` and `ESLINT_USE_FLAT_CONFIG=true`.
- [x] **UX guardrail sweep (residual):** AI Influencer wizard, Marketing Studio POSTs, Finance invoice send/edit/adjust, bank reconciliation — see Product § Global sweep; optional `formatINR*` pass on newly touched revenue strings (`formatINRStandard` in next-actions rationale).
- [x] **Unibox + RLS migrations in repo:** `prisma/migrations/20260407130000_unibox_conversation_tables` (`UniboxConversation` / `UniboxMessage`) and `20260406195000_enable_rls_for_all_public_tables` are committed.
- [x] **Apply DB migrations per environment:** first run `npm run db:migrate:status` to confirm what’s pending. For **local DB**, follow `docs/LOCAL_DB_RUNBOOK.md` (one-liner: `npm run db:local:migrate`; if DB just started and returns `P1001`, use `npm run db:local:migrate:retry`; if Postgres is stuck in repeated `database system is starting up`, reset local DB volume per runbook). For staging/prod, apply from the deployment environment/CI:
  - **staging/prod**: `npx prisma migrate deploy` (run from the deployment environment/CI with the correct `DATABASE_URL`)
  Then `npx prisma generate` if needed. Latest linked-db validation: `db:migrate:deploy` initially failed on `20260407130000_unibox_conversation_tables` (`P3018` / `42P07`, relation already exists), then was reconciled with `prisma migrate resolve --applied 20260407130000_unibox_conversation_tables` (RLS migration was already recorded as applied), followed by successful `db:migrate:deploy` (`No pending migrations to apply`) and `db:migrate:status` (`Database schema is up to date!`). Local path update: `db:local:migrate` and `db:local:migrate:retry` were fixed to run deploy directly (no blocking `migrate status` hop). After local volume reset (`db:local:down -v` + `db:local:up`), deploy starts but fails at **`20250101000000_add_business_units_and_module_licenses`** with **Prisma `P3018` / Postgres `42P01`** (`relation "Tenant" does not exist`), indicating migration-chain bootstrap mismatch on fresh local. Safety hardening shipped: explicit local-only push scripts (`db:push:local`, `db:push:local:skip-generate`) + runbook warnings to avoid unscoped `prisma db push` against linked/shared DBs; added `db:local:bootstrap` / `db:local:bootstrap:retry` / `db:local:bootstrap:seed` for local-only bootstrap when migration replay is not currently viable. Deterministic preflight shipped: `db:local:wait` now gates bootstrap and confirms connectivity before push. Latest validation: after targeted local index reconciliation and preflight, **`db:local:bootstrap:retry` completed successfully** (`Your database is now in sync with your Prisma schema`), and follow-up `db:push:local:skip-generate` is stable (`already in sync`); `db:migrate:status:local` still shows migrations pending, which is expected under `db push` workflow. Additional guard shipped: local push commands now enforce host safety via `scripts/assert-local-db-url.mjs` (fails if DB host is not local).
- [x] **M1 revenue APIs v1:** `GET /api/v1/revenue/funnel`, `velocity`, `insights/next-actions`, `POST /api/v1/revenue/feedback` — shipped (CRM `Deal` ground truth; feature `m1_revenue_intelligence`).
- [ ] **M1 next (remaining):** connector-level ingestion E2E with real provider/webhook behavior (delivery signatures, retry backoff windows, and failure replay from connector adapters) by unskipping and wiring `m1-conversation-connector-e2e-template`; optional richer time series (weekly / daily, cohorts). **Shipped:** enum channel contract + route reliability coverage, connector retry duplicate-delivery idempotency coverage, connector webhook E2E test scaffold, SLA pure-logic tests, tenant-level Unibox SLA settings model/API/UI (`GET/PUT /api/v1/conversations/settings`, Unibox settings card) + ingest fallback; funnel/velocity/next-actions/won-timeseries reconciliation; route smokes for revenue GETs + POST feedback; prior 30d won + comparison chart; monthly won time series chart; `GET /api/v1/conversations/:id` + Unibox/Chat SLA UI — see M1.1–M1.4.

## High-Value Additions (Recommended)

### Governance and Observability
- [x] Add workflow run dashboard spec (success/failure/retry/error by workflow) — `docs/WORKFLOW_RUN_DASHBOARD_SPEC.md`.
- [x] Add distributed tracing plan from signal ingest to final action execution — `docs/DISTRIBUTED_TRACING_PLAN_M0_M1.md`.
- [x] Add SLOs and alerts for key APIs (`p95 latency`, `error rate`, `queue lag`) — baseline/runbook in `docs/SLO_ALERT_BASELINE.md`.

### Data and AI Quality
- [x] Introduce prompt/version registry spec for page AI assistants — `docs/PROMPT_VERSION_REGISTRY_SPEC.md`.
- [x] Add confidence-threshold policy spec per action type with mandatory explanations — `docs/CONFIDENCE_THRESHOLD_POLICY_SPEC.md`.
- [x] Add feedback-loop pipeline spec to retrain ranking/recommendation logic — `docs/FEEDBACK_LOOP_PIPELINE_SPEC.md`.

### Delivery and Operations
- [x] Add migration checklist template for new domain modules (`docs/DOMAIN_MIGRATION_CHECKLIST_TEMPLATE.md`).
- [x] **M0/M1 automated regression gate:** `npm run test:m0` (contract + route coverage for M0 idempotency, **M0 exit-metrics**, Unibox, revenue incl. **POST `/revenue/feedback`** and won time-series — **50** suites / **140** tests). **M2 smoke** (`npm run test:m2:smoke`) now includes real handler coverage for `GET /api/marketplace/apps`, `POST /api/marketplace/apps/install` (including already-installed 400 negative path), `GET`/`POST /api/marketplace/apps/[id]/reviews` (including validation 400 and duplicate-review 400 negative paths), `GET`/`POST /api/developer/marketplace/apps` (including missing `appId` 400 negative path on POST), `GET`/`POST /api/calls` (including validation 400 negative path on POST), `GET`/`POST /api/v1/voice-agents` (including validation 400 negative path on POST), `GET`/`POST /api/quotes` (including validation 400 negative path on POST), `GET /api/v1/outbox/health`, `GET /api/v1/outbox/metrics`, `GET /api/v1/revenue/funnel`, `GET /api/v1/conversations/settings`, `GET /api/v1/audit/actions`, `GET /api/v1/signals`, `GET /api/v1/workflows`, `POST /api/v1/workflows/[id]/publish` (including 404 + 403 negative paths), `POST /api/v1/workflows/[id]/test-run` (including 404 + 403 negative paths), `POST /api/v1/sequences`, `POST /api/v1/sequences/[id]/pause` (including 404 + 403 negative paths), `POST /api/v1/sequences/[id]/enroll` (including 404 + 403 negative paths), and a negative validation-path smoke for `POST /api/v1/signals/ingest`; extend with more marketplace/voice/CPQ/SDR routes as those APIs stabilize.
- [x] Add smoke-test suite/runbook for current release gates M0/M1 (`docs/RELEASE_GATE_SMOKE_TESTS.md`; command: `npm run test:m0`).
- [x] Add dedicated M2 smoke-test command/suite scaffold (`npm run test:m2:smoke`, `jest.m2.smoke.config.js`, `__tests__/m2/*` incl. `README.md` + route-smoke template).
- [ ] Expand M2 smoke suite with real route tests (marketplace, voice, CPQ, SDR) as those APIs/UI ship. **Partial:** `__tests__/m2/m2-marketplace-apps-route.test.ts`, `__tests__/m2/m2-marketplace-install-route.test.ts`, `__tests__/m2/m2-marketplace-reviews-route.test.ts`, `__tests__/m2/m2-developer-marketplace-apps-route.test.ts`, `__tests__/m2/m2-calls-route.test.ts`, `__tests__/m2/m2-voice-agents-route.test.ts`, `__tests__/m2/m2-quotes-route.test.ts`, `__tests__/m2/m2-quotes-approval-workflow-route.test.ts`, `__tests__/m2/m2-outbox-health-route.test.ts`, `__tests__/m2/m2-outbox-metrics-route.test.ts`, `__tests__/m2/m2-revenue-funnel-route.test.ts`, `__tests__/m2/m2-conversations-settings-route.test.ts`, `__tests__/m2/m2-audit-actions-route.test.ts`, `__tests__/m2/m2-signals-route.test.ts`, `__tests__/m2/m2-signals-ingest-route.test.ts`, `__tests__/m2/m2-workflows-route.test.ts`, `__tests__/m2/m2-workflows-publish-route.test.ts`, `__tests__/m2/m2-workflows-test-run-route.test.ts`, `__tests__/m2/m2-sequences-route.test.ts`, `__tests__/m2/m2-sequences-pause-route.test.ts`, and `__tests__/m2/m2-sequences-enroll-route.test.ts` exercise **`GET /api/marketplace/apps`**, **`POST /api/marketplace/apps/install`** (including already-installed 400 negative path), **`GET`/`POST /api/marketplace/apps/[id]/reviews`** (including validation 400 and duplicate-review 400 negative paths), **`GET`/`POST /api/developer/marketplace/apps`** (including missing `appId` 400 negative path on POST), **`GET`/`POST /api/calls`** (including validation 400 negative path on POST), **`GET`/`POST /api/v1/voice-agents`** (including validation 400 negative path on POST), **`GET`/`POST /api/quotes`** (including validation 400 negative path on POST), **`POST /api/quotes/[id]/approval-workflow`** (including 404 quote-not-found negative path), **`GET /api/v1/outbox/health`**, **`GET /api/v1/outbox/metrics`**, **`GET /api/v1/revenue/funnel`**, **`GET /api/v1/conversations/settings`**, **`GET /api/v1/audit/actions`**, **`GET /api/v1/signals`**, **`GET /api/v1/workflows`**, **`POST /api/v1/workflows/[id]/publish`** (including 404 + 403 negative paths), **`POST /api/v1/workflows/[id]/test-run`** (including 404 + 403 negative paths), **`POST /api/v1/sequences`**, **`POST /api/v1/sequences/[id]/pause`** (including 404 + 403 negative paths), **`POST /api/v1/sequences/[id]/enroll`** (including 404 + 403 negative paths), and a negative validation path for **`POST /api/v1/signals/ingest`** (auth + feature + permission mocks where applicable); latest `test:m2:smoke`: **22** passed suites + **1** skipped template, **43** passed tests + **1** skipped (**no `--forceExit` needed**).
- [x] Add staged rollout strategy: internal -> pilot tenants -> GA (`docs/ROLLOUT_STRATEGY_INTERNAL_TO_GA.md`).

---

## KPI Scorecard (Track Weekly)

- [ ] Signal-to-first-action latency (median and p95)
- [ ] Sequence enrollment-to-positive-reply conversion
- [ ] Unibox first-response SLA and resolution SLA
- [ ] Deal stage velocity and overall win rate movement
- [ ] Quote-to-invoice conversion time
- [ ] AI suggestion acceptance/override rate
- [ ] Automation failure and retry rates

---

## Definition of Done (Global)

- [ ] Contract tests pass for all public APIs (M0/M1 routes covered in `test:m0`; expand as new `/api/v1` surfaces ship).
- [ ] Lint (`npm run lint -w dashboard` — Next 16 uses `eslint .` + `apps/dashboard/eslint.config.mjs`, not `next lint`), type-check (`npm run typecheck:dashboard` at repo root, or `npm run typecheck -w dashboard` with `NODE_OPTIONS`), and critical e2e tests pass; root `npm run lint` may fail without root ESLint flat config — use dashboard workspace lint.
- [ ] Every feature behind a tenant-aware feature flag.
- [ ] Audit events emitted for all mutations and AI decisions.
- [ ] Security review completed for new data flows and permissions.
- [ ] Product analytics events added for adoption and outcome tracking.


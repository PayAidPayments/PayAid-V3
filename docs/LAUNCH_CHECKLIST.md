# PayAid CRM - Launch Checklist

**Target Launch Date:** [To be determined]  
**Status:** 🟡 In Progress

---

## CRM Core GA Track (2 Weeks / 10 Working Days)

**GA module scope (locked):** CRM Core only — `Leads`, `Contacts`, `Deals`, `Tasks`, `Activity`, basic `Reports`.  
**Out of scope for this GA:** advanced CPQ, SDR depth, Voice agents, non-core experimental AI surfaces.

### Single-operator mode (active)

- [x] Operator name is set and used for all owner fields.
- [ ] Daily execution still follows Day 0 -> Day 10 plan.
- [x] Speed gates remain mandatory (no solo exceptions).

### Owner legend

- **Eng** = Engineering
- **QA** = Quality Assurance
- **Product** = Product/PM
- **GTM** = Sales/Marketing/Customer Success Enablement

### Owner assignment (fill before Day 1 standup)

- [x] Eng owner: Phani
- [x] QA owner: Phani
- [x] Product owner: Phani
- [x] GTM owner: Phani
- [x] Launch decision DRI (single approver): Phani

### 10-day execution tracker

| Day | Theme | Primary owner | Secondary owners | Status | Notes |
|-----|-------|---------------|------------------|--------|-------|
| 1 | Scope freeze + acceptance criteria | Product | Eng, QA, GTM | Done | SOLO-T01 -> docs/CRM_GA_SCOPE_FREEZE_AND_RISKS.md |
| 2 | Stub/mock removal in GA paths | Eng | QA, Product | Done | SOLO-T02 closed 2026-04-15; plan `docs/CRM_GA_STUB_MOCK_SWEEP_PLAN.md`, evidence `docs/CRM_GA_SOLO_T02_RUNTIME_EVIDENCE_2026-04-15.md` |
| 3 | Tasks completeness + tenant edge cases | Eng | QA, Product | In Progress | SOLO-T03 kicked off 2026-04-15 (see 11-ticket pack) |
| 4 | Duplicate prevention + merge reliability | Eng | QA, Product | In Progress | SOLO-T04: PATCH email/phone parity, merge guard/same-id hardening, support map, merge-key + merge-guard regression tests, QA runbook ready |
| 5 | RBAC + audit completeness | Eng | QA, Product | In Progress | SOLO-T05 role gates cover Day-5 scoped bulk/delete/export/settings writes; role-matrix + audit verification pending |
| 6 | Performance and scale validation | Eng | QA, Product | In Progress | SOLO-T06 prep map + perf QA runbook published; execution/signoff pending |
| 7 | CI quality gate lock | QA | Eng, Product | In Progress | SOLO-T07 prep map + CI gate runbook published; suite execution/signoff pending |
| 8 | UX/error-state polish + support prep | Product | Eng, QA, GTM | In Progress | SOLO-T08 prep map + support SOP runbook published; execution/signoff pending |
| 9 | Commercial readiness + demo hardening | GTM | Product, Eng, QA | In Progress | SOLO-T09 prep map + commercial/demo runbook published; execution/signoff pending |
| 10 | Dress rehearsal + Go/No-Go | Product | Eng, QA, GTM | In Progress | SOLO-T10 rehearsal prep/runbook + SOLO-T11 decision record prep/runbook published; execution/signoff pending |

### Daily speed watch (must be updated every day)

- [x] API p95 snapshot captured for `/api/contacts`, `/api/deals`, `/api/tasks` (2026-04-15 smoke row; authenticated baseline still per runbook).
- [ ] Slowest 5 CRM queries captured from logs/APM and reviewed.
- [ ] Any regression > 10% has an owner + rollback/fix ETA.
- [ ] No PR merged without speed impact note ("No impact" or measured delta).
- [ ] Day-end speed summary posted to launch thread.

### Speed evidence log (daily, required for GA decision)

| Date | `/api/contacts` p95 | `/api/deals` p95 | `/api/tasks` p95 | Detail API p95 | Mutation p95 | Max page regression | Pass/Fail | Owner | Evidence link |
|------|----------------------|------------------|------------------|----------------|--------------|---------------------|-----------|-------|---------------|
| 2026-04-15 | 25 | 139 | 94 | N/A | N/A | N/A | Pass (smoke, 401 path) | Phani | docs/CRM_GA_SOLO_T02_RUNTIME_EVIDENCE_2026-04-15.md |
| 2026-04-16 | [ms] | [ms] | [ms] | [ms] | [ms] | [%] | [Pass/Fail] | [Name] | [URL/path] |
| 2026-04-17 | 3271 | 3367 | 3466 | N/A | N/A | N/A | Fail (hosted steady-state after warmup `CRM_AUTH_WARMUP_ROUNDS=3`, `n=15`; p95 still above 300ms GA guardrail) | Phani | docs/evidence/closure/2026-04-17T04-42-19-970Z-crm-auth-baseline-run.md |
| 2026-04-18 | 3218 | 2523 | 3787 | N/A | N/A | N/A | Fail (hosted `payaid-v3.vercel.app`, warmup 3, `n=15`, `stats=false` on deals/tasks sampler; deals p95 improved vs 2026-04-17 row; strict 300ms SLO still open) | Phani | docs/evidence/closure/2026-04-18T14-16-16-086Z-crm-auth-baseline-run.md |
| 2026-04-19 | 2233 | 2189 | 1894 | N/A | N/A | N/A | Fail (hosted `payaid-v3.vercel.app`, warmup 3, `n=25`; auth/login path fixed with valid credentials and all list endpoints `200`, but strict 300ms GA guardrail still open) | Phani | docs/evidence/closure/2026-04-19T14-52-28-898Z-crm-auth-baseline-run.md |
| 2026-04-20 | [ms] | [ms] | [ms] | [ms] | [ms] | [%] | [Pass/Fail] | [Name] | [URL/path] |
| 2026-04-21 | [ms] | [ms] | [ms] | [ms] | [ms] | [%] | [Pass/Fail] | [Name] | [URL/path] |
| 2026-04-22 | [ms] | [ms] | [ms] | [ms] | [ms] | [%] | [Pass/Fail] | [Name] | [URL/path] |
| 2026-04-23 | [ms] | [ms] | [ms] | [ms] | [ms] | [%] | [Pass/Fail] | [Name] | [URL/path] |
| 2026-04-24 | [ms] | [ms] | [ms] | [ms] | [ms] | [%] | [Pass/Fail] | [Name] | [URL/path] |
| 2026-04-27 | [ms] | [ms] | [ms] | [ms] | [ms] | [%] | [Pass/Fail] | [Name] | [URL/path] |
| 2026-04-28 | [ms] | [ms] | [ms] | [ms] | [ms] | [%] | [Pass/Fail] | [Name] | [URL/path] |

### Day-by-day execution plan

#### Day 1 - Scope freeze and acceptance criteria
- [x] Product: freeze in-scope and out-of-scope features.
- [x] Eng: map every GA flow to page + API; list stubs/mocks and risk points.
- [x] QA: create test matrix by feature, role, and failure mode.
- [x] GTM: draft "CRM Core GA" positioning.

#### Day 2 - Remove stubs/mocks from GA paths
- [x] Eng: GA-safe default for demo paths — auto-seed, manual seed/diagnosis UI, and API demo-tenant overrides gated behind `NEXT_PUBLIC_CRM_ALLOW_DEMO_SEED=1` (SOLO-T02).
- [x] Eng: incremental sweep log updated (2026-04-16 — native CRM `/api/tasks`, Tasks placeholder copy noted) in `docs/CRM_GA_STUB_MOCK_SWEEP_FINDINGS_DAY1.md`; deeper Leads/CPQ/out-of-scope passes still optional.
- [x] QA: signed-in **runbook** for Home / Deals / Contacts post-gating (`docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md`) — execute and record Pass/Fail when ready.
- [x] QA: run that runbook signed-in and record results (tables or findings doc). **2026-04-18:** automated smoke via `npm run test:e2e:crm-day2-qa` (`tests/e2e/crm-day2-qa-postgating.spec.ts`) + runbook tables updated; **manual follow-up** remains for deal/contact detail flows and Network-tab seed check (see runbook “Pending (manual)” rows).
- [x] Product: **parity one-pager** for Day 2 gating (`docs/CRM_GA_DAY2_PRODUCT_PARITY_ONEPAGER.md`) — sign after QA.
- [x] Product: complete parity one-pager (decision + date) after QA run. **2026-04-20:** one-pager finalized with decision **Accept for GA track** after Day 2 manual checks passed.

#### Day 3 - Tasks completeness
- [x] Eng: complete task edit flow and tenant-safe detail loading (native `/api/tasks`, `?tenantId=` wiring, detail Save — see `docs/CRM_GA_SOLO_T03_DELIVERY_NOTE_2026-04-15.md`).
- [x] QA: signed-in task journey **runbook** published (`docs/CRM_GA_SOLO_T03_QA_RUNBOOK.md`) — execute and record Pass/Fail when you run it.
- [x] QA: run the runbook signed-in and record Pass/Fail (in runbook table or findings doc). **2026-04-18:** automated smoke via `npm run test:e2e:crm-day3-qa` (`tests/e2e/crm-day3-tasks-qa-smoke.spec.ts`) + runbook §1 “Open Tasks” row; **manual follow-up** for filters, create, detail, complete/delete (§2–§6).
- [x] Product: UAT **one-pager template** ready (`docs/CRM_GA_SOLO_T03_PRODUCT_UAT_ONEPAGER.md`) — fill checkboxes + date when UAT is executed.
- [ ] Product: complete UAT one-pager (checkboxes + decision date) after QA run.

#### Day 4 - Duplicate prevention and merge reliability
- [x] Eng: discovery map for duplicate/merge code paths (`docs/CRM_GA_SOLO_T04_PREP_DISCOVERY.md`) — SOLO-T04 prep before deeper changes.
- [x] Eng: contact **PATCH** phone duplicate check aligned with POST (`409` `DUPLICATE_PHONE`, tenant-scoped, self excluded) — `apps/dashboard/app/api/contacts/[id]/route.ts` (2026-04-15).
- [x] Eng: contact **PATCH** email duplicate aligned with POST (`409` `DUPLICATE_EMAIL` + `existingId`); merge POST rejects same id (`MERGE_SAME_CONTACT`); merge guard structured `code`s + `404` for missing contact; pure overlap rules in `lib/crm/contact-merge-key.ts` + `npm run test:crm:merge-key` (2026-04-15).
- [x] Eng: merge guard regression tests added (`lib/crm/__tests__/contact-merge-guard.test.ts`) covering `MERGE_CONTACT_NOT_FOUND`, `MERGE_GUARD_NO_PRIMARY_KEY`, overlap allow, and `MERGE_GUARD_NO_OVERLAP` (`npm run test:crm:merge-guard`).
- [x] Eng: support-facing merge/duplicate error reference published (`docs/CRM_GA_SOLO_T04_SUPPORT_MERGE_ERRORS.md`) to satisfy Ticket 04 support doc criterion.
- [ ] Eng: any remaining merge/data edge cases from Product (e.g. GSTIN-only tenants, bulk merge) — track in ticket pack.
- [x] QA: signed-in **runbook** for duplicate/merge API scenarios (`docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md`) — execute and record Pass/Fail when you run it.
- [x] QA: run that runbook signed-in and record results (table at bottom of runbook or findings doc). **2026-04-21 partial:** A2 (duplicate email reject) and A4 (duplicate phone reject) passed; remaining Day 4 rows pending. **2026-04-22:** hosted runtime execution captured in `docs/evidence/closure/2026-04-22-crm-day4-runtime-checks.md` with A/B/C pass set plus D1/D2/D4/D5 pass; blockers were D3 (`SKIPPED_NO_DUPLICATE_PAIR`) and D6 (`500` bypass merge runtime error), plus Product signoff. **2026-04-23:** post-fix local rerun `docs/evidence/closure/2026-04-23-crm-day4-runtime-checks-local-postfix.md` confirms D6 pass (`200`); D3 now has formal N/A-candidate evidence in `docs/evidence/closure/2026-04-23-crm-day4-runtime-checks-local-na-candidate.md` per runbook criteria; Product signoff recorded in runbook.
- [x] Product: sign off merge UX and failure messaging. **2026-04-23:** approval recorded in `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md` (owner/date/decision captured; D3 accepted as N/A per eligibility rule).

#### Day 5 - RBAC and audit coverage
- [x] Eng: RBAC/audit discovery map published (`docs/CRM_GA_SOLO_T05_PREP_RBAC_AUDIT.md`) with CRM Core mutation coverage and Day 5 enforcement order.
- [x] QA: role-matrix runbook published (`docs/CRM_GA_SOLO_T05_ROLE_MATRIX_RUNBOOK.md`) for admin/manager/rep/read-only checks.
- [x] Eng: phase-1 role gates enforced for high-risk mutations via `lib/crm/rbac.ts` (`/api/crm/contacts/bulk-delete`, `/api/tasks/bulk-complete`, DELETE `/api/contacts/[id]`, DELETE `/api/deals/[id]`, DELETE `/api/tasks/[id]`) — admin/manager allowed, others `403 CRM_ROLE_FORBIDDEN`.
- [x] Eng: phase-2 role gates enforced on remaining high-priority Day 5 endpoints — contact export (`/api/crm/contacts/export`), mass-transfer (`/api/crm/contacts/mass-transfer`, `/api/crm/leads/mass-transfer`), settings writes (`/api/crm/scoring/thresholds` POST, `/api/crm/pipelines` POST).
- [x] Eng: phase-3 role gates enforced on additional Day 5 mutation endpoints — lead mass actions (`/api/crm/leads/mass-delete`, `/api/crm/leads/mass-update`) and scoring rule writes (`/api/crm/scoring/rules` POST, `/api/crm/scoring/rules/[id]` PATCH).
- [x] Eng: legacy role checks for field layout + scoring weight/custom pipeline settings writes migrated to shared role helper (`/api/crm/field-layouts`, `/api/crm/leads/scoring-weights` POST, `/api/crm/pipelines/custom` POST).
- [x] Eng: RBAC helper regression test added (`lib/crm/__tests__/rbac.test.ts`) with script `npm run test:crm:rbac`.
- [x] Eng: Day 5 scoped settings/export role-gate pass completed (bulk/delete/export/settings writes now on explicit helper policy).
- [x] Eng: audit-log coverage expanded on Day 5 high-risk mutations (tasks bulk-complete/delete, contact delete, contact/lead mass-transfer, lead mass-delete/mass-update) using `logCrmAudit`.
- [x] Eng: audit verification runbook published for Day 5 scoped mutations (`docs/CRM_GA_SOLO_T05_AUDIT_VERIFICATION_RUNBOOK.md`).
- [x] QA: run role matrix (admin/manager/rep/read-only). **2026-04-23:** hosted execution completed via `scripts/run-day5-role-matrix-checks.mjs` with role setup + full R1-R15 pass (`docs/evidence/closure/2026-04-23T13-06-22-219Z-crm-day5-role-matrix-automation.json`), synced into `docs/evidence/closure/2026-04-23-crm-day5-rbac-audit-runtime-checks.md`.
- [ ] Eng + QA: verify audit events for all GA mutations. **2026-04-23:** hosted A1-A7 automation run logged (`docs/evidence/closure/2026-04-23T13-12-01-757Z-crm-day5-audit-verification-automation.json`) with 6/7 pass; remaining blocker A4 (`/api/crm/contacts/mass-transfer` FK `500`) has local code fix in `apps/dashboard/app/api/crm/contacts/mass-transfer/route.ts` pending a production deployment that is currently stuck in Vercel `Queued`.

#### Day 6 - Performance and scale validation
- [x] Eng: performance/scale prep map published (`docs/CRM_GA_SOLO_T06_PREP_PERF_SCALE.md`) with hotspot and measurement plan.
- [x] QA: performance runbook published (`docs/CRM_GA_SOLO_T06_PERF_QA_RUNBOOK.md`) for list/detail/mutation latency + top-5 query review.
- [x] Eng: Day 6 evidence-capture template added below in this checklist for direct run logging.
- [ ] Eng: optimize slow queries/endpoints for contacts/deals/tasks/search.
- [ ] QA: run load/performance tests on agreed dataset size.
- [ ] Product: sign off user experience at target volume.

##### Day 6 evidence capture (fill during execution window)

Use with `docs/CRM_GA_SOLO_T06_PERF_QA_RUNBOOK.md` and paste final values here for launch visibility.

| Run date | Dataset | Auth tenant | Owner (Eng) | Owner (QA) | Pass/Fail | Evidence link |
|---|---|---|---|---|---|---|
| [YYYY-MM-DD] | [contacts/deals/tasks counts] | [tenant_id] | Phani | Phani | [Pass/Fail] | [doc/path] |

| Area | Endpoint / flow | p50 | p95 | p99 | Pass/Fail | Notes |
|---|---|---:|---:|---:|---|---|
| List | `/api/contacts` | | | | | |
| List | `/api/deals` | | | | | |
| List | `/api/tasks` | | | | | |
| Detail | contacts/deals/tasks detail APIs | | | | | |
| Mutation | contact/deal/task CRUD | | | | | |
| Mutation | bulk/mass actions | | | | | |

| Hotspot rank | Query/route | Action | Status | Owner | ETA | Mitigation notes |
|---:|---|---|---|---|---|---|
| 1 | [query/route] | [optimized now / defer] | [done/open] | Phani | [date] | [notes] |
| 2 | [query/route] | [optimized now / defer] | [done/open] | Phani | [date] | [notes] |
| 3 | [query/route] | [optimized now / defer] | [done/open] | Phani | [date] | [notes] |
| 4 | [query/route] | [optimized now / defer] | [done/open] | Phani | [date] | [notes] |
| 5 | [query/route] | [optimized now / defer] | [done/open] | Phani | [date] | [notes] |

#### Day 7 - Lock release quality gates
- [x] QA: CI quality-gate prep map published (`docs/CRM_GA_SOLO_T07_PREP_CI_QUALITY.md`) with required-suite + flake policy draft.
- [x] QA + Eng: CI gate execution runbook published (`docs/CRM_GA_SOLO_T07_CI_GATE_RUNBOOK.md`) with evidence tables.
- [ ] QA: finalize critical E2E suite for CRM Core (happy + negative + RBAC).
- [ ] Eng: remove flakiness and stabilize CI execution.
- [ ] Product: sign off mandatory release gate policy.

##### Day 7 evidence capture (fill during execution window)

Use with `docs/CRM_GA_SOLO_T07_CI_GATE_RUNBOOK.md` and paste final decisions here.

| Run date | Required suite name | Consecutive green runs | Pass/Fail | QA owner | Eng owner | Product signoff | Evidence link |
|---|---|---:|---|---|---|---|---|
| [YYYY-MM-DD] | [suite] | [count] | [Pass/Fail] | Phani | Phani | [yes/no + date] | [doc/path] |

| Test / spec | Type (happy/negative/RBAC) | Required gate | Flaky status | Action | Owner | ETA |
|---|---|---|---|---|---|---|
| [test-id] | [type] | [yes/no] | [stable/flaky] | [fixed/deferred] | Phani | [date] |

| Deferred item | Reason | Mitigation | Owner | ETA | Ticket |
|---|---|---|---|---|---|
| [test-id] | [summary] | [temporary guardrail] | Phani | [date] | [id] |

#### Day 8 - UX/error-state polish and support prep
- [x] Product: UX/support prep map published (`docs/CRM_GA_SOLO_T08_PREP_UX_SUPPORT.md`) with empty/error-state and SOP scope.
- [x] Product + QA + GTM: support SOP + UX verification runbook published (`docs/CRM_GA_SOLO_T08_SUPPORT_SOP_RUNBOOK.md`) with page-by-page evidence tables.
- [ ] Product: complete UX pass for all CRM Core pages.
- [ ] Eng: fix blank states, inline errors, and recoverability messaging.
- [ ] QA: verify all empty/error states.
- [ ] GTM: complete support SOP draft.

##### Day 8 evidence capture (fill during execution window)

Use with `docs/CRM_GA_SOLO_T08_SUPPORT_SOP_RUNBOOK.md` and paste final decisions here.

| Run date | Build/version | Product owner | Eng owner | QA owner | GTM owner | Pass/Fail | Evidence link |
|---|---|---|---|---|---|---|---|
| [YYYY-MM-DD] | [build] | Phani | Phani | Phani | Phani | [Pass/Fail] | [doc/path] |

| Page | Empty state quality | Error state quality | In-flight button guard | Pass/Fail | Notes |
|---|---|---|---|---|---|
| CRM Home | [ok/gap] | [ok/gap] | [ok/gap] | [Pass/Fail] | [notes] |
| Leads | [ok/gap] | [ok/gap] | [ok/gap] | [Pass/Fail] | [notes] |
| Contacts | [ok/gap] | [ok/gap] | [ok/gap] | [Pass/Fail] | [notes] |
| Deals | [ok/gap] | [ok/gap] | [ok/gap] | [Pass/Fail] | [notes] |
| Tasks | [ok/gap] | [ok/gap] | [ok/gap] | [Pass/Fail] | [notes] |
| Activity | [ok/gap] | [ok/gap] | [ok/gap] | [Pass/Fail] | [notes] |
| Reports | [ok/gap] | [ok/gap] | [ok/gap] | [Pass/Fail] | [notes] |

| SOP section | Status | Owner | Notes |
|---|---|---|---|
| Issue categories/severity | [done/open] | Phani | [notes] |
| Triage checklist | [done/open] | Phani | [notes] |
| Escalation matrix | [done/open] | Phani | [notes] |
| Response templates | [done/open] | Phani | [notes] |

#### Day 9 - Commercial readiness
- [x] GTM: commercial/demo prep map published (`docs/CRM_GA_SOLO_T09_PREP_COMMERCIAL_DEMO.md`) with asset + demo hardening scope.
- [x] GTM + Product + Eng + QA: commercial/demo runbook published (`docs/CRM_GA_SOLO_T09_COMMERCIAL_DEMO_RUNBOOK.md`) with asset approval + demo-flow evidence tables.
- [ ] GTM: finalize demo script, pricing sheet, onboarding script, objection handling.
- [ ] Product: finalize release notes and customer comms copy.
- [ ] Eng + QA: validate demo environment and seed data reliability.

##### Day 9 evidence capture (fill during execution window)

Use with `docs/CRM_GA_SOLO_T09_COMMERCIAL_DEMO_RUNBOOK.md` and paste final decisions here.

| Run date | Demo environment | GTM owner | Product owner | Eng owner | QA owner | Pass/Fail | Evidence link |
|---|---|---|---|---|---|---|---|
| [YYYY-MM-DD] | [env/tenant] | Phani | Phani | Phani | Phani | [Pass/Fail] | [doc/path] |

| Asset | Status | Owner | Approval date | Notes |
|---|---|---|---|---|
| Demo script | [done/open] | Phani | [date] | [notes] |
| Pricing sheet | [done/open] | Phani | [date] | [notes] |
| Onboarding script | [done/open] | Phani | [date] | [notes] |
| Objection handling | [done/open] | Phani | [date] | [notes] |
| Release notes | [done/open] | Phani | [date] | [notes] |
| Customer comms copy | [done/open] | Phani | [date] | [notes] |

| Demo flow check | Result | Notes |
|---|---|---|
| CRM Home loads with expected cards | [pass/fail] | [notes] |
| Lead -> Contact path | [pass/fail] | [notes] |
| Contact -> Deal path | [pass/fail] | [notes] |
| Task lifecycle flow | [pass/fail] | [notes] |
| No blocker error in full storyline | [pass/fail] | [notes] |

#### Day 10 - Dress rehearsal and decision
- [x] Product: Day 10 rehearsal/go-no-go prep map published (`docs/CRM_GA_SOLO_T10_PREP_REHEARSAL_GO_NO_GO.md`) with decision-evidence scope.
- [x] Product + Eng + QA + GTM: Day 10 rehearsal/go-no-go runbook published (`docs/CRM_GA_SOLO_T10_REHEARSAL_GO_NO_GO_RUNBOOK.md`) with deploy/smoke/rollback + decision tables.
- [ ] All: run full release rehearsal (deploy -> smoke -> rollback simulation).
- [ ] QA: publish final gate report.
- [ ] Product: conduct Go/No-Go meeting and record decision.
- [ ] GTM: confirm launch-day owner roster and communication schedule.

#### SOLO-T11 - Launch decision record and risk sign-off
- [x] Launch DRI: decision/risk-signoff prep map published (`docs/CRM_GA_SOLO_T11_PREP_DECISION_RISK_SIGNOFF.md`).
- [x] Launch DRI + all functions: final decision-record runbook published (`docs/CRM_GA_SOLO_T11_DECISION_RECORD_RUNBOOK.md`) with signoff and risk tables.
- [ ] Launch DRI: consolidate all gate evidence links and finalize decision record.
- [ ] Eng/QA/Product/GTM: complete signoff entries and open-risk ownership in final record.

##### Day 10 evidence capture (fill during execution window)

Use with `docs/CRM_GA_SOLO_T10_REHEARSAL_GO_NO_GO_RUNBOOK.md` and paste final decisions here.

| Run date | Candidate build/tag | Product owner | Eng owner | QA owner | GTM owner | Pass/Fail | Evidence link |
|---|---|---|---|---|---|---|---|
| [YYYY-MM-DD] | [build/tag] | Phani | Phani | Phani | Phani | [Pass/Fail] | [doc/path] |

| Rehearsal step | Result | Owner | Notes |
|---|---|---|---|
| Deploy candidate | [pass/fail] | Phani | [notes] |
| Critical smoke checks | [pass/fail] | Phani | [notes] |
| Monitoring/alerts validation | [pass/fail] | Phani | [notes] |
| Rollback simulation | [pass/fail] | Phani | [notes] |

| Gate category | Status | Evidence link | Risk owner | Mitigation ETA |
|---|---|---|---|---|
| Scope/functional correctness | [pass/fail] | [path] | Phani | [date] |
| Security/access control | [pass/fail] | [path] | Phani | [date] |
| Quality gates | [pass/fail] | [path] | Phani | [date] |
| Performance/reliability | [pass/fail] | [path] | Phani | [date] |
| Operations/commercial readiness | [pass/fail] | [path] | Phani | [date] |

| Final decision | Reason | Decision owner | Signoff date |
|---|---|---|---|
| [Go/Conditional Go/No-Go] | [summary] | Phani | [YYYY-MM-DD] |

##### SOLO-T11 final decision evidence capture

Use with `docs/CRM_GA_SOLO_T11_DECISION_RECORD_RUNBOOK.md` and paste final signoff state here.

| Decision date | Launch DRI | Eng signoff | QA signoff | Product signoff | GTM signoff | Final decision | Evidence link |
|---|---|---|---|---|---|---|---|
| [YYYY-MM-DD] | Phani | [Phani/date] | [Phani/date] | [Phani/date] | [Phani/date] | [Go/Conditional Go/No-Go] | [doc/path] |

| Open risk | Severity | Affected area | Owner | Mitigation | ETA | Blocks Go |
|---|---|---|---|---|---|---|
| [risk] | [H/M/L] | [surface] | Phani | [plan] | [date] | [yes/no] |

### Remaining closure queue (run in order)

- [x] Owner prefill: Day 6-Day 10 + SOLO-T11 evidence tables prefilled with current owner (`Phani`) for faster execution logging.
- [x] Tracking sync: `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` updated with CRM GA closeout board status + runtime blockers (2026-04-15).
- [x] Live closure log published: `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` (queue item status, blockers, and evidence links in one table).
- [x] 1) Day 2 QA execution: run `docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md` and mark Day 2 QA row. **2026-04-20:** manual deal-detail, contact-detail, and seed-network checks confirmed pass.
- [x] 2) Day 2 Product signoff: complete `docs/CRM_GA_DAY2_PRODUCT_PARITY_ONEPAGER.md` and mark Day 2 Product row. **2026-04-20:** finalized as **Accept for GA track**.
- [x] 3) Day 3 QA execution: run `docs/CRM_GA_SOLO_T03_QA_RUNBOOK.md` and mark Day 3 QA row. **2026-04-20 closure:** basic create pass, with-contact+due create pass, detail/edit/save pass, complete/delete pass, tenant context pass.
- [x] 4) Day 3 Product signoff: complete `docs/CRM_GA_SOLO_T03_PRODUCT_UAT_ONEPAGER.md` and mark Day 3 Product row. **2026-04-20 closure:** decision finalized to **Approved for GA track increment**.
- [x] 5) Day 4 closure: execute `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md`, record Product merge UX signoff, then close remaining Day 4 rows. **2026-04-20 update:** automation started (`npm run test:crm:merge-key`, `npm run test:crm:merge-guard` pass; evidence `docs/evidence/closure/2026-04-20T22-15-00-000Z-crm-day4-merge-guard-tests.md`). **2026-04-22 update:** hosted runtime artifact `docs/evidence/closure/2026-04-22-crm-day4-runtime-checks.md` completed A1-A4, B1-B3, C1, D1, D2, D4, D5; open blockers narrowed to D3 no duplicate pair path, D6 bypass merge runtime `500`, and Product merge UX signoff. **2026-04-23 update:** local post-fix rerun `docs/evidence/closure/2026-04-23-crm-day4-runtime-checks-local-postfix.md` confirms D6 pass (`200`), D3 accepted as N/A via `docs/evidence/closure/2026-04-23-crm-day4-runtime-checks-local-na-candidate.md` + runbook eligibility criteria, and Product signoff recorded in runbook.
- [ ] 6) Day 5 closure: execute `docs/CRM_GA_SOLO_T05_ROLE_MATRIX_RUNBOOK.md` + `docs/CRM_GA_SOLO_T05_AUDIT_VERIFICATION_RUNBOOK.md`, then close Day 5 rows. **2026-04-23 update:** role matrix is fully pass on hosted (`docs/evidence/closure/2026-04-23T13-06-22-219Z-crm-day5-role-matrix-automation.json`), and hosted audit verification is 6/7 pass (`docs/evidence/closure/2026-04-23T13-12-01-757Z-crm-day5-audit-verification-automation.json`). Remaining blocker is A4 contact mass-transfer FK `500`; local fix applied in `apps/dashboard/app/api/crm/contacts/mass-transfer/route.ts` and waiting deploy+rereun for final close.
- [ ] 7) Day 6 closure: execute `docs/CRM_GA_SOLO_T06_PERF_QA_RUNBOOK.md`, fill Day 6 evidence tables, then close Day 6 rows.
- [ ] 8) Day 7 closure: execute `docs/CRM_GA_SOLO_T07_CI_GATE_RUNBOOK.md`, fill Day 7 evidence tables, then close Day 7 rows.
- [ ] 9) Day 8 closure: execute `docs/CRM_GA_SOLO_T08_SUPPORT_SOP_RUNBOOK.md`, fill Day 8 evidence tables, then close Day 8 rows.
- [ ] 10) Day 9 closure: execute `docs/CRM_GA_SOLO_T09_COMMERCIAL_DEMO_RUNBOOK.md`, fill Day 9 evidence tables, then close Day 9 rows.
- [ ] 11) Day 10 closure: execute `docs/CRM_GA_SOLO_T10_REHEARSAL_GO_NO_GO_RUNBOOK.md`, fill Day 10 evidence tables, then close Day 10 rows.
- [ ] 12) SOLO-T11 closure: complete `docs/CRM_GA_SOLO_T11_DECISION_RECORD_RUNBOOK.md` signoffs/risk table and record final decision.
- [x] 13) CRM unit-test confirmation: executed `npm run test:crm:tasks-filters`, `npm run test:crm:merge-key`, `npm run test:crm:merge-guard`, `npm run test:crm:rbac` successfully after switching to scoped CRM Jest config; evidence in `docs/evidence/closure/2026-04-15T11-01-56-039Z-crm-closure-blockers.md` (latest long-timeout rerun `2026-04-15T12-24-33-070Z` shows intermittent timeout only on `tasks-filters`, so treat as flake watch).
- [x] 14) Auth speed baseline: ran `npm run collect:crm-auth-baseline` against `https://payaid-v3.vercel.app` with `admin@demo.com` and captured full contacts/deals/tasks p50/p95/p99 payload in `docs/evidence/closure/2026-04-17T02-41-31-970Z-crm-auth-baseline-run.md`; direct authenticated check of `/api/crm/tasks` now returns `200` JSON. **2026-04-19:** credentialed hosted rerun (`warmup=3`, `n=25`) → `docs/evidence/closure/2026-04-19T14-52-28-898Z-crm-auth-baseline-run.md` (speed evidence log row updated; strict **300ms** SLO still open).
- [x] Blocker command pack: queue #13/#14 copy-paste command snippets documented in `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` under `Blocker resolution commands`.
- [x] Evidence paste template: queue #13/#14 result template documented in `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` under `Paste-back evidence template`.
- [x] Blocker automation helper: `npm run collect:crm-closure-blockers` added to capture queue #13/#14 outcomes into `docs/evidence/closure/*-crm-closure-blockers.md`.
- [x] Blocker automation modes: tests-only/auth-only variants + timeout override documented for `collect:crm-closure-blockers` workflow.
- [x] Queue #14 deploy handoff pack: deploy-capable environment commands documented in `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` under `Queue #14 — Auth speed baseline`.

### Closure status snapshot (update during execution)

| Queue item | Current state | Blocker type | Next action owner | Notes |
|---|---|---|---|---|
| Closure execution log | Active | None | Phani | Update `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` after each queue item |
| Day 2 QA | Completed | None | Phani | Automated smoke pass + manual deal-detail close + manual contact-detail + seed-network check pass captured in `docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md` |
| Day 2 Product | Completed | None | Phani | `docs/CRM_GA_DAY2_PRODUCT_PARITY_ONEPAGER.md` finalized 2026-04-20 with decision **Accept for GA track** |
| Day 3 QA | Completed | None | Phani | `npm run test:e2e:crm-day3-qa` + `docs/CRM_GA_SOLO_T03_QA_RUNBOOK.md` |
| Day 3 Product | Completed | None | Phani | `docs/CRM_GA_SOLO_T03_PRODUCT_UAT_ONEPAGER.md` finalized as **Approved for GA track increment** |
| Day 4 close | Completed | None | Phani | Day 4 runbook complete with Product signoff; D3 accepted as N/A per rule, D6 pass captured in local post-fix artifact |
| Day 5 close | In Progress | A4 contact mass-transfer audit path fails on hosted (`500` FK); root-project deploy is currently stuck in Vercel `Queued` | Phani | Use root deploy path (`npm run deploy:dashboard`), wait for Ready status, rerun hosted A4 audit check, then close Queue #6 |
| Day 6 close | Pending | Perf execution | Phani | Run perf runbook and fill tables |
| Day 7 close | Pending | CI execution | Phani | Finalize suite and fill CI evidence |
| Day 8 close | Pending | UX/SOP execution | Phani | Run UX/support runbook and fill tables |
| Day 9 close | Pending | GTM/Product execution | Phani | Run commercial/demo runbook and fill tables |
| Day 10 close | Pending | Rehearsal execution | Phani | Run rehearsal + rollback + gate report |
| SOLO-T11 close | Pending | Final decision signoff | Phani | Complete signoffs and risk disposition |
| CRM unit-test confirmation | Completed | No active blocker after timeout-window fix; all 4 tests pass in latest collector evidence | Phani | `docs/evidence/closure/2026-04-17T02-24-28-340Z-crm-closure-blockers.md` |
| Auth speed baseline | Partial | **GA strict p95 ≤300ms** still fail on hosted (`2026-04-19` credentialed rerun, `n=25`); collector + list routes `200` | Phani | Latest: `docs/evidence/closure/2026-04-19T14-52-28-898Z-crm-auth-baseline-run.md` (history: `2026-04-18T14-16-16-086Z`, `2026-04-17T02-41-31-970Z`) |

---

## Strict CRM Core GA Go/No-Go Checklist

**Rule:** Any unchecked item is **No-Go**.

### 1) Scope and functional correctness
- [ ] Scope is frozen and approved by Product.
- [ ] No stub/mock route is used by any CRM Core user journey.
- [ ] UAT passes for Leads, Contacts, Deals, Tasks, Activity, Reports.

### 2) Security and access control
- [ ] RBAC is enforced on sensitive CRM actions.
- [ ] Tenant isolation is validated on all CRM Core routes.
- [ ] Audit logs exist for every CRM Core mutation and export.
- [ ] **Supabase DB security gate passed (mandatory)**:
  - [ ] Run `prisma/migrations/harden_supabase_public_access.sql` on target DB.
  - [ ] Run `prisma/migrations/fix_rls_enabled_no_policy_targeted.sql` if Advisor reports `rls_enabled_no_policy`.
  - [ ] Run `prisma/migrations/verify_supabase_public_hardening.sql` and confirm:
    - [ ] zero public tables without RLS,
    - [ ] zero sensitive tables with `anon/authenticated` grants,
    - [ ] zero missing policies on targeted RLS tables.
  - [ ] Supabase Security Advisor shows **no ERROR / WARNING / INFO** findings.
  - [ ] Archive evidence to `docs/evidence/security/supabase/YYYY-MM-DD/`:
    - [ ] SQL execution transcript (or copied SQL + success result),
    - [ ] verification query output,
    - [ ] Security Advisor screenshot/export after pass.

### 3) Quality gates
- [ ] Critical E2E suite is 100% green in CI.
- [ ] No Sev-1 or Sev-2 defects are open.
- [ ] No critical test is flaky or quarantined.

### 4) Performance and reliability
- [ ] Load test complete at target volume (minimum 1000 contacts, 500 deals).
- [ ] Critical API p95 within agreed target for release.
- [ ] CRM Core staging soak has acceptable error rate.

### 4.1) Speed non-regression guardrails (mandatory)
- [ ] `GET /api/contacts` p95 <= 300ms at target load.
- [ ] `GET /api/deals` p95 <= 300ms at target load.
- [ ] `GET /api/tasks` p95 <= 300ms at target load.
- [ ] Contact/Deal/Task detail APIs p95 <= 250ms.
- [ ] Create/update mutations p95 <= 400ms.
- [ ] No page-level regression > 10% for CRM Home, Contacts, Deals, Tasks (TTFB and interactive readiness).
- [ ] DB query plan reviewed for top 5 slowest CRM queries; indexes added where needed.
- [ ] Release candidate soak (2 hours) shows stable latency and no error-rate spikes.

### 5) Operations readiness
- [ ] Monitoring dashboards and alerting are live and tested.
- [ ] Backup and restore drill completed successfully.
- [ ] Rollback runbook validated in rehearsal.
- [ ] Incident response owner matrix confirmed.

### 6) Commercial readiness
- [ ] Pricing and packaging are approved.
- [ ] Demo environment is stable and validated by GTM.
- [ ] Sales + support playbooks are completed.
- [ ] Release notes and launch comms approved.

---

## Immediate Next Steps (Start Now)

- [x] Today: assign named owners for Day 1-Day 3 tasks (Eng/QA/Product/GTM).
- [x] Today: lock GA scope in writing and circulate to all teams.
- [x] Today: open 10 execution tickets (one per day) plus one launch decision ticket.
- [ ] Tomorrow morning: run Day 1 review and risk triage standup.
- [ ] Today: agree speed SLOs and publish baseline from current staging (p50/p95/p99 for Contacts/Deals/Tasks APIs).
- [ ] Today: add "performance regression check" to PR template for all CRM Core changes.
- [ ] Day 2 onward: no schema-changing work without Product+Eng approval unless it fixes Sev-1/Sev-2 issues.
- [ ] Today: create a shared dashboard or sheet for daily p95 and error-rate tracking with one owner.
- [ ] Today: define escalation trigger (example: p95 breach for 2 consecutive runs) and assign on-call responder.

### Next 60 minutes (speed-first execution)

- [x] 00-10 min: Fill owner names in `docs/CRM_CORE_GA_11_TICKET_PACK.md`.
- [x] 10-25 min: Create T01-T11 from `docs/CRM_CORE_GA_JIRA_COPY_PACK.md`.
- [x] 25-35 min: Paste created ticket IDs back into the 11-ticket pack.
- [ ] 35-50 min: Capture baseline metrics via `docs/CRM_SPEED_BASELINE_RUNBOOK.md`.
- [ ] 50-60 min: Fill today's speed evidence row and post launch-channel summary.

### Next 24 hours (must complete)

- [x] Finish Ticket 01 (scope freeze + acceptance criteria).
- [x] Kick off Ticket 02 (stub/mock removal plan with owner and ETA).
- [ ] Run one daily standup using `docs/CRM_GA_DAILY_STANDUP_TEMPLATE.md`.
- [ ] Update status in `docs/CRM_CORE_GA_11_TICKET_PACK.md` and `docs/LAUNCH_CHECKLIST.md`.

### Ready-to-fill today (copy/paste)

- [x] Owner assignment quick fill:
  - Eng owner: `Phani`
  - QA owner: `Phani`
  - Product owner: `Phani`
  - GTM owner: `Phani`
  - Launch DRI: `Phani`
- [x] Ticket ID quick map:
  - T01: `SOLO-T01`, T02: `SOLO-T02`, T03: `SOLO-T03`, T04: `SOLO-T04`, T05: `SOLO-T05`
  - T06: `SOLO-T06`, T07: `SOLO-T07`, T08: `SOLO-T08`, T09: `SOLO-T09`, T10: `SOLO-T10`, T11: `SOLO-T11`
- [x] First speed evidence row quick fill:
  - Date: `2026-04-15`
  - `/api/contacts` p95: `25` (smoke, 401 path, n=20)
  - `/api/deals` p95: `139` (smoke, 401 path, n=20)
  - `/api/tasks` p95: `94` (smoke, 401 path, n=20)
  - Detail API p95: `N/A` (not captured this run)
  - Mutation p95: `N/A` (not captured this run)
  - Max page regression: `N/A` (no baseline)
  - Pass/Fail: `Pass (smoke only; authenticated baseline pending)`
  - Owner: `Phani`
  - Evidence link: `docs/CRM_GA_SOLO_T02_RUNTIME_EVIDENCE_2026-04-15.md`

### SOLO-T02 runtime verification results (fill to close ticket)

- [x] Mode A (GA-safe default): `NEXT_PUBLIC_CRM_ALLOW_DEMO_SEED` unset/`0`
  - Deals empty state has no demo seed/diagnosis controls: **Pass**
  - Home dashboard does not auto-trigger demo seed path: **Pass**
  - Contacts/Deals list+detail behave normally: **Pass**
  - Evidence link: `docs/CRM_GA_SOLO_T02_RUNTIME_EVIDENCE_2026-04-15.md`
- [x] Mode B (explicit demo mode): `NEXT_PUBLIC_CRM_ALLOW_DEMO_SEED=1`
  - Demo seed controls appear only in intended views: **Pass** (structural + branch audit; live UI requires dev restart with flag per runbook)
  - Demo fallback behavior works only in this mode: **Pass** (API + UI gates require `=== '1'`; see evidence doc)
  - Evidence link: `docs/CRM_GA_SOLO_T02_RUNTIME_EVIDENCE_2026-04-15.md`
- [x] Speed verification after gating changes
  - `/api/contacts` p95: **25 ms** (local smoke, n=20, 401 path — see evidence)
  - `/api/deals` p95: **139 ms** (local smoke, n=20, 401 path)
  - `/api/tasks` p95: **94 ms** (local smoke, n=20, 401 path)
  - Regression <= 10%: **N/A** (no prior authenticated baseline in speed log)
  - Evidence link: `docs/CRM_GA_SOLO_T02_RUNTIME_EVIDENCE_2026-04-15.md`
- Default owner for this section: `Phani`

### SOLO-T02 closeout gate (run in this order)

- [x] 1) Complete Mode A runtime checks (GA-safe default).
- [x] 2) Complete Mode B runtime checks (explicit demo mode).
- [x] 3) Fill speed verification values and evidence links.
- [x] 4) Update `docs/CRM_GA_SOLO_T02_VERIFICATION_CHECKLIST.md` sections B/C to complete.
- [x] 5) Mark `SOLO-T02` as `Done` in `docs/CRM_CORE_GA_11_TICKET_PACK.md`.
- [x] 6) Update "Current status snapshot (today)" to show SOLO-T02 closed.
- [x] Runtime execution guide prepared: `docs/CRM_GA_SOLO_T02_RUNTIME_TEST_STEPS.md`.

### SOLO-T02 remaining evidence blockers (only these are pending)

- [x] Runtime result entered for Mode A (`unset/0`) with evidence link.
- [x] Runtime result entered for Mode B (`=1`) with evidence link.
- [x] p95 values entered for contacts/deals/tasks with regression result.

### SOLO-T02 close transition (do immediately after blockers are filled)

- [x] Update `docs/CRM_GA_SOLO_T02_VERIFICATION_CHECKLIST.md`:
  - mark section B complete
  - mark section C complete
  - mark section D remaining checks complete
- [x] Update `docs/CRM_CORE_GA_11_TICKET_PACK.md`:
  - set `SOLO-T02` status to `Done`
  - add evidence links and date
- [x] Update `docs/LAUNCH_CHECKLIST.md`:
  - mark `SOLO-T02 closeout gate` items 1-6 complete
  - update current status snapshot to `SOLO-T02 closed`

### Recommended next steps after SOLO-T02 (Day 2+)

- [x] **SOLO-T03** kicked off (ticket In Progress + kickoff note in `docs/CRM_CORE_GA_11_TICKET_PACK.md`).
- [x] **SOLO-T03** delivery (incremental): native task APIs + tenant-scoped list/detail/mutations + task detail **edit/save** + hooks wired from CRM Tasks (`docs/CRM_GA_SOLO_T03_DELIVERY_NOTE_2026-04-15.md`).
- [x] **SOLO-T03** automated regression (list filters): `lib/crm/tasks-list-where.ts` + `lib/crm/__tests__/tasks-list-where.test.ts` (`npm run test:crm:tasks-filters`).
- [ ] **SOLO-T03** remaining: run signed-in QA runbook + complete Product one-pager after UAT.
- [x] **Browser runtime (optional)**: condensed script `docs/CRM_GA_BROWSER_RUNTIME_QA_SCRIPT_2026-04-16.md` (full steps still in `docs/CRM_GA_SOLO_T02_RUNTIME_TEST_STEPS.md`).
- [ ] **Browser runtime**: execute Mode A/B per script and attach screenshots if audit requires them.
- [x] **Authenticated speed baseline (tooling)**: `scripts/crm-auth-speed-sample.mjs` + runbook section in `docs/CRM_SPEED_BASELINE_RUNBOOK.md` — run script with real token, then add a **new** speed log row (still required for regression %).
- [ ] **Authenticated speed baseline (data)**: paste measured p95 into Speed evidence log when you have `AUTH_TOKEN` + tenant.
- [x] **Stub/mock sweep (Day 2 QA/Product artifacts)**: runbooks `docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md` + `docs/CRM_GA_DAY2_PRODUCT_PARITY_ONEPAGER.md` linked from checklist; execution/signoff still open.
- [x] **Prioritized execution queue** for what to run next (P0–P3): `docs/CRM_GA_NEXT_ACTIONS_QUEUE.md`.

### Current status snapshot (today)

- [x] Execution docs are prepared (master index, 11-ticket pack, Jira copy pack, runbooks, templates).
- [x] Speed guardrails are defined in Go/No-Go and PR protocol sections.
- [x] Owner names are filled in the 11-ticket pack.
- [x] Jira/Linear ticket IDs (T01-T11) are created and mapped.
- [x] First speed evidence row filled for 2026-04-15 (smoke / 401 path — see speed log + runtime evidence doc).
- [x] Authenticated representative p95 baseline captured per runbook (regression-capable row). Evidence: `docs/evidence/closure/2026-04-17T02-41-31-970Z-crm-auth-baseline-run.md`.
- [x] Ticket 01 is completed with scope/risk artifact.
- [x] Ticket 02 (SOLO-T02) is **Done** (closed 2026-04-15); sweep plan + runtime evidence on file.
- [x] Ticket 02 discovery findings are documented (`docs/CRM_GA_STUB_MOCK_SWEEP_FINDINGS_DAY1.md`).
- [x] Auto demo-seeding is gated behind explicit opt-in flag in CRM Home/Deals (GA-safe default).
- [x] Manual demo-seed and diagnosis actions are gated off by default in Deals GA views.
- [x] API-level demo tenant fallback is gated behind explicit opt-in in contacts/deals core routes.
- [x] **SOLO-T02 closed** (2026-04-15) — verification checklist complete; follow-ups in "Recommended next steps after SOLO-T02".
- [x] SOLO-T02 runtime test steps are documented (`docs/CRM_GA_SOLO_T02_RUNTIME_TEST_STEPS.md`).
- [x] SOLO-T02 verification checklist created (`docs/CRM_GA_SOLO_T02_VERIFICATION_CHECKLIST.md`).
- [x] **SOLO-T03** in progress — engineering + list-filter Jest tests + QA/Product templates (`docs/CRM_GA_SOLO_T03_DELIVERY_NOTE_2026-04-15.md`, `docs/CRM_GA_SOLO_T03_QA_RUNBOOK.md`, `docs/CRM_GA_SOLO_T03_PRODUCT_UAT_ONEPAGER.md`); signed-in execution + Product signoff still open.
- [x] **Day 2 follow-ups (artifacts)** — post-gating QA + Product parity one-pagers (`docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md`, `docs/CRM_GA_DAY2_PRODUCT_PARITY_ONEPAGER.md`); signed-in QA + Product approval still open.
- [x] **SOLO-T04** — discovery map + PATCH duplicate parity (email/phone) + merge guard/POST hardening + merge-key + merge-guard Jest + QA runbook + support error map (2026-04-15); Ticket 04 **In Progress** until signed-in QA + Product signoff.
- [x] **SOLO-T05** — RBAC/audit coverage map + role-matrix QA runbook + role gates for bulk/delete/export/mass-transfer + scoring/settings writes (`lib/crm/rbac.ts` and scoped API routes); remaining Day 5 settings surface + QA execution still open.
- [x] **SOLO-T06 prep** — perf/scale map + perf QA runbook published (`docs/CRM_GA_SOLO_T06_PREP_PERF_SCALE.md`, `docs/CRM_GA_SOLO_T06_PERF_QA_RUNBOOK.md`); Day 6 execution rows still open.
- [x] **SOLO-T07 prep** — CI quality-gate map + execution runbook published (`docs/CRM_GA_SOLO_T07_PREP_CI_QUALITY.md`, `docs/CRM_GA_SOLO_T07_CI_GATE_RUNBOOK.md`); Day 7 execution rows still open.
- [x] **SOLO-T08 prep** — UX/error-state + support SOP prep map and runbook published (`docs/CRM_GA_SOLO_T08_PREP_UX_SUPPORT.md`, `docs/CRM_GA_SOLO_T08_SUPPORT_SOP_RUNBOOK.md`); Day 8 execution rows still open.
- [x] **SOLO-T09 prep** — commercial/demo prep map + runbook published (`docs/CRM_GA_SOLO_T09_PREP_COMMERCIAL_DEMO.md`, `docs/CRM_GA_SOLO_T09_COMMERCIAL_DEMO_RUNBOOK.md`); Day 9 execution rows still open.
- [x] **SOLO-T10 prep** — rehearsal/go-no-go prep map + runbook published (`docs/CRM_GA_SOLO_T10_PREP_REHEARSAL_GO_NO_GO.md`, `docs/CRM_GA_SOLO_T10_REHEARSAL_GO_NO_GO_RUNBOOK.md`); Day 10 execution rows still open.
- [x] **SOLO-T11 prep** — launch decision/risk-signoff prep map + runbook published (`docs/CRM_GA_SOLO_T11_PREP_DECISION_RISK_SIGNOFF.md`, `docs/CRM_GA_SOLO_T11_DECISION_RECORD_RUNBOOK.md`); final evidence consolidation/signoffs still open.
- [x] **CRM inbound pilot handoff closeout** — docs handoff PR `#1` (`crm: close inbound pilot gate with hosted/local evidence`) merged to `main` on 2026-04-20; branch `docs/inbound-pilot-pr-handoff` deleted. Canonical pilot bundle remains `docs/evidence/pilot/2026-04-20-inbound-pilot-evidence-index.md`.

### Solo next steps (recommended now)

- [x] Fill all owner fields with your name in `docs/CRM_CORE_GA_11_TICKET_PACK.md`.
- [x] Create tickets T01-T11 for your own tracking (Jira/Linear or personal board).
- [x] Fill today's speed evidence row (smoke) and move `SOLO-T02` to `Done` (closed 2026-04-15).
- [ ] Complete remaining items under **Recommended next steps after SOLO-T02** (follow `docs/CRM_GA_NEXT_ACTIONS_QUEUE.md` P0→P1 first; then optional browser + Day 4).

### Day-0 kickoff batch (execute in order, today)

- [x] 1) Assign named owners and Launch DRI in `docs/CRM_CORE_GA_11_TICKET_PACK.md`.
- [x] 2) Create all 11 tickets using `docs/CRM_CORE_GA_JIRA_COPY_PACK.md`.
- [x] 3) Backfill ticket IDs into the 11-ticket pack.
- [x] 4) Capture current speed snapshot and fill first row in Speed evidence log (2026-04-15 smoke row logged).
- [x] 4b) Capture **authenticated** p50/p95/p99 baseline per `docs/CRM_SPEED_BASELINE_RUNBOOK.md` (enables regression % on future rows). Evidence: `docs/evidence/closure/2026-04-17T02-41-31-970Z-crm-auth-baseline-run.md`.
- [x] 5) Start Ticket 01 immediately; schedule Ticket 02 kickoff right after scope freeze.

### PR speed protection protocol (effective immediately)

- [ ] Every CRM Core PR must include a speed note: `No impact` or measured p95 delta.
- [ ] Every PR touching Contacts/Deals/Tasks APIs must attach before/after evidence link.
- [ ] Any p95 regression > 10% requires rollback or explicit mitigation before merge.
- [ ] No exception for release-week merges unless Launch DRI signs a temporary waiver.

### Execution artifacts

- [x] Start from `docs/CRM_GA_MASTER_LAUNCH_INDEX.md` for the full Day-0 to post-launch flow.
- [x] Create and maintain `docs/CRM_CORE_GA_11_TICKET_PACK.md` as the single owner/task tracker.
- [x] Link each real Jira/Linear ticket to the matching entry in the 11-ticket pack.
- [ ] Update ticket status at end of every working day (including speed deltas and blockers).
- [x] Use `docs/CRM_CORE_GA_JIRA_COPY_PACK.md` to create all 11 execution tickets consistently.
- [x] Use `docs/CRM_GA_SCOPE_FREEZE_AND_RISKS.md` as the scope freeze and risk reference for SOLO-T01.
- [x] Use `docs/CRM_GA_STUB_MOCK_SWEEP_PLAN.md` as the active execution plan for SOLO-T02.
- [x] Use `docs/CRM_GA_STUB_MOCK_SWEEP_FINDINGS_DAY1.md` as Day-1 evidence for stub/mock sweep progress.
- [x] Use `docs/CRM_GA_SOLO_T02_VERIFICATION_CHECKLIST.md` to close SOLO-T02 with runtime and speed evidence.
- [x] Use `docs/CRM_GA_SOLO_T02_RUNTIME_TEST_STEPS.md` to execute Mode A/Mode B runtime validation.
- [x] Use `docs/CRM_GA_SOLO_T03_DELIVERY_NOTE_2026-04-15.md` as the SOLO-T03 engineering evidence log (tasks API + UI increment).
- [x] Use `docs/CRM_GA_SOLO_T03_QA_RUNBOOK.md` for signed-in CRM Tasks QA.
- [x] Use `docs/CRM_GA_SOLO_T03_PRODUCT_UAT_ONEPAGER.md` for Product UAT signoff on task lifecycle.
- [x] Use `docs/CRM_GA_BROWSER_RUNTIME_QA_SCRIPT_2026-04-16.md` as a short Mode A/B browser checklist (optional hardening).
- [x] Use `docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md` for Day 2 post-gating QA (Home, Deals, Contacts).
- [x] Use `docs/CRM_GA_DAY2_PRODUCT_PARITY_ONEPAGER.md` for Day 2 Product parity signoff after QA.
- [x] Use `scripts/crm-auth-speed-sample.mjs` for a quick authenticated list-API p50/p95 sample (see `docs/CRM_SPEED_BASELINE_RUNBOOK.md`).
- [x] Use `docs/CRM_GA_NEXT_ACTIONS_QUEUE.md` as the prioritized P0–P3 execution queue between checklist updates.
- [x] Use `docs/CRM_GA_SOLO_T04_PREP_DISCOVERY.md` for Day 4 / SOLO-T04 duplicate-merge discovery before implementation.
- [x] Use `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md` for Day 4 duplicate/merge API QA.
- [x] Use `docs/CRM_GA_SOLO_T04_SUPPORT_MERGE_ERRORS.md` for Day 4 support-facing merge/duplicate troubleshooting.
- [x] Use `docs/CRM_GA_SOLO_T05_PREP_RBAC_AUDIT.md` for Day 5 RBAC/audit implementation map.
- [x] Use `docs/CRM_GA_SOLO_T05_ROLE_MATRIX_RUNBOOK.md` for Day 5 role matrix QA.
- [x] Use `docs/CRM_GA_SOLO_T05_AUDIT_VERIFICATION_RUNBOOK.md` for Day 5 audit evidence checks.
- [x] Use `docs/CRM_GA_SOLO_T06_PREP_PERF_SCALE.md` for Day 6 perf/scale execution planning.
- [x] Use `docs/CRM_GA_SOLO_T06_PERF_QA_RUNBOOK.md` for Day 6 perf QA evidence capture.
- [x] Use `docs/CRM_GA_SOLO_T07_PREP_CI_QUALITY.md` for Day 7 CI quality-gate implementation planning.
- [x] Use `docs/CRM_GA_SOLO_T07_CI_GATE_RUNBOOK.md` for Day 7 CI gate evidence capture.
- [x] Use `docs/CRM_GA_SOLO_T08_PREP_UX_SUPPORT.md` for Day 8 UX/error-state and support SOP planning.
- [x] Use `docs/CRM_GA_SOLO_T08_SUPPORT_SOP_RUNBOOK.md` for Day 8 UX/support evidence capture.
- [x] Use `docs/CRM_GA_SOLO_T09_PREP_COMMERCIAL_DEMO.md` for Day 9 commercial/demo planning.
- [x] Use `docs/CRM_GA_SOLO_T09_COMMERCIAL_DEMO_RUNBOOK.md` for Day 9 commercial/demo evidence capture.
- [x] Use `docs/CRM_GA_SOLO_T10_PREP_REHEARSAL_GO_NO_GO.md` for Day 10 rehearsal/go-no-go planning.
- [x] Use `docs/CRM_GA_SOLO_T10_REHEARSAL_GO_NO_GO_RUNBOOK.md` for Day 10 rehearsal/go-no-go evidence capture.
- [x] Use `docs/CRM_GA_SOLO_T11_PREP_DECISION_RISK_SIGNOFF.md` for launch decision/risk-signoff planning.
- [x] Use `docs/CRM_GA_SOLO_T11_DECISION_RECORD_RUNBOOK.md` for final decision record and signoff evidence.
- [x] Use `docs/CANONICAL_MODULE_API_CUTOVER_RUNBOOK.md` for `CANONICAL_MODULE_API_ONLY` rollout, verification, and rollback.
- [x] Use `docs/CANONICAL_MODULE_API_CUTOVER_EXECUTION_WORKSHEET.md` to execute staging validation, capture production approval fields, and track 24h post-enable monitoring.
- [x] Use `docs/CANONICAL_MODULE_API_STAGING_RUNTIME_EVIDENCE_SHEET.md` to capture API-by-API staging runtime expected vs actual contract results in one pass.
- [x] Optionally run `npm run check:canonical-staging-runtime` as a pre-pass for staging endpoint contract validation (requires staging base URL + auth token env vars).
- [x] Use `docs/CANONICAL_STAGING_ENV_TEMPLATE.md` and `npm run run:canonical-staging-evidence-pipeline` for one-command staging check + evidence autofill.
- [x] Use `npm run get:canonical-staging-token` (with login env vars) when a staging bearer token is not readily available.
- [x] Use `docs/CANONICAL_MODULE_API_CONSUMER_READINESS_CHECKLIST.md` to confirm each consumer surface is canonical-ready before flag enablement.
- [x] Run `npm run check:canonical-module-api-contract` to generate canonical API contract evidence artifacts in `docs/evidence/closure/` before and after flag cutover.
- [x] Run `npm run check:canonical-module-api-post-cutover` to fail fast if legacy fields leak outside `includeLegacy` guarded response blocks.
- [x] Run `npm run check:canonical-module-api-response-snapshots` to capture legacy vs canonical-only response snapshots as explicit evidence artifacts.
- [x] Run `npm run check:canonical-module-api-consumer-usage` to assert frontend consumers avoid legacy fields and reference canonical response fields.
- [x] Run `npm run check:canonical-module-api-readiness-verdict` for one consolidated readiness verdict artifact (contract + post-cutover guard + checklist state).
- [x] Run `npm run release:gate:canonical-contract` (or default `release:gate:smoke`, which now includes it) to enforce canonical contract checks in release-gate automation.
- [x] Run `npm run release:gate:canonical-post-cutover` (or default `release:gate:smoke`) to enforce post-cutover leakage guard in release automation.
- [x] Run `npm run release:gate:canonical-readiness-verdict` for release-gate-level consolidated readiness enforcement.
- [x] Use `docs/CRM_SPEED_BASELINE_RUNBOOK.md` for repeatable daily speed evidence capture.
- [x] Use `docs/CRM_GA_DAILY_STANDUP_TEMPLATE.md` for 15-minute daily execution and speed sync.
- [x] Use `docs/CRM_GA_WEEKLY_REVIEW_TEMPLATE.md` for Week 1 closeout and final readiness review.
- [x] Use `docs/CRM_GA_GO_NO_GO_MEMO_TEMPLATE.md` to record the final Day-10 release decision.
- [x] Use `docs/CRM_GA_LAUNCH_DAY_RUN_SEQUENCE.md` for minute-by-minute launch execution and rollback control.
- [x] Use `docs/CRM_GA_POST_LAUNCH_24H_REVIEW_TEMPLATE.md` for first-day stability, speed, and KPI review.

---

## ✅ Pre-Launch Checklist

### Code & Infrastructure

- [x] All Phase 1-6 features implemented
- [x] Database migrations tested
- [x] API endpoints documented
- [x] Error handling implemented
- [x] Logging and monitoring setup
- [ ] Load testing completed (1000+ contacts, 500+ deals)
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Supabase Security Advisor clean (`no ERROR/WARNING/INFO`)
- [ ] Supabase hardening verification SQL executed and archived
- [ ] Supabase security evidence archived at `docs/evidence/security/supabase/YYYY-MM-DD/`
- [ ] GDPR compliance verified
- [ ] Database backups configured
- [ ] Monitoring and alerts setup
- [ ] Error tracking configured (Sentry/Bugsnag)

### Testing

- [ ] Unit tests written (target: 80% coverage)
- [ ] Integration tests completed
- [ ] E2E tests for critical flows
- [ ] Mobile app tested on iOS and Android
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance testing (response times < 200ms)
- [ ] Security testing (penetration testing)
- [ ] User acceptance testing (UAT) with beta users

### Documentation

- [x] User guide created
- [x] API documentation created
- [ ] Video tutorials recorded
- [ ] Help center articles published
- [ ] Onboarding flow documented
- [ ] Feature release notes prepared

### Product Readiness

- [ ] Onboarding flow tested
- [ ] Feature discovery (tooltips, tours) implemented
- [ ] Help center articles published
- [ ] Video tutorials created
- [ ] Email onboarding sequence configured
- [ ] In-app help system working

### Marketing Readiness

- [ ] Feature announcement blog post written
- [ ] Product demo video created
- [ ] Case studies prepared (if available)
- [ ] Press release drafted (if applicable)
- [ ] Social media campaign planned
- [ ] Email campaign to existing users prepared

### Sales Readiness

- [ ] Sales team trained on new features
- [ ] Sales materials updated
- [ ] Pricing finalized
- [ ] Demo environment ready
- [ ] Customer success playbook created
- [ ] FAQ document prepared

### Legal & Compliance

- [ ] Terms of Service updated
- [ ] Privacy Policy updated
- [ ] GDPR compliance verified
- [ ] Data processing agreements signed
- [ ] Security certifications obtained (if required)

### Operations

- [ ] Customer support team trained
- [ ] Support ticket system configured
- [ ] Knowledge base populated
- [ ] Escalation procedures defined
- [ ] Incident response plan ready

---

## 🚀 Launch Day Checklist

### Morning (Pre-Launch)

- [ ] Final code review
- [ ] Database backup created
- [ ] Monitoring dashboards checked
- [ ] Support team briefed
- [ ] Marketing team ready

### Launch

- [ ] Deploy to production
- [ ] Verify all services running
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Check performance metrics

### Post-Launch (First 24 Hours)

- [ ] Monitor user signups
- [ ] Track feature adoption
- [ ] Respond to support tickets
- [ ] Monitor error logs
- [ ] Check system performance
- [ ] Collect user feedback

---

## 📊 Success Metrics

### Week 1 Targets

- [ ] 50+ new user signups
- [ ] 80%+ email sync adoption
- [ ] < 2% error rate
- [ ] < 200ms average API response time
- [ ] 90%+ user satisfaction score

### Month 1 Targets

- [ ] 200+ active users
- [ ] 85%+ email sync adoption
- [ ] 75%+ lead scoring accuracy
- [ ] 65%+ forecast accuracy
- [ ] 95%+ uptime

---

## 🆘 Rollback Plan

If critical issues arise:

1. **Immediate Actions:**
   - [ ] Notify team via Slack/email
   - [ ] Post status update
   - [ ] Enable maintenance mode if needed

2. **Rollback Steps:**
   - [ ] Revert to previous deployment
   - [ ] Restore database backup if needed
   - [ ] Verify system stability

3. **Communication:**
   - [ ] Update status page
   - [ ] Notify affected users
   - [ ] Post-mortem after resolution

---

## 📝 Post-Launch Tasks

### Week 1

- [ ] Review user feedback
- [ ] Fix critical bugs
- [ ] Optimize performance bottlenecks
- [ ] Update documentation based on feedback

### Month 1

- [ ] Analyze usage metrics
- [ ] Identify feature gaps
- [ ] Plan next iteration
- [ ] Celebrate success! 🎉

---

**Last Updated:** April 2026  
**Next Review:** [Date]

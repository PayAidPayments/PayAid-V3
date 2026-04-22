# PayAid V3 Module Feature Go/No-Go Checkpoints (2026-04-17)

Scope: strict readiness checkpoints aligned to internal specialist logic in `AGENTS.md` (`Product Strategist`, `Platform Architect`, `CRM Specialist`, `Marketing Specialist`, `Finance and GST Specialist`, `Workflow Automation Specialist`, `UX Cleanup Specialist`, `Speed Auditor`, `No-404 QA Specialist`, `Code Review Specialist`).

## Current gate table

| Area | Primary specialist gate | Status | Evidence | Clear command(s) for No-Go |
|---|---|---|---|---|
| CRM Queue #13 unit confirmation | CRM Specialist + Code Review Specialist | GO | `docs/evidence/closure/2026-04-17T02-24-28-340Z-crm-closure-blockers.md` | N/A |
| CRM Queue #14 auth speed baseline | Speed Auditor + CRM Specialist | GO | `docs/evidence/closure/2026-04-17T02-41-31-970Z-crm-auth-baseline-run.md` | N/A |
| CRM Day 2-10 + SOLO-T11 execution | Product Strategist + Platform Architect | NO-GO (GA product) | `docs/LAUNCH_CHECKLIST.md`, `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` — queue items `1`–`12` still **Pending**. **Does not block engineering deploy** — see `docs/DEPLOY_READINESS_2026-04-18.md`. | Run queue in order; update both docs after each completion |
| Engineering deploy readiness | Platform Architect + Code Review Specialist | GO | `docs/DEPLOY_READINESS_2026-04-18.md` — typecheck, lint, M2/M3 smoke, **79/79** route-health, local auth baseline; explicit **speed SLO** + **GA manual queue** exceptions documented | Merge via normal CI/CD; keep post-deploy hosted re-baseline on file |
| Route health release gate | No-404 QA Specialist | GO | **2026-04-18 proof:** `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` + `PLAYWRIGHT_NO_WEB_SERVER=1` + `npm run test:e2e:route-health:serial` → **`79 passed`**, exit `0`, ~55m wall time (single existing `npm run dev -w dashboard`). **Recipe for reruns:** terminal A: dev server + `GET /api/auth/login` 200; terminal B: same env + serial command (avoids a second `next dev`). | Re-run the same command after fixes; all routes must stay non-404/non-500 with no error overlay |
| M3 smoke gate | Code Review Specialist | GO | `npm run test:m3:smoke` completed green (12 suites, 106 tests) | N/A |
| M2 smoke gate | Code Review Specialist | GO | `jest.m2.smoke.config.js` now sets `forceExit: true`; `npm run test:m2:smoke` exits `0` (46 suites passed, 1 skipped) | N/A |
| Dashboard typecheck gate | Platform Architect + Code Review Specialist | GO | Fixed `apps/dashboard/app/api/notifications/route.ts` partial `employee` select typing; `npm run typecheck:dashboard` exits `0` | N/A |
| Lint gate (dashboard) | Code Review Specialist + UX Cleanup Specialist | GO (warnings only) | `npm run lint -w dashboard` exits `0` (29 `react-hooks/exhaustive-deps` warnings, 0 errors) | N/A |
| CRM speed guardrail (`p95 <= 300ms` at target load) | Speed Auditor | NO-GO (strict SLO) / **CONDITIONAL for deploy** | **Hosted latest 2026-04-19** (`payaid-v3.vercel.app`, warmup 3, `n=25`): contacts `2233`, deals `2189`, tasks `1894` (`docs/evidence/closure/2026-04-19T14-52-28-898Z-crm-auth-baseline-run.md`, all endpoints `200`). **Hosted 2026-04-18**: contacts `3218`, deals `2523`, tasks `3787` (`docs/evidence/closure/2026-04-18T14-16-16-086Z-crm-auth-baseline-run.md` — deals/tasks use `stats=false` in sampler). **Earlier hosted sample:** contacts `3169`, deals `3411`, tasks `3376` (`docs/evidence/closure/2026-04-17T06-10-14-447Z-crm-auth-baseline-run.md`). **Local 2026-04-18:** contacts `636`, deals `725`, tasks `1421` (`docs/evidence/closure/2026-04-18T10-08-44-035Z-crm-auth-baseline-run.md`). **Strict GA SLO:** remain NO-GO until hosted p95 meets bar or SLO is formally changed. **Deploy:** exception in `docs/DEPLOY_READINESS_2026-04-18.md`. | Re-baseline after each perf PR; `CRM_AUTH_WARMUP_ROUNDS=3 CRM_AUTH_SAMPLE_COUNT=25 npm run collect:crm-auth-baseline` on **target** |
| Marketing/Finance/HR module launch readiness | Marketing Specialist + Finance and GST Specialist + Workflow Automation Specialist | GO (No-404 / route matrix) | **2026-04-18:** all Marketing, Finance, and HR routes in `tests/fixtures/all-routes.ts` exercised in serial route-health **`79 passed`** (see Route health row). **Not a substitute** for full module UAT runbooks — track deeper signoffs in launch docs as needed. | Re-run `npm run test:e2e:route-health:serial` after route changes; add UAT evidence when runbooks are executed |
| **CRM inbound pilot** (idempotency store + routing decision + orchestration smoke) | CRM Specialist + Code Review Specialist | **GO (engineering)** | **2026-04-19:** schema `20260420150000_inbound_pilot_loop`; `npm run verify:inbound-pilot-smoke` + `npm run smoke:inbound-pilot` (hosted `.env`) or `npm run smoke:inbound-pilot:local -- --tenant=<Tenant.id|slug|subdomain>` (after `npx prisma db seed`, **`demo`** resolves via `subdomain`; Docker `127.0.0.1:5433`, clears `DATABASE_DIRECT_URL`; commands in `docs/evidence/pilot/RUNBOOK.md`); demo seeds include **`TenantMember`** (`prisma/seed.ts`, `prisma/seeds/seed-admin-users.ts`). **2026-04-20 (code):** pilot release-gate blockers — `GET /api/crm/inbound-routing/decisions` param validation; module switcher license filter (`components/ModuleSwitcher.tsx`, `components/modules/ModuleSwitcher.tsx`, `components/Navigation/ModuleSwitcher.tsx`); `skipPilotLoopArtifacts` decoupled from `skipExecutionLogWrite` + bulk routes set `skipPilotLoopArtifacts`; `pilot-post-persist` task-isolate + decision retry; `scripts/smoke-inbound-pilot-integration.ts` asserts replay leaves decision / idempotency / **orchestration log** / **task** counts unchanged; evidence templates under `docs/evidence/pilot/`. **Internal pilot GO:** local dated artifacts (`2026-04-20-inbound-smoke-local.md`, `2026-04-20-inbound-db-verify-local.md`, `2026-04-20-inbound-ui-qa.md`); M2 route tests for **decisions GET**, **orchestration logs GET**, **lead-routing GET** (`pilotInbound`), plus **module license filter** unit tests (see `docs/evidence/pilot/RUNBOOK.md` §3). **Hosted pass:** `2026-04-20-inbound-smoke-hosted.md` + `2026-04-20-inbound-db-verify-hosted.md` (tenant `sample`). **Canonical bundle:** `docs/evidence/pilot/2026-04-20-inbound-pilot-evidence-index.md`. **Not** GA queue Day 2–10 or hosted p95 marketing claim. | After DB changes: `prisma migrate deploy` + `prisma generate`; if local volume was `db push`‑only, use `npm run db:local:baseline-migrations` once then `db:migrate:deploy:local` |
| **Demo day** (stakeholder / commercial walkthrough) | Product Strategist + No-404 QA Specialist + CRM Specialist | **GO** | Same **engineering + No-404** evidence as deploy readiness; Day 2 signed-in smoke now includes **Home → Deals → AllPeople → CPQ** (`tests/e2e/crm-day2-qa-postgating.spec.ts`, `docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md`). **Out of scope for this gate:** full GA queue (Day 2–10 manual rows, SOLO-T11) and strict hosted **p95 ≤ 300ms** product claim — see **Demo Day GO** below. | Abort to dry-run or recorded video if target URL returns new **404/500** or auth regression; re-run route-health after material route changes |

## Summary

- Cleared in this cycle: CRM queue #13 and queue #14 blockers, dashboard typecheck, dashboard lint (0 errors), M2 smoke clean exit, route-health dev stability (chromium-only + transient 500 retry), CRM auth baseline warmup option, **full serial route-health proof (`79 passed`, 2026-04-18)**, **engineering deploy readiness** (`docs/DEPLOY_READINESS_2026-04-18.md`), **Marketing/Finance/HR No-404 matrix** via the same route-health run, **CRM inbound pilot engineering gate** (verify + smoke scripts + migration + seed `TenantMember` — see gate table row).
- Still blocking **strict CRM Core GA product** signoff: hosted list API p95 vs `300ms` guardrail, plus Day 2–10 / SOLO-T11 manual execution evidence — see `docs/LAUNCH_CHECKLIST.md`. **Governance:** if Product chooses to revise the speed bar instead of meeting the legacy 300ms claim, follow **§C** below and SOLO-T11 before any external copy changes.

---

## Demo Day GO (commercial / stakeholder demo) — **2026-04-18**

**Decision:** **GO** to run an external or internal **PayAid V3 demo** on the current engineering baseline (dashboard on `main`, per `docs/DEPLOY_READINESS_2026-04-18.md`).

**What this GO means**

- **In scope:** Show CRM shell, **Home**, **Deals**, **Contacts / AllPeople**, **CPQ** (workspace + optional seed quotes), and cross-module surfaces already covered by the **79-route** matrix — backed by automated **route-health**, **M2/M3 smoke**, **typecheck**, and **lint** gates documented above.
- **Not in scope for this GO:** Announcing **CRM Core GA** or a **strict p95 ≤ 300ms** product commitment. Those remain on the **GA product** row and **CRM speed guardrail** row until checklist + evidence close (`docs/LAUNCH_CHECKLIST.md`, hosted re-baseline or formal SLO change).

**Why demo day is GO while GA product is still NO-GO**

- Deploy readiness explicitly separates **engineering deploy** from **GA marketing** (`docs/DEPLOY_READINESS_2026-04-18.md`). Demo day aligns with **engineering + No-404** readiness, not the full manual closure queue.
- Presenters should verbalize: *“This is a live product demo on our current build; GA checklist and performance SLO signoff are tracked separately.”*

**Pre-flight (same day, ~30–60 min)**

1. Confirm **target URL** (staging or prod) loads `/login` and `/crm/{tenant}/Home` with your demo tenant and credentials.
2. Optional: `npm run test:e2e:crm-day2-qa` against a dev server (`PLAYWRIGHT_BASE_URL`) before travel — covers **Home, Deals, AllPeople, CPQ** in one signed-in flow.
3. CPQ path: if the story needs quotes, use **Seed demo quotes** on CPQ or pre-seeded tenant data; otherwise empty state is acceptable for “guided CPQ” narrative.
4. Have a **fallback** (screen recording or second tab with local dev) if the venue network blocks the host.

**Sign-off line for slides or email**

> **Demo day:** **GO** (2026-04-18) — Engineering, No-404 matrix, and core CRM smoke (including CPQ) align with deploy readiness. **CRM Core GA** and strict list **p95** marketing claims remain **pending** per launch checklist until explicitly closed.

## Next actions (to clear the two remaining NO-GO rows)

### A) **CRM Day 2–10 + SOLO-T11** (GA product — mostly manual)

Work **in order**; after each step, update `docs/LAUNCH_CHECKLIST.md` (Remaining closure queue + Day sections), `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` (live table), and optionally `docs/CRM_GA_NEXT_ACTIONS_QUEUE.md`.

| Step | What to do | “Done” looks like |
|------|------------|-------------------|
| **1** | Signed-in browser: run `docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md` (automation: `npm run test:e2e:crm-day2-qa` includes **CPQ**) | Pass/Fail recorded; Day 2 QA checkbox checked |
| **2** | Product: `docs/CRM_GA_DAY2_PRODUCT_PARITY_ONEPAGER.md` | Signoff + Day 2 Product row checked |
| **3–4** | Tasks: `docs/CRM_GA_SOLO_T03_QA_RUNBOOK.md` + UAT one-pager (**2026-04-20:** full manual retest pass; decision approved) | Day 3 QA + Product rows checked |
| **5** | Merge/duplicate: `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md` + Product merge UX (**automation pass:** `docs/evidence/closure/2026-04-20T22-15-00-000Z-crm-day4-merge-guard-tests.md`) | Day 4 **partial** (manual API + Product signoff pending) |
| **6** | RBAC/audit: role matrix + audit verification runbooks | Day 5 closed |
| **7–11** | Perf, CI, UX/SOP, demo, rehearsal runbooks + evidence tables | Days 6–10 rows closed |
| **12** | `docs/CRM_GA_SOLO_T11_DECISION_RECORD_RUNBOOK.md` | Final Go/No-Go recorded |

**How I can help in Cursor:** walk through runbooks step-by-step, fix any **bugs you hit**, add **small Playwright or API checks** if a step keeps failing, and keep docs in sync with your results — I cannot replace your signed-in UAT or Product signoff.

### B) **CRM speed guardrail (hosted p95 ≤ 300ms)** (engineering + measurement)

| Step | What to do | “Done” looks like |
|------|------------|-------------------|
| **1** | Deploy latest `main` to your **GA target** host | Production/staging URL stable |
| **2** | Re-baseline: `CRM_AUTH_WARMUP_ROUNDS=3 CRM_AUTH_SAMPLE_COUNT=25` + `BASE_URL=<target>` + valid `CRM_LOGIN_*` → `npm run collect:crm-auth-baseline` | New artifact under `docs/evidence/closure/`; p95 row updated in `docs/LAUNCH_CHECKLIST.md` speed table |
| **3** | If still above 300ms: profile `/api/contacts`, `/api/deals`, `/api/tasks` (DB plans, N+1, cache hit rate, region latency) | PRs with query/index/cache changes; repeat step 2 until met **or** Product documents an **SLO change** — **2026-04-19:** shipped shared CRM tenant fast-path + `npm run typecheck:dashboard` green (unblocks CI); measure impact via step **2** after deploy |

**How I can help in Cursor:** implement **list-route optimizations** (you already have deals `stats=false`, task list caching, etc.), suggest **indexes** from Prisma/schema, and tighten the sampler or runbooks — the **300ms** bar may still be dominated by **network/DB region**; if so, only **infra + SLO decision** fully “fix” the row.

### C) **Formal SLO / GA messaging change** (Product + Speed + Launch DRI)

Use this when hosted list APIs remain above the historical **300ms p95** bar after reasonable perf work, and leadership chooses to **revise the guardrail or marketing claims** instead of blocking release.

| Step | Owner | Action | “Done” looks like |
|------|-------|--------|-------------------|
| **1** | Speed / Eng | Latest **credentialed** `collect:crm-auth-baseline` artifact on the **GA target host** (same env customers use) | `docs/evidence/closure/*-crm-auth-baseline-run.md` linked with date, `BASE_URL`, warmup `n`, sample count |
| **2** | Product | Draft **amended SLO** (e.g. new p95 target, cold-start exclusion, or “enterprise list” tier) **or** explicit **non-claim** (“we do not advertise p95 for list APIs”) | One paragraph + numeric target if any; no contradictions with website/sales decks |
| **3** | Launch DRI | Record decision in **SOLO-T11** evidence table (`docs/CRM_GA_SOLO_T11_DECISION_RECORD_RUNBOOK.md` → Performance/reliability row) + `docs/LAUNCH_CHECKLIST.md` speed evidence table | Approver names/dates; link to step 1 artifact |
| **4** | GTM / Product | Update external copy **only** after step 3 | Slides, pricing, and security sheets match the amended claim |

**Marketing guardrails (until step 3 is complete)**

- Do **not** state **“p95 ≤ 300ms”** (or similar) for CRM list APIs on hosted evidence that exceeds the bar.
- Safe language: *“Performance is continuously measured on production-like hosts; see internal release evidence.”*

**After step 3**

- Update this file’s **CRM speed guardrail** row to **GO (revised SLO)** or **CONDITIONAL** with the new definition and evidence links.
- Re-run `npm run collect:crm-auth-baseline` whenever list routes, DB region, or serverless config change materially.


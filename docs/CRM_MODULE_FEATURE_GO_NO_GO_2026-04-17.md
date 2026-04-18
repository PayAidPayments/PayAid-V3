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
| CRM speed guardrail (`p95 <= 300ms` at target load) | Speed Auditor | NO-GO (strict SLO) / **CONDITIONAL for deploy** | **Hosted 2026-04-18** (`payaid-v3.vercel.app`, warmup 3, `n=15`): contacts `3218`, deals `2523`, tasks `3787` (`docs/evidence/closure/2026-04-18T14-16-16-086Z-crm-auth-baseline-run.md` — deals/tasks use `stats=false` in sampler). **Earlier hosted sample:** contacts `3169`, deals `3411`, tasks `3376` (`docs/evidence/closure/2026-04-17T06-10-14-447Z-crm-auth-baseline-run.md`). **Local 2026-04-18:** contacts `636`, deals `725`, tasks `1421` (`docs/evidence/closure/2026-04-18T10-08-44-035Z-crm-auth-baseline-run.md`). **Strict GA SLO:** remain NO-GO until hosted p95 meets bar or SLO is formally changed. **Deploy:** exception in `docs/DEPLOY_READINESS_2026-04-18.md`. | Re-baseline after each perf PR; `CRM_AUTH_WARMUP_ROUNDS=3 CRM_AUTH_SAMPLE_COUNT=25 npm run collect:crm-auth-baseline` on **target** |
| Marketing/Finance/HR module launch readiness | Marketing Specialist + Finance and GST Specialist + Workflow Automation Specialist | GO (No-404 / route matrix) | **2026-04-18:** all Marketing, Finance, and HR routes in `tests/fixtures/all-routes.ts` exercised in serial route-health **`79 passed`** (see Route health row). **Not a substitute** for full module UAT runbooks — track deeper signoffs in launch docs as needed. | Re-run `npm run test:e2e:route-health:serial` after route changes; add UAT evidence when runbooks are executed |

## Summary

- Cleared in this cycle: CRM queue #13 and queue #14 blockers, dashboard typecheck, dashboard lint (0 errors), M2 smoke clean exit, route-health dev stability (chromium-only + transient 500 retry), CRM auth baseline warmup option, **full serial route-health proof (`79 passed`, 2026-04-18)**, **engineering deploy readiness** (`docs/DEPLOY_READINESS_2026-04-18.md`), **Marketing/Finance/HR No-404 matrix** via the same route-health run.
- Still blocking **strict CRM Core GA product** signoff: hosted list API p95 vs `300ms` guardrail, plus Day 2–10 / SOLO-T11 manual execution evidence — see `docs/LAUNCH_CHECKLIST.md`.

## Next actions (to clear the two remaining NO-GO rows)

### A) **CRM Day 2–10 + SOLO-T11** (GA product — mostly manual)

Work **in order**; after each step, update `docs/LAUNCH_CHECKLIST.md` (Remaining closure queue + Day sections), `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` (live table), and optionally `docs/CRM_GA_NEXT_ACTIONS_QUEUE.md`.

| Step | What to do | “Done” looks like |
|------|------------|-------------------|
| **1** | Signed-in browser: run `docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md` | Pass/Fail recorded; Day 2 QA checkbox checked |
| **2** | Product: `docs/CRM_GA_DAY2_PRODUCT_PARITY_ONEPAGER.md` | Signoff + Day 2 Product row checked |
| **3–4** | Tasks: `docs/CRM_GA_SOLO_T03_QA_RUNBOOK.md` + UAT one-pager | Day 3 QA + Product rows checked |
| **5** | Merge/duplicate: `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md` + Product merge UX | Day 4 closed |
| **6** | RBAC/audit: role matrix + audit verification runbooks | Day 5 closed |
| **7–11** | Perf, CI, UX/SOP, demo, rehearsal runbooks + evidence tables | Days 6–10 rows closed |
| **12** | `docs/CRM_GA_SOLO_T11_DECISION_RECORD_RUNBOOK.md` | Final Go/No-Go recorded |

**How I can help in Cursor:** walk through runbooks step-by-step, fix any **bugs you hit**, add **small Playwright or API checks** if a step keeps failing, and keep docs in sync with your results — I cannot replace your signed-in UAT or Product signoff.

### B) **CRM speed guardrail (hosted p95 ≤ 300ms)** (engineering + measurement)

| Step | What to do | “Done” looks like |
|------|------------|-------------------|
| **1** | Deploy latest `main` to your **GA target** host | Production/staging URL stable |
| **2** | Re-baseline: `CRM_AUTH_WARMUP_ROUNDS=3 CRM_AUTH_SAMPLE_COUNT=25` + `BASE_URL=<target>` + valid `CRM_LOGIN_*` → `npm run collect:crm-auth-baseline` | New artifact under `docs/evidence/closure/`; p95 row updated in `docs/LAUNCH_CHECKLIST.md` speed table |
| **3** | If still above 300ms: profile `/api/contacts`, `/api/deals`, `/api/tasks` (DB plans, N+1, cache hit rate, region latency) | PRs with query/index/cache changes; repeat step 2 until met **or** Product documents an **SLO change** |

**How I can help in Cursor:** implement **list-route optimizations** (you already have deals `stats=false`, task list caching, etc.), suggest **indexes** from Prisma/schema, and tighten the sampler or runbooks — the **300ms** bar may still be dominated by **network/DB region**; if so, only **infra + SLO decision** fully “fix” the row.

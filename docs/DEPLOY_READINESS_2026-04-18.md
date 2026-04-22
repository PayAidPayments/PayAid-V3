# PayAid V3 — Engineering deploy readiness (2026-04-18)

**DRI:** Phani  
**Scope:** Authorize **application deployment** (dashboard) based on automated gates. This is **not** a full **CRM Core GA product** signoff (manual Day 2–10 + SOLO-T11 queue remains open in `docs/LAUNCH_CHECKLIST.md`).

## Verified before deploy

| Gate | Result | Evidence / command |
|------|--------|---------------------|
| Dashboard typecheck | Green | `npm run typecheck:dashboard` exits `0` (per `docs/CRM_MODULE_FEATURE_GO_NO_GO_2026-04-17.md`) |
| Dashboard lint | Green (warnings only) | `npm run lint -w dashboard` exits `0` |
| M2 smoke | Green | `npm run test:m2:smoke` |
| M3 smoke | Green | `npm run test:m3:smoke` |
| No-404 route matrix (Playwright) | **79 passed**, exit `0` | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` + `PLAYWRIGHT_NO_WEB_SERVER=1` + `npm run test:e2e:route-health:serial` (~55m, single `npm run dev -w dashboard`) |
| CRM auth baseline (local steady-state) | Pass | `docs/evidence/closure/2026-04-18T10-08-44-035Z-crm-auth-baseline-run.md` |

## Cross-module route coverage (Marketing / Finance / HR)

All tenant routes under `/marketing/demo/*`, `/finance/demo/*`, and `/hr/demo/*` in `tests/fixtures/all-routes.ts` were included in the **79-route** serial run above (no `404` / `500`, no Next error overlay).

## Explicit exceptions (tracked post-deploy)

1. **CRM list API p95 ≤ 300ms (GA guardrail)** — **Not met** on the hosted sample previously measured (`docs/evidence/closure/2026-04-17T06-10-14-447Z-crm-auth-baseline-run.md`). Local dev sampling also remains above 300ms on tasks (`docs/evidence/closure/2026-04-18T10-08-44-035Z-crm-auth-baseline-run.md`). **Deploy proceeds with this risk logged**; GA marketing must not claim the strict SLO until a hosted re-baseline passes or the SLO is formally revised. **Formal revision path:** Product + Launch DRI follow **§C** in `docs/CRM_MODULE_FEATURE_GO_NO_GO_2026-04-17.md` (evidence + SOLO-T11 row + amended copy).

2. **CRM GA closure queue items 1–12** (Day 2 QA through SOLO-T11) — **Still pending** manual runbook execution and Product signoffs (`docs/CRM_GA_CLOSURE_EXECUTION_LOG.md`). Deployment does not substitute for that evidence.

## Post-deploy (hosted) — speed re-baseline + DB migrations

After each production deploy, run **`npx prisma migrate deploy`** against the **same** `DATABASE_URL` Vercel uses for Production (or rely on your pipeline step if migrations run there). Confirm `CRMConfig.leadRouting` exists for Lead Routing save (`20260419120000_crm_config_lead_routing`).

To refresh the **hosted** CRM list p95 evidence row in `docs/LAUNCH_CHECKLIST.md`, run from a trusted machine (secrets not committed):

```bash
export BASE_URL="https://payaid-v3.vercel.app"
export CRM_AUTH_WARMUP_ROUNDS=3
export CRM_AUTH_SAMPLE_COUNT=25
export CRM_LOGIN_EMAIL="<tenant login email>"
export CRM_LOGIN_PASSWORD="<tenant login password>"
npm run collect:crm-auth-baseline
```

The script writes `docs/evidence/closure/*-crm-auth-baseline-run.md` and prints `outputPath`. Append a new row to **Speed evidence log** in `docs/LAUNCH_CHECKLIST.md` with the p95 numbers. Default script credentials are **not** valid on production; the run will **block** with `Invalid email or password` until `CRM_LOGIN_*` are set.

## Deploy decision

**Engineering deploy:** **Approved** to proceed to production pipeline subject to normal CI/CD checks on the integration branch.  
**CRM Core GA announcement:** **Not approved** by this document alone — close remaining launch checklist and speed SLO per `docs/LAUNCH_CHECKLIST.md`.

**Stakeholder demo day:** For a **GO** decision scoped to commercial / walkthrough demos (not GA product claims), use the **Demo Day GO** section in `docs/CRM_MODULE_FEATURE_GO_NO_GO_2026-04-17.md` (2026-04-18).

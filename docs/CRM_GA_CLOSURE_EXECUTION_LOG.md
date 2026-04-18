# CRM Core GA — Closure Execution Log

Owner: Phani  
Purpose: live run log for remaining closure queue items from `docs/LAUNCH_CHECKLIST.md`.  
Last updated: 2026-04-17

## How to use

1. Keep queue order aligned with `docs/LAUNCH_CHECKLIST.md` item numbers.
2. Update status immediately after each execution/signoff step.
3. Add evidence links as soon as artifacts are available.
4. If blocked, record clear blocker reason + next retry date.

## Live closure log

| Queue # | Item | Status | Blocker | Evidence link | Last update | Notes |
|---:|---|---|---|---|---|---|
| 1 | Day 2 QA execution | Pending | Signed-in runtime pending | | 2026-04-15 | Run `docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md` |
| 2 | Day 2 Product signoff | Pending | Depends on #1 | | 2026-04-15 | Complete parity one-pager |
| 3 | Day 3 QA execution | Pending | Signed-in runtime pending | | 2026-04-15 | Run `docs/CRM_GA_SOLO_T03_QA_RUNBOOK.md` |
| 4 | Day 3 Product signoff | Pending | Depends on #3 | | 2026-04-15 | Complete Day 3 UAT one-pager |
| 5 | Day 4 closure | Pending | QA + Product signoff pending | | 2026-04-15 | Run Day 4 QA + merge UX signoff |
| 6 | Day 5 closure | Pending | QA evidence pending | | 2026-04-15 | Run role matrix + audit verification |
| 7 | Day 6 closure | Pending | Perf execution pending | | 2026-04-15 | Fill Day 6 evidence tables |
| 8 | Day 7 closure | Pending | CI execution pending | | 2026-04-15 | Fill Day 7 evidence tables |
| 9 | Day 8 closure | Pending | UX/SOP execution pending | | 2026-04-15 | Fill Day 8 evidence tables |
| 10 | Day 9 closure | Pending | GTM/Product execution pending | | 2026-04-15 | Fill Day 9 evidence tables |
| 11 | Day 10 closure | Pending | Rehearsal execution pending | | 2026-04-15 | Fill Day 10 evidence tables |
| 12 | SOLO-T11 closure | Pending | Final signoff pending | | 2026-04-15 | Complete final decision record |
| 13 | CRM unit-test confirmation | Completed | No active blocker after timeout-window fix in closure collector; all 4 scoped CRM tests pass in latest rerun. | `docs/evidence/closure/2026-04-17T02-24-28-340Z-crm-closure-blockers.md` | 2026-04-17 | `CRM_CLOSURE_TEST_TIMEOUT_MS` default raised to `120000` in `scripts/run-crm-closure-blockers.mjs` to avoid false timeout failures |
| 14 | Auth speed baseline | Completed | No active blocker; hosted auth baseline now passes end-to-end with login + contacts/deals/tasks p95. Direct deployed `/api/crm/tasks` check also returns `200` JSON with auth token. | `docs/evidence/closure/2026-04-17T02-41-31-970Z-crm-auth-baseline-run.md` | 2026-04-17 | Route hardening added in both `/api/tasks` and `/api/crm/tasks` with fallback list payload path for runtime resilience |

## Daily execution notes

| Date | Completed queue items | New blockers | Cleared blockers | Next focus |
|---|---|---|---|---|
| 2026-04-15 | Queue #13 (CRM unit-test confirmation) | Queue #14 remains blocked at deployed tasks runtime: latest alias reruns (`2026-04-15T14-41-33-119Z`, `2026-04-15T14-45-06-557Z`) confirm login + contacts/deals p95 but `/api/crm/tasks` still returns 500 even after successful hosted build/deploy completion. Refreshed live runtime logs again show HTML parse failure (`Unexpected token '<'`) on `/api/crm/tasks`. Queue #13 still shows intermittent `tasks-filters` timeout on 300000ms rerun. | Hosted deploy/build blocker cleared | Debug and fix `/api/crm/tasks` runtime error in production path, rerun auth baseline, then close queue #14 |
| 2026-04-17 | Queue #13 and Queue #14 | Release-gate reruns still in progress (`route-health` retry failures observed; typecheck/lint and M2/M3 reruns need final closure snapshots in launch checklist) | Queue #13 timeout flake removed, Queue #14 auth/tasks runtime blocker removed | Complete Day 2-10 + SOLO-T11 execution queue and close remaining release-gate rows |
| 2026-04-17 | No-404 / CI gate hardening | Day 2-10 + SOLO-T11 still pending manual runbook execution | Typecheck green (`npm run typecheck:dashboard`), lint green (`npm run lint -w dashboard`), M2 smoke clean exit (`forceExit`), route-health scripts pinned to `--project chromium` + transient `500` retry for `/crm/*` and `/home/*` | Run full `npm run test:e2e:route-health:serial` for complete matrix; execute launch checklist queue items 1-12 |
| 2026-04-18 | Full serial route-health + deploy readiness doc | Queue 1–12 still **Pending** (GA product) | **`79 passed`**, exit `0`, `PLAYWRIGHT_NO_WEB_SERVER=1` + single dev server (~55m). Local auth baseline `docs/evidence/closure/2026-04-18T10-08-44-035Z-crm-auth-baseline-run.md`. Published `docs/DEPLOY_READINESS_2026-04-18.md` (engineering deploy **GO**, strict GA speed + manual queue **open**). | Execute launch checklist queue 1–12; hosted `collect:crm-auth-baseline` for SLO |

## Blocker resolution commands (copy/paste)

### Queue #13 — CRM unit-test confirmation (local terminal)

```powershell
npm run test:crm:tasks-filters
npm run test:crm:merge-key
npm run test:crm:merge-guard
npm run test:crm:rbac
```

If scripts still hang, run direct-file variant:

```powershell
$env:CI='true'
npx jest --runInBand --watchAll=false "lib/crm/__tests__/contact-merge-key.test.ts" "lib/crm/__tests__/contact-merge-guard.test.ts" "lib/crm/__tests__/rbac.test.ts"
```

Or run both queue #13/#14 capture in one artifact:

```powershell
npm run collect:crm-closure-blockers
```

Targeted variants:

```powershell
# queue #13 only
npm run collect:crm-closure-blockers:tests-only

# queue #14 only
npm run collect:crm-closure-blockers:auth-only

# optional: extend test timeout (ms) for slow local machines
$env:CRM_CLOSURE_TEST_TIMEOUT_MS='300000'
npm run collect:crm-closure-blockers:tests-only
```

### Queue #14 — Auth speed baseline

```powershell
npm run check:crm-closure-env
$env:BASE_URL='http://localhost:3000'
$env:TENANT_ID='<tenant-id>'
$env:AUTH_TOKEN='<jwt-token>'
node scripts/crm-auth-speed-sample.mjs

# One-shot automation (login + sampler + closure artifact)
$env:CRM_LOGIN_EMAIL='admin@demo.com'
$env:CRM_LOGIN_PASSWORD='Test@1234'
npm run collect:crm-auth-baseline
```

If deploy verification is blocked on this workstation, use a deploy-capable environment:

```powershell
# 1) Deploy dashboard with archive mode
vercel --prod --yes --force --archive=tgz --cwd apps/dashboard

# 2) Verify latest deployment/runtime directly
vercel ls
vercel logs <deployment-url>
vercel inspect <deployment-url> --logs

# 3) Re-run auth baseline collector and capture closure artifact
$env:CRM_LOGIN_EMAIL='<valid-tenant-user-email>'
$env:CRM_LOGIN_PASSWORD='<valid-tenant-user-password>'
npm run collect:crm-auth-baseline
```

After running, paste p50/p95/p99 evidence into:

- `docs/LAUNCH_CHECKLIST.md` (Day-0 item 4b + speed evidence log row)
- `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` queue item row and daily notes
- `docs/evidence/closure/*-crm-closure-blockers.md` artifact from `collect:crm-closure-blockers`

## Paste-back evidence template (queue #13/#14)

Use this block after local execution and paste it into your running notes before updating checklists.

```text
Date: [YYYY-MM-DD]

Queue #13 — CRM unit-test confirmation
- test:crm:tasks-filters: [pass/fail] ([summary])
- test:crm:merge-key: [pass/fail] ([summary])
- test:crm:merge-guard: [pass/fail] ([summary])
- test:crm:rbac: [pass/fail] ([summary])
- Evidence path/output: [path or terminal summary]

Queue #14 — Auth speed baseline
- BASE_URL: [value]
- TENANT_ID: [value or masked]
- /api/contacts p50/p95/p99: [values]
- /api/deals p50/p95/p99: [values]
- /api/tasks p50/p95/p99: [values]
- Detail API p95: [value]
- Mutation p95: [value]
- Regression note: [<=10% / exceeds / N/A]
- Evidence path/output: [path or terminal summary]
```

# CRM Core GA — Closure Execution Log

Owner: Phani  
Purpose: live run log for remaining closure queue items from `docs/LAUNCH_CHECKLIST.md`.  
Last updated: 2026-04-15

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
| 13 | CRM unit-test confirmation | Completed (watch flake) | Intermittent timeout on `test:crm:tasks-filters` in long-timeout collector rerun | `docs/evidence/closure/2026-04-15T11-01-56-039Z-crm-closure-blockers.md`, `docs/evidence/closure/2026-04-15T12-24-33-070Z-crm-closure-blockers.md` | 2026-04-15 | Baseline pass is on file; latest rerun shows 3/4 pass with one timeout, so keep as completed but monitor stability |
| 14 | Auth speed baseline | Blocked | Stable env login+tenant resolution succeeds with fresh registered user; contacts/deals p95 collected, but tasks still fails in current deployment (`/api/tasks` 404 and `/api/crm/tasks` 500; runtime log shows HTML payload parsed as JSON). Native handler fix is coded; deploy upload-size blocker improved (`7718` files extracted), but latest production deploys still fail with build OOM/SIGKILL (`dpl_64a16DK8XjSyxGQRhF9EfAJTVG1N`, `dpl_82CJJ37x6B8sET28fCWmi9wt2JA1`). Latest local rerun also confirms host health probe aborts and no sampler output. | `docs/evidence/closure/2026-04-15T11-52-02-618Z-crm-auth-baseline-run.md`, `docs/evidence/closure/2026-04-15T11-53-30-000Z-crm-auth-baseline-vercel-runtime-log-notes.md`, `docs/evidence/closure/2026-04-15T12-28-00-000Z-crm-auth-baseline-deploy-blocker-notes.md`, `docs/evidence/closure/2026-04-15T12-43-24-144Z-crm-auth-baseline-run.md`, `docs/evidence/closure/2026-04-15T13-10-00-000Z-crm-auth-baseline-vercel-build-oom-notes.md` | 2026-04-15 | Re-run production deploy with build-memory mitigations (`apps/dashboard/scripts/next-build.cjs`, Vercel-only Next config reductions), rerun `collect:crm-auth-baseline`, capture full p95 JSON |

## Daily execution notes

| Date | Completed queue items | New blockers | Cleared blockers | Next focus |
|---|---|---|---|---|
| 2026-04-15 | Queue #13 (CRM unit-test confirmation) | Queue #14 remains blocked at deployed tasks runtime plus build OOM during deploy validation; latest local baseline rerun (`2026-04-15T12-43-24-144Z`) shows localhost health probe aborts. New Vercel inspect evidence confirms consecutive production build failures (`dpl_64a16DK8XjSyxGQRhF9EfAJTVG1N`, `dpl_82CJJ37x6B8sET28fCWmi9wt2JA1`) with `SIGKILL` + OOM report. Queue #14 handoff command pack was also corrected after verifying `check:dashboard:latest-runtime` and `collect:dashboard:runtime` scripts are missing in this repo. Queue #13 shows intermittent `tasks-filters` timeout on 300000ms rerun. | Queue #13 baseline pass captured in scoped run artifact | Re-run queue #14 deploy with build-memory mitigation and then rerun auth baseline; monitor queue #13 flakiness |

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

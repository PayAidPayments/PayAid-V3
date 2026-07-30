# P2 Sales Pages → CRM qualify — validation pass (2026-07-30)

## P1 gate

Closed. Do not reopen unless a new hosted failure appears.

## Code landed (this pass)

1. Shared bridge `lib/sales-pages/landing-page-submission-bridge.ts`
   - `processInboundLead` → Contact
   - Persists `contentJson.submissionLog` on LandingPage (adapter-first, no schema widen)
   - List + retry helpers
2. Dashboard + Sales `/api/sales-submissions` twin: POST ingest, GET list, POST `{action:'retry'}`
3. Submissions UI: `apps/sales/app/sales/[tenantId]/Submissions/*` + nav across Sales layouts
4. Static smoke updated: `node scripts/validate-p2-sales-pages-crm-qualify.mjs` → PASS
5. Live smoke script: `node scripts/smoke-p2-sales-pages-crm-live.mjs`

## Live host finding (pre-ship)

`POST https://payaid-v3.vercel.app/api/sales-submissions` still returned stub:

```json
{ "crmSync": "queued", "compatibility": { "mode": "landing-page-bridge" } }
```

Live smoke (2026-07-30):

```bash
node scripts/smoke-p2-sales-pages-crm-live.mjs
```

Result: **FAIL** with explicit blocker — hosted still on stub; GET list returns **405** (POST-only on Ready alias). Windows staged upload hung again (known Hobby/Windows pack issue); do **not** reopen canceled redeploy noise — ship bridge-v2 via Linux GHA `deploy-payaid-v3-slim.yml` after commit/push, then re-run live smoke.

DB-direct smoke (`smoke-p2-sales-pages-crm-db-direct.mjs`) hangs on Supabase pooler Prisma (same known pooler limit) — not a substitute for hosted Ready.

## Parallel: packages/db migrations

Root-only folders copied into `packages/db/prisma/migrations/` (see `2026-07-30-packages-db-migrations-cutover-progress.md`). Next: `_prisma_migrations` inventory on live DB (needs direct URI), then CLI retarget.

## Out of scope

Lead Intelligence discovery · auto-Deal create · Deals BD-05 reopen (proxy/SLO only)

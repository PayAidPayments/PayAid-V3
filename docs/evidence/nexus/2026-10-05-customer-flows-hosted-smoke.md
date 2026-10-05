# Evidence: Customer Flows production smoke (2026-10-05)

## Offline integrity (PASS)

Ran against workspace catalogs/runtime:

| Check | Result |
|---|---|
| `npm run check:nexus-runbooks` | PASS (5 divisions, 20 agents, 5 runbooks) |
| `npm run check:customer-specialists` | PASS (5 divisions, 12 agents) |
| `npm run check:customer-flows` | PASS |
| `npm run check:customer-orchestrator` | PASS |
| `npx tsx scripts/smoke-customer-flows.ts` | PASS |
| `npx tsx scripts/smoke-customer-orchestrator.ts` | PASS |

## Hosted public smoke (`https://payaid-v3.vercel.app`)

| Probe | Result |
|---|---|
| `/` `/login` `/ai-studio` | 200 |
| Unauth `GET/POST /api/ai/customer-flows/*` | 401 `INVALID_TOKEN` (fail-closed auth OK) |
| `GET /api/health` | **503 unhealthy** — database configured but query fails with `FATAL: (ENOTFOUND) tenant/user ... not found` |
| `POST /api/auth/login` | **500** — database connection / unavailable |

## Authenticated Flows smoke

**Blocked.** Login cannot issue a session because production `DATABASE_URL` points at a missing/invalid Supabase tenant. No bearer token available for:

- `POST /api/ai/customer-flows/sales-follow-up`
- `POST /api/ai/customer-flows/gst-invoice-draft`
- `POST /api/ai/customer-flows/orchestrate`
- `GET /api/ai/customer-flows/drafts?pending=1`
- approve/reject
- `/ai-studio/[tenantId]/Flows` authenticated UI path

## Required unblock (P0)

1. Provision or restore a live Postgres for PayAid V3 production.
2. Set Vercel project env `DATABASE_URL` (production target) to the working connection string (and `DATABASE_DIRECT_URL` if used).
3. Redeploy or restart production.
4. Confirm `GET /api/health` → 200 / database ok.
5. Re-run hosted authenticated Flows smoke (script: `scripts/smoke-customer-flows-hosted.mjs` with `SMOKE_EMAIL` / `SMOKE_PASSWORD`).

Do **not** promote slim preview `f8110c9`.

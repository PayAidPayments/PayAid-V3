# Production database restore (P0)

Date: 2026-10-05  
Status: **Blocked on missing Supabase project**

## Diagnosis

- `GET https://payaid-v3.vercel.app/api/health` → 503
- Prisma error: `FATAL: (ENOTFOUND) tenant/user postgres.ssbzexbhyifpafnvdaxn not found`
- DNS: `db.ssbzexbhyifpafnvdaxn.supabase.co` → ENOTFOUND (project deleted/paused beyond resume)
- DNS: `db.zjcutguakjavahdrytxc.supabase.co` → ENOTFOUND (older documented project also gone)
- Pooler hosts resolve, but the project ref is unknown to the pooler
- Vercel production `DATABASE_URL` is set (encrypted), host `aws-1-ap-northeast-1.pooler.supabase.com`, username includes project ref

## Why authenticated Flows smoke cannot proceed

Login and all tenant APIs need Postgres. Without a live DB there is no session token for:

- `/api/ai/customer-flows/*`
- `/ai-studio/[tenantId]/Flows`

## Operator unblock (choose one)

### A) New Supabase project (preferred, matches existing stack)

1. Sign in at https://supabase.com/dashboard
2. Create a new project (or resume if one still exists under the org)
3. **Connect → Session pooler** copy URI (`postgres.[PROJECT_REF]` username, port 5432)
4. From repo root:

```powershell
$env:DATABASE_URL = '<paste session pooler URI>'
# optional:
# $env:DATABASE_DIRECT_URL = '<direct URI>'
node scripts/set-vercel-database-url.mjs
```

5. Apply schema + seed against the same URI:

```powershell
$env:DATABASE_URL = '<same URI>'
npx prisma migrate deploy
node scripts/smoke-customer-flows-hosted.mjs   # after creating/login user
```

6. Confirm:

```text
GET /api/health → database.connected=true
SMOKE_EMAIL=... SMOKE_PASSWORD=... npm run smoke:customer-flows:hosted
```

### B) Any managed Postgres (Neon/Vercel Postgres/RDS)

Same as A, but set `DATABASE_URL` to that provider’s URL. Prisma migrations are Postgres-dialect.

## Ready tooling in repo

- `scripts/set-vercel-database-url.mjs` — upserts Vercel production `DATABASE_URL` (+ optional `DATABASE_DIRECT_URL`) and forces a production redeploy
- `scripts/smoke-customer-flows-hosted.mjs` — authenticated Flows smoke after login works
- Offline specialist checks already PASS (see `docs/evidence/nexus/2026-10-05-customer-flows-hosted-smoke.md`)

## Do not

- Promote slim preview `f8110c9`
- Point production at a laptop Docker Postgres without a stable public host

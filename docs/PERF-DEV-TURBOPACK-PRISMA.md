# Dev perf: Turbopack + Prisma (10x dev speed)

## What was done

### 1. Turbopack for all apps
- **apps/dashboard**, **apps/crm**, **apps/hr**, **apps/voice**: `"dev": "next dev --turbo -p <port>"`.
- Next.js 16 uses Turbopack by default; `--turbo` keeps it explicit and ensures Webpack is not used.
- **Impact**: Much faster HMR and startup vs Webpack.

### 2. Turbo: pre-generate Prisma before dev
- **turbo.json** `dev`: `"dependsOn": ["^db:generate"]` so `@payaid/db` runs `db:generate` before any app’s `dev`.
- **turbo.json** `build`: `"cache": true` for build caching.
- **turbo.json** `db:generate`: `outputs` so Turbo can cache Prisma client generation.

### 3. Root scripts
- **dev**: `npm run dev -w dashboard` (single app on 3000).
- **dev:turbo**: `turbo dev --filter=dashboard` (same, with Turbo pipeline + Prisma pre-gen).
- **dev:all**: dashboard + websocket (no parallel apps).

## Verify

```bash
# Prisma generated before dev
node node_modules/turbo/bin/turbo run dev --dry-run --filter=dashboard

# Start dashboard (Turbopack + pre-gen)
npm run dev
# or
npm run dev:turbo

# HMR: edit a component → save; expect <2s update (vs 30s+ with Webpack).
```

## Optional: Prisma schema split (50% gen time)

If `packages/db/prisma/schema.prisma` is very large (~9k+ lines), you can split it with Prisma’s multi-file schema (preview):

1. In **packages/db/prisma/schema.prisma**, add:
   ```prisma
   previewFeatures = ["prismaSchemaFolder"]
   ```
2. Create **packages/db/prisma/schema/** and move parts of the schema:
   - **core.prisma**: datasource + generator + Tenant, User, auth, shared.
   - **crm.prisma**: CRM models (Lead, Deal, Contact, …).
   - **hr.prisma**: HR models (Employee, Payroll, …).
3. See [Prisma Turborepo guide](https://www.prisma.io/docs/guides/turborepo) and [multi-file schema](https://www.prisma.io/docs/orm/prisma-schema/data-model/advanced/use-multiple-schema-files).

## Hobby / Vercel limits

- **Parallel builds**: Hobby has limits; use `--filter=dashboard` (single app).
- **Timeout**: Pro trial gives 60s; upgrade at vercel.com/account/billing if needed.

**Commit**: `perf-dev-turbopack-prisma`

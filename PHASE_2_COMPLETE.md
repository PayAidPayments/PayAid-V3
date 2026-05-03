# Phase 2 – Turborepo (Modular) – Complete

## Summary

Phase 2 introduces a Turborepo monorepo layout with shared `@payaid/db` and placeholder packages, plus four app entry points for independent deploys. The existing monolith remains at repo root; apps/* are the new deploy targets.

---

## 1. Root

- **`turbo.json`** – Pipeline: `build` (dependsOn `^build`, outputs `.next/**`, `dist/**`), `dev` (cache: false, persistent), `lint`, `db:generate`.
- **`package.json`** – `workspaces`: `["apps/*", "packages/*"]`. New scripts: `dev:crm`, `dev:hr`, `dev:voice`, `dev:dashboard` (e.g. `turbo dev --filter=crm`).
- **Sync script** – `scripts/sync-module-routes-to-monolith.ts` marked **deprecated** for Phase 2; do not run when using apps/*. Use only for legacy monolith.

---

## 2. Packages

| Package        | Purpose | Status |
|----------------|--------|--------|
| **`packages/db`** | Prisma schema + singleton client + extended (Accelerate) | ✅ Ready. Schema copied from root `prisma/`; `src/client.ts`, `src/extended.ts`, `src/index.ts` export `prisma`, `prismaExtended`. Build: `prisma generate`. |
| **`packages/core`** | Auth, tenant, stores, modules (ModuleProvider) | Stub only. Migrate `lib/auth`, `lib/tenant`, `lib/stores`, `lib/modules`, `contexts` in follow-up. |
| **`packages/ui`** | Shared layout and components | Stub only. Migrate `components/layout`, `components/shared` in follow-up. |
| **`packages/ai`** | AI helpers, TTS chain, voice-agent | Stub only. Migrate `lib/ai`, `lib/voice-agent` in follow-up. |

---

## 3. Apps

| App | Port | Purpose |
|-----|------|--------|
| **`apps/dashboard`** | 3000 | Shell + dashboard. Minimal Next.js app; uses `@payaid/db`. Full `app/dashboard/*` + shell layouts move here in follow-up. |
| **`apps/crm`** | 3001 | CRM. Minimal app; uses `@payaid/db`. Full `app/crm/*` + `crm-module/app/*` move here. |
| **`apps/hr`** | 3002 | HR. Minimal app; uses `@payaid/db`. Full `app/hr/*` + `hr-module/app/*` move here. |
| **`apps/voice`** | 3003 | Voice & AI. Minimal app; uses `@payaid/db`. Full `app/voice-agents/*`, `app/ai-chat/*`, `app/ai/*` move here. |

Each app has: `package.json` (depends on `@payaid/db`: `file:../../packages/db` for npm; use `workspace:*` if you switch to pnpm/yarn), `tsconfig.json` (paths `@payaid/db` → `../../packages/db/src`), `next.config.mjs`, `app/layout.tsx`, `app/page.tsx`.

---

## 4. Imports

- **Apps** – Use `@payaid/db` (and later `@payaid/core`, `@payaid/ui`, `@payaid/ai`) from workspace packages.
- **Root monolith** – Keeps using `@/lib/db/prisma` (alias in `next.config.js` to `lib/db/prisma`). Can later switch to `@payaid/db` when desired.

---

## 5. Vercel

- Create **4 projects**: one per app, with **Root Directory** set to `apps/dashboard`, `apps/crm`, `apps/hr`, `apps/voice`.
- Build command: `cd ../.. && npx turbo build --filter=<app-name>` or Vercel’s default `npm run build` from that root directory.
- Ensure `DATABASE_URL` (and optional `ACCELERATE_URL`) are set in each project.

---

## 6. Next steps (follow-up)

1. **Move routes** – Copy `app/crm/*` and `crm-module/app/*` into `apps/crm/app/`; same for hr, voice; move dashboard + shell into `apps/dashboard`.
2. **Migrate packages** – Move `lib/auth`, `lib/tenant`, `lib/stores`, `lib/modules` into `packages/core`; layout/shared into `packages/ui`; `lib/ai`, `lib/voice-agent` into `packages/ai`. Update apps to depend on and import from these packages.
3. **Single schema** – Keep Prisma schema only in `packages/db/prisma/schema.prisma`; point root monolith at it or remove root `prisma/` after full cutover.
4. **Remove sync script** – Once all routes live in apps, remove or archive `sync-module-routes-to-monolith.ts`.

---

**Commit:** `phase-2-turborepo`

# Phase 3 – Migrate & Rendering – Complete

## Summary

Phase 3 removes app-wide `force-dynamic`, adds ISR and HTTP caching for CRM, and migrates the full CRM app into `apps/crm` with a root path alias so it can run in isolation.

---

## 1. Root layout and rendering

- **`app/layout.tsx`** – Removed `export const dynamic = 'force-dynamic'`. Comment added: use per-route `dynamic` or `revalidate` (e.g. `revalidate = 60` on list/dashboard segments).
- **`app/crm/layout.tsx`** – New **server** layout for the CRM segment with **`export const revalidate = 60`** so list/dashboard data can be ISR-cached.

---

## 2. API cache (unstable_cache + Cache-Control)

- **`app/api/crm/dashboard/summary/route.ts`**:
  - **`unstable_cache`** – Dashboard summary is cached per tenant with key `['crm-dashboard-summary', tenantId]` and **`revalidate: 30`**.
  - **Cache-Control** – Response headers: **`s-maxage=300, stale-while-revalidate=600`** for CDN/edge caching.

---

## 3. CRM migration to apps/crm

- **Path alias** – In **`apps/crm/tsconfig.json`**, **`@/*`** points to **`../../*`** (repo root) so existing `@/lib`, `@/components` imports resolve without changes.
- **Next.js webpack** – In **`apps/crm/next.config.mjs`**, **`resolve.alias['@']`** set to repo root so runtime resolution matches.
- **Copied into `apps/crm/app/`**:
  - **`layout.tsx`**, **`ProvidersLoader.tsx`**, **`providers.tsx`**, **`globals.css`** (from root `app/`).
  - **`app/crm/*`** → **`apps/crm/app/crm/*`** (full CRM route tree).
  - **`app/api/crm`** → **`apps/crm/app/api/crm`** (all CRM API routes).

Running **`npm run dev:crm`** (or `turbo dev --filter=crm`) from repo root runs the CRM app on port 3001 with routes **`/crm/...`** and **`/api/crm/...`**; all existing `@/` imports resolve to the monorepo root.

---

## 4. What was not done (follow-up)

- **Dashboard / HR / Voice** – No copy into `apps/dashboard`, `apps/hr`, `apps/voice` yet. Same pattern as CRM: path alias `@/*` → repo root, then copy `app/dashboard/*`, `app/hr/*`, `app/voice-agents/*` and corresponding `app/api/*` into each app.
- **Shared packages** – `packages/core`, `packages/ui`, `packages/ai` remain stubs. Migrating `lib/auth`, `lib/tenant`, `components/layout`, `lib/ai` into them is follow-up; apps/crm currently relies on root via `@/`.
- **Remove root app/** – Root `app/` is still the main monolith. Deprecation or removal is after all modules are moved and verified.

---

## 5. Verify

- Root: `npm run dev` – full app; no global force-dynamic; CRM segment uses revalidate 60.
- CRM app: `npm run dev:crm` – only CRM; `/crm`, `/api/crm` work with shared lib/components via `@/` → root.
- API: `GET /api/crm/dashboard/summary?tenantId=...` returns **Cache-Control: s-maxage=300, stale-while-revalidate=600** and benefits from **unstable_cache** (30s revalidate).

---

**Commit:** `phase-3-migrate-rendering`

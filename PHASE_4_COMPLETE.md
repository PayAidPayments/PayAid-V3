# Phase 4 – Migrate Remaining + Bundles – Complete

## Summary

Phase 4 migrates HR, Dashboard, and Voice into `apps/hr`, `apps/dashboard`, and `apps/voice` (same pattern as CRM with `@/*` → repo root), adds ISR for HR, expands bundle optimizations in all apps, lazy-loads the spreadsheet editor, and adds shared package content to `@payaid/core` and `@payaid/ai`.

---

## 1. App migrations

| App | Content copied | Port | Path alias |
|-----|----------------|------|------------|
| **HR** | `app/layout`, shell, `app/hr/*`, `app/api/hr` | 3002 | `@/*` → `../../*` |
| **Dashboard** | `app/layout`, shell, `app/dashboard/*` | 3000 | `@/*` → `../../*` |
| **Voice** | `app/layout`, shell, `app/voice-agents/*`, `app/api/ai`, `app/api/v1/voice-agents` | 3003 | `@/*` → `../../*` |

- **apps/hr**: `tsconfig` and `next.config.mjs` updated with root alias and webpack `resolve.alias['@']`.
- **apps/dashboard**: Same; dashboard routes live under `apps/dashboard/app/dashboard/*`.
- **apps/voice**: Same; voice under `apps/voice/app/voice-agents/*`, API under `app/api/ai` and `app/api/v1/voice-agents`.

**Run:** `npm run dev:hr`, `npm run dev:dashboard`, `npm run dev:voice` (or `turbo dev --filter=hr` etc.).

---

## 2. ISR for HR

- **`app/hr/layout.tsx`** (root) – New server layout with **`export const revalidate = 60`** for the HR segment (same pattern as CRM).

---

## 3. Bundle optimizations

- **apps/*/next.config.mjs** – All four apps now use:
  - **`optimizePackageImports`**: `['@radix-ui/*', 'lucide-react', 'framer-motion', 'recharts', 'handsontable', '@tiptap/react', 'x-data-spreadsheet']`
- **Root app** – **`app/spreadsheet/[tenantId]/Spreadsheets/[id]/page.tsx`** uses **`dynamic(..., { ssr: false })`** for `SpreadsheetEditor` (Recharts + x-data-spreadsheet) with a loading fallback.

---

## 4. Shared packages

- **@payaid/core**
  - **`packages/core/src/moduleRegistry.ts`** – Copied from `lib/modules/moduleRegistry.ts` (no external deps).
  - **`packages/core/src/index.ts`** – Exports `MODULE_REGISTRY`, `getEnabledModules`, `getAccessibleRoutes`, `hasModuleAccess`, `getModule`, `getAllModules`, `getModulesByCategory`, and types `ModuleRoute`, `ModuleDefinition`.
- **@payaid/ai**
  - **`packages/ai/src/tts.ts`** – Stub **`tts()`** that throws “TTS not configured: use text mode.” Full chain remains in `lib/voice-agent/tts.ts` for Phase 6 resilience.
  - **`packages/ai/src/index.ts`** – Re-exports `tts`.
- **@payaid/ui** – Unchanged (stub). Move `components/layout/*` here in follow-up and switch imports to `@payaid/ui`.

---

## 5. Verify

- **HR:** `turbo dev --filter=hr` → http://localhost:3002/hr/...
- **Dashboard:** `turbo dev --filter=dashboard` → http://localhost:3000/dashboard/...
- **Voice:** `turbo dev --filter=voice` → http://localhost:3003/voice-agents/...
- **Analyze:** `npm run analyze --filter=crm` (from root) to confirm client bundle; target &lt;500KB gzipped after further optimizations.

---

## 6. Migration status

| App       | Migrated | Port | Note                    |
|----------|----------|------|-------------------------|
| CRM      | ✅       | 3001 | Phase 3                  |
| HR       | ✅       | 3002 | Phase 4                  |
| Dashboard| ✅       | 3000 | Phase 4                  |
| Voice    | ✅       | 3003 | Phase 4 (voice + AI API) |

---

**Commit:** `phase-4-migrate-bundles`

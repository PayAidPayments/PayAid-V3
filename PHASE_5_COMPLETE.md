# Phase 5 – DB (N+1, prismaExtended, Supabase indexes) – Complete

## Summary

Phase 5 fixes N+1 in apps with batch `in:ids` + groupBy (health-scores priority), adds a central DB export for prismaExtended, and provides Supabase index SQL for Teja. Vercel Hobby: deploy **apps/crm** first with **root = apps/crm**.

---

## 1. N+1 fixes (batch in:ids + groupBy)

| Location | Change |
|----------|--------|
| **apps/crm/.../health-scores/route.ts** | Replaced per-contact `calculateCustomerHealthScore` loop with **`calculateCustomerHealthScoresBatch(contactIds, tenantId)`**. Single batched fetch: contacts, interactions, invoices, users by email, tenant members; then groupBy contactId and score in memory. |
| **lib/ai/customer-health-scoring.ts** | Added **`scoreFromComponents(components)`** (pure), **`calculateCustomerHealthScoresBatch`**, **`buildComponentsFromBatchData`**, **`groupBy`**. Single-contact API still uses **`calculateCustomerHealthScore`** (calls `getHealthScoreComponents` then `scoreFromComponents`). |
| **apps/crm/.../segments/route.ts** | Documented: contact counts are parallel (`Promise.all`); true batch would need raw SQL with dynamic criteria. |

**Tasks / timeEntries:** tasks-view and activity-feed already use `findMany` with `include` (no per-item Prisma in loop). No `timeEntry` model in apps; when added, use same pattern: batch `{ id: { in: ids } }` + groupBy.

---

## 2. prismaExtended for all queries

- **lib/db/index.ts** – New central export: `prisma`, `prismaExtended`, `prismaWithRetry`. Use **`prismaExtended`** for read-heavy routes when `ACCELERATE_URL` or `prisma://` DATABASE_URL is set (cache/edge).
- **Recommendation:** For new code and read-heavy API routes, prefer `import { prismaExtended } from '@/lib/db'` or `import { prismaExtended } from '@/lib/db/extended'`. Migrating all existing `import { prisma } from '@/lib/db/prisma'` to prismaExtended can be done in a follow-up (e.g. make `prisma.ts` re-export extended via a prisma-base split).

---

## 3. Supabase indexes (Teja runs SQL)

- **scripts/supabase-indexes-phase5.sql** – Idempotent `CREATE INDEX IF NOT EXISTS` for:
  - `Interaction`: `(contactId, createdAt DESC)`, `(contactId, type, createdAt DESC)` for batch health-scores / activity.
  - `Invoice`: `(customerId, tenantId)` for batch health-scores.
  - `Task`: `(tenantId, dueDate, status)` for tasks-view (optional composite).
  - `Contact`: `(tenantId)` for id-only list.
  - `Deal`: `(tenantId, updatedAt DESC)` for activity feed.

Run in **Supabase SQL Editor** (Teja).

---

## 4. Vercel Hobby – Deploy apps/crm first

- **Root for first deploy:** **apps/crm** (not repo root).
- In Vercel: set **Root Directory** to **`apps/crm`**. Build command: **`next build`** (or `npm run build` from that root). Install command: **`npm install`** or **`npm ci`** at repo root if using monorepo install at root.
- Env: `DATABASE_URL`, `DIRECT_URL` (or Supabase vars), and any CRM-specific env. After apps/crm is live, add dashboard/hr/voice as separate projects with roots `apps/dashboard`, `apps/hr`, `apps/voice`.

---

## 5. Verify

- Health-scores: `GET /api/crm/analytics/health-scores?limit=20` – should return scores without N+1 (check DB query count).
- Segments: `GET /api/crm/segments?organizationId=<tenantId>` – parallel counts only; no change in behavior.
- Supabase: after Teja runs **scripts/supabase-indexes-phase5.sql**, confirm indexes exist in DB.

---

## 6. Rest phases (6–9, as previous prompt)

- **Phase 6:** TTS resilience, `/api/health`, AI services.
- **Phase 7:** CI (build/lint per app).
- **Phase 8:** Playwright / e2e.
- **Phase 9:** Demo-check, README.

---

**Commit:** `phase-5-db-n1-extended-indexes`

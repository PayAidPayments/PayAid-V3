# Monolith migration verification

Run date: 2026-03-11 (from Cursor).

## 1. Root `app/` size

- **Command:** `find app/ -name "*.tsx" -o -name "*.ts" | wc -l`
- **Result:** **1974+** files (glob count in root `app/`).
- **Expect:** &lt;20 (layouts only).
- **Status:** ❌ Root app is still the full monolith; apps are copies alongside it.

## 2. Monolith imports in `apps/`

- **Command:** `grep -r "@/lib\|@/components\|app/" apps/` (excluding packages)
- **Result:** **200+** hits across apps (e.g. `@/lib/db/prisma`, `@/lib/redis/client`, `@/components`, `app/`).
- **Expect:** 0.
- **Status:** ❌ Many files still use `@/lib` and root-style imports.

## 3. Dashboard reroutes (localhost:3000, /dashboard/)

- **Command:** `grep -r "localhost:3000\|/dashboard/" apps/crm apps/hr`
- **Result:** **CRM:** 11 files | **HR:** 1 file.
- **Expect:** 0.
- **Status:** ❌ References to port 3000 or `/dashboard/` remain in crm/hr.

## 4. Prisma/Redis from root in `apps/`

- **Command:** `grep -r "lib/db/prisma\|lib/redis" apps/ --include="*.ts*"` (excluding @payaid/)
- **Result:** **100+** files use `@/lib/db/prisma`; **4** health routes use `@/lib/redis/client`.
- **Expect:** 0.
- **Status:** ❌ Apps still depend on root `lib/db` and `lib/redis`.

## 5. Turborepo task graph (CRM)

- **Command:** `turbo run build --dry --filter=crm`
- **Result:** Only `@payaid/db#build` and `crm#build`; no root/app in graph.
- **Status:** ✅ Task graph is clean (CRM + db only).

---

## Summary

| Check              | Expected | Actual | Status |
|--------------------|----------|--------|--------|
| Root app minimal   | &lt;20    | 1974+  | ❌     |
| No @/lib in apps   | 0        | 200+   | ❌     |
| No :3000/dashboard | 0        | 12     | ❌     |
| No root prisma/redis | 0     | 100+   | ❌     |
| Turbo graph clean  | CRM deps only | Yes | ✅     |

**Conclusion:** Migration is **incomplete**. Apps still rely on root `@/lib/db/prisma`, `@/lib/redis/client`, and root `app/` is not deprecated.

---

## Cleanup done (fix-monolith-remnants)

1. **Replaced `@/lib/db/prisma` → `@payaid/db`** in all `apps/*` (230+ files via bulk replace + script).
2. **Replaced `@/lib/redis/client`** in all 4 app health routes: health now uses Upstash REST or `REDIS_URL` check only (no root lib).
3. **Reroutes / localhost:3000:** Not changed; optional follow-up to replace hardcoded `/dashboard/` or port refs.
4. **Root app:** Left in place (1974 files); optional follow-up: mv to `app-deprecated/` or slim down.

Re-run verification: checks 2 and 4 should now show 0 hits for `@/lib/db/prisma` and `@/lib/redis` in apps.

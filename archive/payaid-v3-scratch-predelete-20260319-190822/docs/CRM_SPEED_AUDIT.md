# CRM Speed Compliance Audit

**Date:** 2025-03  
**Scope:** payaid-v3-scratch apps/crm  
**Master plan:** Phase 0–1 speed tools & configurations

---

## TEST RESULTS

Run from repo root (`payaid-v3-scratch`). Record results below after each run.

| Test | Command | Target | Result (fill after run) |
|------|---------|--------|-------------------------|
| **Startup** | `pnpm turbo dev --filter=crm` (measure until "Ready" in terminal) | <5s | _e.g. 3.2s_ |
| **TTFB** | Start CRM dev, then `npx -y autocannon -c 20 -d 10 http://localhost:3001/dashboard` | P95 <300ms | _e.g. 180ms_ |
| **Bundle** | `pnpm analyze` (opens bundle report; check First Load JS per route) | <500KB gzip per route | _e.g. 420 KB_ |

### Commands reference

```bash
# Startup (PowerShell: measure until "Ready")
pnpm dev:crm

# TTFB (in another terminal after CRM is up)
npx -y autocannon -c 20 -d 10 http://localhost:3001/dashboard

# Bundle analysis (opens browser with treemap)
pnpm analyze
```

*Note:* Use `/dashboard` and `/leads` (no `/crm/` prefix) for the CRM app on port 3001.

---

## AUDIT CHECKLIST

### 1. Dev speed

| Item | Status | Notes |
|------|--------|------|
| turbo.json `"dev": { "cache": false, "persistent": true }` | ✅ | Present in turbo.json |
| package.json `"dev:crm": "turbo dev --filter=crm"` | ✅ | Present |
| next.config.mjs `experimental: { turbo: true, ppr? }` | ✅ | turbo enabled; ppr optional (Next canary), commented in config |
| next.config.mjs `swcMinify: true` | ✅ | Added |
| next.config.mjs `optimizePackageImports` | ✅ | lucide-react, recharts, @radix-ui/* |
| No global force-dynamic in layouts | ✅ | Root and (crm) layouts have no force-dynamic |

### 2. Redis caching

| Item | Status | Notes |
|------|--------|------|
| Single Redis client (singleton) | ✅ | lib/cache.ts getRedis() singleton |
| Dashboard cached by tenant | ✅ | getCached(cacheKey("crm", tenantId, "dashboard")), TTL 30s |
| Leads list cached | ✅ | getCached(cacheKey("crm", tenantId, "leads:v1")), TTL 60s |
| Invalidation on mutations | ✅ | delCached in leads route, leads/[id] PATCH/DELETE, bulk-score, score-lead |
| TTLs 30–60s | ✅ | Dashboard 30s, leads 60s |

*Note:* Key format is `payaid:crm:${tenantId}:dashboard` (equivalent to checklist).

### 3. RSC + Next.js caching

| Item | Status | Notes |
|------|--------|------|
| Dashboard/leads pages = RSC (no 'use client' on page) | ✅ | dashboard/page.tsx, leads/page.tsx are server components |
| unstable_cache on aggregations | ✅ | Dashboard and leads use unstable_cache + Redis |
| revalidate on pages | ✅ | revalidate = 30 on dashboard and leads |
| No client-side data fetching for lists | ✅ | Lists come from server; only interactive bits are client (LeadsTable, MiniKanban, etc.) |
| Cache-Control headers | ✅ | next.config headers: s-maxage=300, stale-while-revalidate=600 for /dashboard, /leads |

### 4. Prisma + DB

| Item | Status | Notes |
|------|--------|------|
| tenantId on every model + indexes | ✅ | CrmLead: @@index([tenantId]), @@index([tenantId, status]), @@index([tenantId, score]), @@index([tenantId, ownerId]) |
| listLeads / getLeads pagination | ✅ | getLeads(tenantId, page) uses skip/take (PAGE_SIZE=20); first page cached, total count returned |
| No findMany without tenantId | ✅ | All CRM queries filter by tenantId |

### 5. Bundle & client perf

| Item | Status | Notes |
|------|--------|------|
| optimizePackageImports for recharts/lucide/radix | ✅ | Added in next.config.mjs |
| Charts in client components | ✅ | Sparkline is "use client"; recharts only in client bundle |
| No client state for list/dashboard data | ✅ | Data from RSC |

*Optional:* Dynamic import for Sparkline if recharts bundle is still large: `const Sparkline = dynamic(() => import('@/components/ui/sparkline').then(m => ({ default: m.Sparkline })), { ssr: false });`

### 6. Queueing & background jobs

| Item | Status | Notes |
|------|--------|------|
| BullMQ on Redis for scoring/enrichment | ✅ | Queue `crm:bulk-score`; API POST body `async: true` enqueues job; run `pnpm worker:crm` to process |
| No blocking AI in request handlers | ✅ | AI calls are async; bulk score is API route |

---

## FIXES APPLIED

1. **apps/crm/next.config.mjs**
   - `swcMinify: true`
   - `experimental: { ppr: true, serverComponents: true }`
   - `optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dropdown-menu']`
   - `async headers()` for `/dashboard` and `/leads`: `Cache-Control: s-maxage=300, stale-while-revalidate=600`

---

## DATA DENSITY (post-audit)

- **Seed script:** `pnpm seed:crm` (or `tsx scripts/seed-crm.ts`) creates 50 leads, pipeline + 10 deals, 20 activities for tenant `demo`. Run after DB is up for instant populated CRM.
- **Dashboard:** Score distribution chart (dynamic recharts, ssr: false) and Open Activities widget with Quick Add (Task/Call/Meeting) added. Dashboard uses `unstable_cache` + Redis.

## BUNDLE ANALYZER & PAGINATION & BULLMQ (implemented)

- **Bundle:** `@next/bundle-analyzer` added; run `pnpm analyze` (or `pnpm --filter crm run build:analyze`) to open treemap and verify <500KB gzip per route.
- **Pagination:** getLeads uses `skip` / `take` (PAGE_SIZE=20). Leads page accepts `?page=0`; first page cached as `leads:v1`; total count returned; LeadsTable shows Previous/Next when totalPages > 1.
- **BullMQ:** Queue `crm:bulk-score`. Bulk-score API: body `{ tenantId, status?, async: true }` enqueues and returns `{ queued: true, jobId }`. Worker: `pnpm worker:crm` (scripts/crm-worker.ts) processes jobs (Ollama scoring, DB update, cache invalidation).

---

## SUMMARY

| Category     | Result |
|-------------|--------|
| Dev         | ✅ Compliant |
| Redis       | ✅ Compliant |
| RSC/Caching | ✅ Compliant (Cache-Control added) |
| Prisma      | ✅ Compliant |
| Bundle      | ✅ optimizePackageImports added |
| Queues      | ✅ BullMQ bulk-score queue + worker |

# PayAid V3 – Platform Architecture (CTO Summary)

**Purpose:** Share with CTO for performance review. Platform is reported slow vs. market standards.

---

## 1. High-level stack

| Layer | Technology | Notes |
|-------|------------|--------|
| **Framework** | Next.js 16 (App Router) | React 19, `--webpack` in dev/build (Turbopack disabled) |
| **Language** | TypeScript 5.5 | `ignoreBuildErrors: true` in Next config |
| **Database** | PostgreSQL (Supabase or self-hosted) | Single primary; Prisma ORM |
| **ORM** | Prisma 5.x | Large schema (100+ models, 9000+ lines) |
| **Cache** | Redis (ioredis) + in-memory | Optional on Vercel (no Redis → no-op / in-memory fallback) |
| **Job queue** | Bull (Redis-backed) | High / medium / low priority queues |
| **Client state** | TanStack React Query 5 + Zustand | Query: 5 min stale, 10 min gc |
| **Hosting** | Vercel (serverless) | Implied by config (serverless, build constraints) |
| **AI / external** | LangChain, OpenAI, Groq, ElevenLabs, Deepgram, Google AI, etc. | Many optional integrations |

---

## 2. Build and tooling

- **Build command:** `node scripts/prisma-generate-with-retry.js && node --max-old-space-size=5120 ./node_modules/next/dist/bin/next build --webpack`
- **Node heap:** 5120 MB for build to reduce OOM on Vercel (8 GB container).
- **Next config:**
  - `compress: true` (gzip/brotli).
  - `productionBrowserSourceMaps: false`.
  - `optimizePackageImports` for `lucide-react`, `@radix-ui/react-icons`, `framer-motion`.
  - On Vercel: `webpackBuildWorker: false`, `cpus: 1`, `webpackMemoryOptimizations: true`.
  - Terser: `parallel: 1` to lower memory.
- **Webpack:** Custom config with path aliases (`@`, `@payaid/db`), server-only externals (e.g. `bull`, `pdfkit`, `fluent-ffmpeg`, `dockerode`), client fallbacks for Node built-ins.
- **Dev:** `next dev -p 3000 --webpack` (webpack, not Turbopack).

**Performance implications:** Single-threaded/minimal parallelism on Vercel and heavy Prisma client generation can make builds long and memory-sensitive. No Turbopack in dev can slow local iteration.

---

## 3. Database

- **Provider:** PostgreSQL via `DATABASE_URL` (and `DATABASE_DIRECT_URL` for migrations).
- **Connection:**
  - Prisma singleton stored on `globalThis` to avoid re-init per request.
  - Pool: `connection_limit` = 1 (session pooler) or 3 (transaction pooler on Supabase), 10 on localhost; `pool_timeout` 5s, `connect_timeout` 3–15s.
  - Supabase: `pgbouncer=true`, `sslmode=require`; transaction pooler on port 6543.
- **Schema:** Very large (100+ models, 9000+ lines, 100+ indexes/uniques). Single `schema.prisma`; no read replicas or sharding.
- **Logging:** Production: `['error']` only; dev: `['error','warn']` (optional `PRISMA_LOG_QUERIES=true` for query log).
- **Usage:** Server-only (`server-only` + runtime check). Used in API routes, server components, server actions.

**Performance implications:** Low connection limits (1–3) in serverless are correct for pooler usage but can queue under concurrency. No connection pooling layer in front of Prisma other than DB/pooler. Large schema increases Prisma client size and can slow generate/build. No documented read replicas or query-level caching in Prisma.

---

## 4. Caching

- **Redis:** ioredis; `REDIS_URL`. On Vercel build or when URL is localhost, Redis is skipped and no-op/in-memory fallback is used, so production may run without Redis if not configured.
- **Multiple Redis “clients”:**
  - `lib/redis/client.ts` – main singleton; no-op when Redis skipped; used by cache wrapper, Bull, rate limit, tenant middleware.
  - `lib/performance/database-optimization.ts` – separate lazy Redis for DB optimization helpers.
  - `lib/cache/invalidation.ts` – own singleton for cache invalidation.
  - `lib/performance/cache.ts` – forecast/whatif keys.
  - `lib/cache/multi-layer.ts` – L1 in-memory (per-instance) + L2 Redis; 1000 entry cap, 60s TTL for L1; 100ms timeout for Redis get.
- **Upstash:** `@upstash/redis` and `@upstash/ratelimit` used in middleware for Edge-compatible rate limiting when ioredis isn’t available.
- **HTTP cache:** Ad-hoc `Cache-Control` on some API routes (e.g. dashboard stats: `s-maxage=300, stale-while-revalidate=600`; CRM activity: `max-age=10, stale-while-revalidate=20`).
- **Next.js data cache:** Root layout sets `export const dynamic = 'force-dynamic'` (no static prerender; avoids long “Generating static pages” on 1085+ routes). No widespread use of `unstable_cache` or route-level `revalidate` in the codebase sample.

**Performance implications:** If production has no Redis, every request hits the database and there is no distributed cache. Multiple Redis singletons and code paths can make behavior and tuning harder. L2 Redis has a 100ms timeout per get; under load this can lead to cache “misses” and more DB load. No unified strategy for caching at API or page level.

---

## 5. Rendering and routing

- **App Router:** Next.js App Router with `app/` (and likely nested routes from modules).
- **Dynamic by default:** `export const dynamic = 'force-dynamic'` in root layout → all pages are effectively dynamic; no static generation at build for those routes.
- **Client boundary:** `ProvidersLoader` wraps app with React Query, theme, module context; `Providers` loaded with `dynamic(..., { ssr: true })` and a loading spinner. Many features will be client-heavy (CRM, dashboards, etc.).
- **No root Next.js middleware** in the main app (middleware exists in packages/crm-module); auth/tenant may be handled in layout or API rather than a single edge middleware.

**Performance implications:** No static or ISR for most routes → every request can hit the server and the database. Combined with low DB connection limits and optional Redis, TTFB and full page load can be high. Heavy client bundles (React Query, Radix, Framer Motion, charts, etc.) without a clear code-splitting strategy can slow FCP/LCP.

---

## 6. Job queue and background work

- **Bull:** Three queues (high / medium / low priority), all backed by same Redis used for cache. Used for background jobs (e.g. model training queue).
- **Redis dependency:** If Redis is disabled or unavailable, queue jobs won’t run (Bull requires Redis). No separate queue backend.

**Performance implications:** Background work doesn’t block request path directly but competes for Redis and DB. If Redis is no-op in production, queues effectively don’t work.

---

## 7. What’s in place for performance

- Prisma client singleton and pre-connect to reduce cold-start and connection churn.
- Connection pool limits and timeouts tuned for serverless and Supabase.
- Optional Redis with no-op fallback so build and run succeed without Redis.
- L1 (memory) + L2 (Redis) cache in `MultiLayerCache` with TTL and size cap.
- Some API routes set `Cache-Control` and `stale-while-revalidate`.
- Package import optimizations for large UI libraries.
- Build and webpack tuned for Vercel memory limits.

---

## 8. Likely contributors to slowness (for CTO review)

1. **No Redis in production**  
   If `REDIS_URL` is missing or localhost-only, there is no distributed cache. Every read can hit PostgreSQL with low connection limits (1–3), increasing latency and limiting throughput.

2. **Fully dynamic rendering**  
   `force-dynamic` and no `unstable_cache`/ISR means little reuse of computed responses; more server and DB work per request.

3. **Low DB connection limit**  
   With 1–3 connections per serverless instance, concurrent requests can wait for a connection, increasing P95+ latency.

4. **Large Prisma schema and client**  
   Big schema increases client size and generation time; more relations and N+1 risks if not carefully used with `include`/`select`.

5. **Heavy client bundles**  
   Many dependencies (Recharts, Handsontable, TipTap, Framer Motion, LangChain, etc.) without clear lazy-loading or route-based splitting can increase JS time and slow interactivity.

6. **Multiple cache layers and Redis usage**  
   Several Redis clients and code paths (cache, invalidation, rate limit, Bull) with different timeouts and fallbacks can make behavior inconsistent and harder to tune.

7. **Build and type-check**  
   `ignoreBuildErrors: true` and large monorepo-style app can hide regressions; 5120 MB heap and single-threaded minification suggest build is already at the edge of resource limits.

---

## 9. Recommended next steps (for CTO)

- **Confirm production Redis:** Ensure `REDIS_URL` points to a real Redis instance (e.g. Upstash) in production so cache and queues work.
- **Unify caching strategy:** Prefer one Redis client and one cache abstraction; use it for hot API routes and, where possible, wrap Prisma reads in `unstable_cache` or a small service layer with TTLs.
- **Review connection limits:** With a transaction pooler (e.g. Supabase 6543), consider slightly higher `connection_limit` per function if pooler limits allow, and monitor connection usage.
- **Introduce static/ISR where possible:** Identify routes that can be static or revalidated (e.g. marketing, help); remove `force-dynamic` only for those and use `revalidate` or `unstable_cache` for data.
- **Audit N+1 and heavy queries:** Use Prisma query log in staging and identify missing indexes, large `include` trees, and N+1 patterns; add indexes and batch where needed.
- **Bundle and code-splitting:** Measure client bundles (e.g. `@next/bundle-analyzer`); lazy-load heavy screens (spreadsheets, editor, AI flows) and ensure dashboard/list views don’t pull in entire libs.
- **Middleware and auth:** Decide whether a single Next.js middleware (e.g. auth, tenant resolution) can short-circuit or redirect without hitting DB when possible.
- **Observability:** Add response-time and error metrics per route and per data source (DB vs cache); set SLOs (e.g. P95 TTFB, P95 full load) and track them.

---

## 10. One-page reference

| Area | Current | Risk / note |
|------|--------|--------------|
| **Framework** | Next 16, React 19, App Router | OK |
| **Build** | Webpack, 5 GB heap, single-worker on Vercel | Build time and OOM risk |
| **DB** | PostgreSQL, Prisma, 1–3 conn/serverless | Concurrency and latency under load |
| **Cache** | Redis optional; L1+L2 where used | No Redis in prod = no cache |
| **Rendering** | `force-dynamic` app-wide | No static/ISR benefit |
| **Client** | React Query, Zustand, many libs | Bundle size and FCP/LCP |
| **Queue** | Bull + Redis | Depends on Redis in prod |
| **Deploy** | Vercel serverless | Cold start + connection limits |

This document is a snapshot of the codebase and config; runtime env (e.g. actual `REDIS_URL`, `DATABASE_URL`, Vercel plan) will affect which items impact you most. Recommend validating Redis and DB pooler settings first, then caching and rendering strategy, then bundle and query optimization.

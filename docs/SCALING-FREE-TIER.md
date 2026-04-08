# PayAid V3 – Free, Self-Hosted Scaling (Zoho-like Speed)

No paid APIs or subscriptions. Focus: local Dockerized Redis/Postgres, Supabase pooling, profiling, and RSC to hit Zoho-like speed for CRM/media loads.

---

## 1. Frontend (Next.js)

- **React Server Components (RSC):** Render static parts server-side; slash JS bundles 50%+. Keep heavy components (charts, AI panels) as `'use client'` with dynamic imports so they load on demand.
- **Middleware:** Detect mobile and serve lighter payloads if needed.
- **Deploy:** Vercel/Netlify free tiers or self-host with Docker/Nginx on a VPS.

Example pattern (dashboard page):

```tsx
// Server component: data from DB
async function Dashboard({ tenantId }: { tenantId: string }) {
  const data = await getDashboardData(tenantId)
  return (
    <div>
      <Stats data={data} />
      <ChartClient />  {/* 'use client' + dynamic import */}
    </div>
  )
}
```

---

## 2. Database (Supabase / Postgres)

- **Connection pooling:** Use **Supavisor** (Supabase pooler) on **port 6543** for **transaction mode** so 500+ users can share 10–60 connections. Set `DATABASE_URL` to the pooler URL (e.g. `...pooler.supabase.com:6543/...`).
- **Profile slow queries:** Run `EXPLAIN (ANALYZE, BUFFERS) SELECT ...` in Supabase SQL editor; add indexes (e.g. `CREATE INDEX ON crm_leads (tenant_id, status);`). Use `scripts/explain-analyze-queries.sql` for top CRM queries.
- **Multi-tenant:** All tables use `tenant_id`; always filter `WHERE tenant_id = $1`. For horizontal sharding later, consider Citus (free Postgres extension).
- **Self-host Postgres (Docker):**

  ```bash
  docker run -d --name payaid-db -p 5432:5432 -e POSTGRES_DB=payaid postgres:16
  ```

  Or use `docker compose -f docker-compose.local-db.yml up -d postgres` (port 5433).

---

## 3. Caching (Redis)

- **Self-host Redis:** No Upstash fees. Use for sessions and CRM/dashboard caches (target >90% hit rate).

  ```bash
  docker run -d --name redis -p 6379:6379 redis:alpine
  ```

  Or: `docker compose -f docker-compose.local-db.yml up -d redis`

- **App:** Set `REDIS_URL=redis://localhost:6379`. The app uses `lib/cache/redis.ts`: home summary and CRM dashboard summary are cached with 5 min TTL. Evict on writes via `cacheEvictByPrefix('payaid:crm:')` or `cacheEvictByPrefix('payaid:home:')`.

---

## 4. Async Jobs (N8N)

- **Self-host N8N in Docker:** Free, unlimited workflows (HR/fintech batches, Supabase triggers → process payments → cache update).

  ```bash
  docker compose -f docker-compose.local-db.yml up -d n8n
  ```

  N8N UI: http://localhost:5678 (default credentials in compose env).

- **Queues:** Optionally use Postgres `pg_cron` for scheduled jobs (free).

---

## 5. Container Stack

- **Local multi-service:** `docker compose -f docker-compose.local-db.yml up -d` runs Postgres, Redis, N8N (and optional OnlyOffice).
- **Scale on one machine:** Docker Swarm (free K8s alternative): `docker swarm init` then `docker stack deploy -c docker-compose.local-db.yml payaid`. Add replicas for the app service when you add a Next.js container.
- **Monitoring:** Run Prometheus + Grafana in Docker for free.

---

## 6. Quick Wins Checklist

1. **Profile:** Run `EXPLAIN ANALYZE` on top 5 slow CRM queries; add indexes. See `scripts/explain-analyze-queries.sql`.
2. **Cache:** Ensure Redis is running and `REDIS_URL` is set; aim >90% hit rate on dashboard/summary.
3. **RSC:** Convert heavy pages to server-first; use dynamic import for charts/AI; measure TTI.
4. **Pool:** Use Supavisor (port 6543); limit connections app-side (already in `lib/db/prisma.ts`).
5. **Deploy:** Docker Compose → Swarm for replicas; test with `ab -n 1000 -c 50 <url>` (Apache Bench).

---

## 7. Cache Eviction (Redis)

When deals, contacts, or home-relevant data change, invalidate so the next request gets fresh data:

- **CRM writes (deals, contacts):** Call `cacheEvictByPrefix(CACHE_KEYS.prefix.crm)` (or `cacheDel(CACHE_KEYS.crmDashboardSummary(tenantId))`).
- **Home summary:** Call `cacheEvictByPrefix(CACHE_KEYS.prefix.home)` or `cacheDel(CACHE_KEYS.homeSummary(tenantId))`.

Import from `@/lib/cache/redis` in the API route or server action that performs the write.

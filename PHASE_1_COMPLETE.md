# Phase 1 – Infra/Env (Prod-Ready) – Complete

## Summary

Phase 1 implements production-ready environment and Redis consolidation so demos and prod no longer hang on localhost Redis/AI.

---

## 1. Environment

- **`.env.example`**  
  - Documents required vars: `DATABASE_URL`, `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `JWT_SECRET`, `NEXTAUTH_SECRET`.  
  - Production: REDIS = Upstash (no localhost); AI vars unset or cloud-only; `USE_AI_GATEWAY=false` in prod.  
  - Optional: `ACCELERATE_URL` for Prisma Accelerate.

- **`lib/config/env.ts`**  
  - **`validateEnv()`** – Validates `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`; in prod also checks Redis (Upstash REST or non-localhost `REDIS_URL`). Logs missing vars; does not throw in dev.  
  - **`getRedisConfig()`** – Returns `{ url, upstashRestUrl, upstashRestToken, cacheAvailable, tcpAvailable }`. Production must not use localhost for TCP.  
  - **`getAIConfig()`** – Returns AI/Gateway URLs and `hasCloudEndpoint`.  
  - **`checkRedisHealth()`** – Delegates to singleton health check.

- **Startup**  
  - `instrumentation.ts` calls `validateEnv()` on Node server start.

---

## 2. Single Redis (Cache)

- **`lib/redis/singleton.ts`**  
  - **Single cache client**: uses `@upstash/redis` when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.  
  - Otherwise returns a **no-op** client (get/set/del/keys/exists no-ops).  
  - Exposes **`getRedisSingleton()`** and **`cache`** (get/set/delete/deletePattern/exists) for backward compatibility.  
  - **`checkRedisHealth()`** – Set/get a key to verify cache.

- **Consumers migrated to singleton**  
  - **`lib/redis/client.ts`** – Re-exports `cache` from singleton; **`getRedisClient()`** kept for **Bull** and legacy callers (events, monitoring, health). Uses **`getRedisConfig().url`** (no localhost default in prod).  
  - **`lib/queue/bull.ts`** – Uses **`getRedisConfig().url`** for queue Redis (ioredis/TCP).  
  - **`lib/cache/invalidation.ts`** – Uses **`getRedisSingleton()`** for tag invalidation and get/set/deleteCache.  
  - **`lib/performance/database-optimization.ts`** – Uses **`getRedisSingleton()`** for getCached/setCached/invalidateCache.  
  - **`lib/cache/multi-layer.ts`** – L2 uses **`getRedisSingleton()`** and **`RedisLike`**.

---

## 3. Prisma Accelerate

- **`lib/db/extended.ts`**  
  - When **`DATABASE_URL`** starts with `prisma://` or **`ACCELERATE_URL`** is set: builds a Prisma client with **`@prisma/extension-accelerate`** and exports **`prismaExtended`**.  
  - Otherwise exports the same **`prisma`** singleton.  
  - Use **`prismaExtended`** for read-heavy paths and optional **`cacheStrategy: { ttl, swr }`**.

- **`.env.example`**  
  - Documents optional **`ACCELERATE_URL`**.

---

## 4. Validation Table (from prompt)

| Fix | Audit issue | Impact |
|-----|-------------|--------|
| Single Redis (cache) | 4 clients / localhost | One Upstash REST cache path; no-op in dev; prod must set Upstash. |
| Central config | No env validation | `validateEnv()` at startup; `getRedisConfig()` / `getAIConfig()` typed. |
| Bull / ioredis | Separate localhost default | Bull uses `getRedisConfig().url`; prod must use non-localhost (e.g. Upstash TCP). |
| Prisma Accelerate | Not used | Optional `prismaExtended` for pool + cache when Accelerate URL set. |

---

## 5. What to do next

- **Production / Vercel**  
  - Set **`UPSTASH_REDIS_REST_URL`** and **`UPSTASH_REDIS_REST_TOKEN`** (Upstash console).  
  - For Bull: set **`REDIS_URL`** to Upstash TCP URL (same DB).  
  - Leave **`AI_GATEWAY_URL`** / **`USE_AI_GATEWAY`** unset or false in prod so TTS/STT degrade to text.

- **Phase 2**  
  - Introduce Turborepo and move apps (dashboard, crm, hr, voice) and packages (db, ui, core, ai).

---

**Commit:** `phase-1-infra`

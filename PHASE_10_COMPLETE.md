# Phase 10 – Production Polish (Zoho-class) – Complete

## Summary

Phase 10 adds observability hooks, CI/CD for the CRM app, edge middleware for tenant resolution, feature flags in core, and README benchmarks. No critical deps added; optional OpenTelemetry and Vercel/Sentry documented.

---

## 1. Observability

- **lib/telemetry.ts**
  - **startSpan(name, attributes, fn)** – runs `fn` with an optional OpenTelemetry span. No-op when `@opentelemetry/api` is not installed.
  - **withPrismaSpan**, **withRedisSpan**, **withAPISpan** – wrappers for Prisma, Redis, and API handlers.
  - Optional: `npm i @opentelemetry/api @vercel/otel` and register in `instrumentation.ts` for full traces.
- **README** – Vercel Speed Insights (P95 TTFB &lt;500ms) and Sentry frontend recommended.

---

## 2. CI/CD

- **.github/workflows/crm.yml**
  - **validate:** prisma validate, turbo lint (crm, hr, voice, dashboard).
  - **build-crm:** prisma generate, turbo build --filter=crm (with DATABASE_URL or placeholder).
  - **deploy-preview:** on push to main, optional `vercel --prod --cwd apps/crm` when `VERCEL_TOKEN` is set.
  - Playwright job left commented (enable when DB and secrets are configured in repo).

---

## 3. Edge middleware (no DB)

- **apps/crm/middleware.ts** – Matcher `/crm/:path*`. Extracts tenant slug from `/crm/[tenantSlug]/...` and sets **x-tenant-slug** header.
- **apps/hr/middleware.ts** – Same for `/hr/:path*`.
- **apps/voice/middleware.ts** – Same for `/voice-agents/:path*`.
- **apps/dashboard/middleware.ts** – Same for `/dashboard/:path*`.

Auth remains in API/layout; middleware only sets tenant from path for &lt;50ms resolution.

---

## 4. Feature flags

- **packages/core/src/flags.ts**
  - **getFeatureFlags()** – from env **FEATURE_FLAGS** (JSON) or defaults (crm, hr, voice_agents, ai_studio, dashboard = true).
  - **isFeatureEnabled(flag)** – e.g. `isFeatureEnabled('voice_agents')` for conditional render.
  - **resetFeatureFlags()** – for tests.
- **packages/core/src/index.ts** – Re-exports flags.

Use in ModuleProvider or layout: `if (!isFeatureEnabled('voice_agents')) return null` to turn off Voice for risky demos.

---

## 5. README

- **World-class quick reference** table: dev:parallel, demo, deploy, metrics.
- **Benchmarks & metrics** table: P95 TTFB, bundle gzip, N+1, TTS, health.

---

## Validation checklist

- [ ] `npm run demo` → green (health + flows when Playwright and env are set).
- [ ] Vercel CRM live: P95 &lt;500ms (Speed Insights).
- [ ] `turbo dev --parallel` → CRM/HR/Voice/Dashboard no interference.
- [ ] TTS fallback: `GET /api/tts?text=test` → audio or `{ text, fallback: true }`.

---

**Commit:** `phase-10-polish`

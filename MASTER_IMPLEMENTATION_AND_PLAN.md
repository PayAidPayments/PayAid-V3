## PayAid V3 – Master Implementation & Rebuild Plan

**Purpose:** Snapshot of what is implemented today vs. what was planned, so you can safely erase and rebuild the platform from scratch while knowing exactly what to recreate (and what to improve).

This document aggregates:

- `PHASE_0_AUDIT.md`, `PHASE_1_COMPLETE.md`, `PHASE_2_COMPLETE.md`, `PHASE_3_COMPLETE.md`, `PHASE_4_COMPLETE.md`, `PHASE_5_COMPLETE.md`
- `PLATFORM_ARCHITECTURE_CTO.md`, `GO-LIVE-CHECKLIST.md`, `PHASE_11_INDIA_SMB.md`
- Bundle / query / N+1 notes (`BUNDLE_AND_QUERIES_CHECK.md`)

---

## 1. High-Level Architecture Snapshot (Today)

### 1.1 Stack

- **Framework**: Next.js App Router (v16 in CTO doc) with React 19; multiple apps under Turborepo (`apps/*`) plus legacy root monolith.
- **Language**: TypeScript 5.x.
- **Database**: PostgreSQL (Supabase or self-hosted) via Prisma ORM; very large single schema (100+ models, ~9000 lines).
- **Caching**:
  - Upstash Redis (REST + optional TCP) via a **single Redis singleton** and cache abstraction.
  - In-memory L1 cache for hot paths (`MultiLayerCache`), with Redis as L2 when available.
- **Job queue**: Bull (Redis-backed) with high / medium / low priority queues.
- **Client state**: React Query 5 + Zustand for auth/module state and data fetching.
- **Hosting**: Designed for Vercel serverless (memory-tuned build, connection limits, optional Redis).
- **AI & external services**: LangChain, OpenAI, Groq, Ollama, TTS/STT providers, WhatsApp (Baileys), payment gateways (PayAid, Razorpay, planned Stripe), ONLYOFFICE.

### 1.2 Monorepo / Apps Layout (Post-Phase 2–4)

- **Root (legacy, still present)**:
  - `app/`: original single App Router app with all modules (CRM, HR, Finance, Sales, Marketing, Inventory, Voice, Projects, Productivity, Settings, Admin, etc.).
  - `lib/`: shared server/client code (db, redis, queue, cache, ai, auth, hr, crm, finance, voice-agent, jobs, middleware, modules, etc.).
  - `prisma/`: original Prisma schema and migrations (now mirrored into `packages/db`).
  - `components/`: shared UI – layout, module sidebars/topbars, shared components.
  - `contexts/`: React contexts (e.g. `ModuleContext`).

- **Turborepo (Phase 2)**:
  - `turbo.json` with `build`, `dev`, `lint`, `db:generate` pipelines.
  - Root `package.json` with workspaces: `apps/*`, `packages/*` and scripts: `dev:crm`, `dev:hr`, `dev:voice`, `dev:dashboard`.

- **Apps (all migrated by Phase 4)**:
  - `apps/dashboard` (port 3000): Dashboard shell + module home pages.
  - `apps/crm` (port 3001): CRM app and CRM API.
  - `apps/hr` (port 3002): HR app and HR API.
  - `apps/voice` (port 3003): Voice agents, AI-related routes, and corresponding APIs.
  - All apps share:
    - `@/*` TypeScript and webpack alias back to repo root (`../../*`), so they reuse existing `@/lib`, `@/components`, etc.
    - Optimized imports via `optimizePackageImports` (Radix, lucide, framer-motion, recharts, spreadsheet/editor libs, etc.).

- **Packages**:
  - `packages/db` (**implemented**):
    - Prisma schema copied from root; provides `prisma` and `prismaExtended` (Prisma Accelerate) via `src/client.ts`, `src/extended.ts`, `src/index.ts`.
  - `packages/core` (**partially implemented**):
    - `moduleRegistry` moved here and re-exported (`MODULE_REGISTRY`, helpers + types).
    - Still to be moved: auth, tenant resolution, stores, more module logic.
  - `packages/ui` (**stub / planned**):
    - Placeholder for shared layout and UI components (sidebars, header, cards, etc.).
  - `packages/ai` (**stub / early**):
    - Contains a defensive `tts()` stub that throws “TTS not configured: use text mode.”
    - Actual voice/AI chains still live under `lib/voice-agent` and `lib/ai` for now.

### 1.3 Key Cross-Cutting Concerns

- **Auth / Tenant / Modules**:
  - Shared auth and tenant resolution via `lib/auth`, `lib/tenant/resolve-tenant`, `lib/middleware/tenant-resolver`.
  - `ModuleProvider` + `lib/modules/moduleRegistry` define enabled modules and routes; used by the dashboard layout to choose sidebars/topbars.

- **Layouts & Shell**:
  - Root `app/layout.tsx` and `app/dashboard/layout.tsx` provide shell, sidebars, topbars, and `ProvidersLoader` (QueryClient, ThemeProvider, ModuleProvider).
  - App copies (CRM, HR, Dashboard, Voice) inherit these layouts under `apps/*`.
  - Root `force-dynamic` has been removed (Phase 3); route-level revalidation is used instead.

- **Performance & Caching**:
  - Introduced `validateEnv()`, `getRedisConfig()`, `getAIConfig()`, `checkRedisHealth()` (Phase 1).
  - Unified Redis singleton and cache abstraction (Upstash first; no-op otherwise).
  - `prismaExtended` for Accelerate-backed read-heavy queries.
  - Select routes (CRM dashboard, HR layout) use ISR and `unstable_cache` + HTTP cache headers.
  - N+1 queries fixed in critical CRM analytics paths with batch `in: ids` + groupBy (Phase 5).
  - Supabase index SQL script exists for Teja to run (`scripts/supabase-indexes-phase5.sql`).

---

## 2. Domain Modules – What Exists Today

These domains are identified and have route trees + lib code in the monolith; some are also wired into separate apps.

- **CRM**:
  - Routes under `app/crm/[tenantId]/...` plus `app/api/crm/...`.
  - Features: Leads, Deals, Contacts, Tasks, Activities, CPQ, agents, AI-based health scores and analytics, segments, dashboard summary API.
  - Full CRM app + CRM API migrated to `apps/crm` (Phase 3).

- **HR**:
  - Routes under `app/hr/[tenantId]/...` plus `app/api/hr/...`.
  - Features: Employees, Payroll, Leave, Attendance, Hiring, Tax, Onboarding, Org charts, HR reporting.
  - HR app + API migrated to `apps/hr` (Phase 4), with ISR-enabled segment layout.

- **Finance**:
  - Routes under `app/finance/[tenantId]/...`.
  - Features: Invoices, accounting, payments, GST, billing, purchase orders, recurring billing, tax handling.
  - Integrated with payment gateways (PayAid, Razorpay; Stripe planned).

- **Sales**:
  - Routes under `app/sales/[tenantId]/...`.
  - Features: Orders and quotes; shares models with CRM and Finance in Prisma.

- **Marketing**:
  - Routes under `app/marketing/[tenantId]/...` for campaigns, sequences, segments, social, AI Influencer, Studio, etc.
  - APIs under `app/api/marketing/*` and `app/api/social/*`.
  - Social Studio / Marketing Studio flows (audience → content/media → channels/schedule → launch) exist in dashboard and standalone social app.

- **Voice / AI**:
  - Routes: `app/voice-agents/[tenantId]/...`, `app/ai-chat/`, `app/ai-cofounder/`, `app/ai-insights/`, `app/ai-studio/`, plus `app/api/ai/*`, `app/api/v1/voice-agents/*`.
  - Libraries: `lib/voice-agent`, `lib/ai`, gateway + TTS/STT integrations.
  - Migrated into `apps/voice` with shared APIs (Phase 4).

- **Projects & Productivity**:
  - `app/projects/[tenantId]/...`: Projects, Tasks, Gantt (with prior N+1 risk on time entries noted).
  - `app/productivity/[tenantId]/...`, `app/spreadsheet/[tenantId]/...`, `app/docs/`, `app/drive/`, `app/meet/`, `app/pdf/`, `app/slides/`.
  - Spreadsheet editor lazy-loaded with `dynamic(..., { ssr: false })` to reduce bundle size (Phase 4).

- **Inventory**:
  - `app/inventory/[tenantId]/...` plus supporting `lib/inventory` code.
  - Migrated into Dashboard app shell (apps/dashboard) as part of module navigation.

- **Settings / Admin**:
  - `app/settings/[tenantId]/...` for profile, tenant, billing, activity, module toggles.
  - `app/admin/` and `app/super-admin/` for tenant/user management.

- **Horizontal / Industry Verticals**:
  - Verticals like agriculture, healthcare, restaurant, etc. via route trees under `app/<vertical>/...` and `lib/verticals`, `lib/industries`.

---

## 3. Phase-by-Phase Status (Infra / Architecture)

### 3.1 Completed Phases (0–5)

- **Phase 0 – Audit (COMPLETE)**:
  - Repo structure, module boundaries, env assumptions, Redis/AI localhost defaults, and coupling documented.
  - Identified: single app, many modules, one Prisma schema, multiple Redis clients, `force-dynamic` root layout.

- **Phase 1 – Infra / Env (COMPLETE)**:
  - `.env.example` documents required and optional env vars (`DATABASE_URL`, `REDIS_URL`, Upstash, JWT, NEXTAUTH, optional `ACCELERATE_URL`).
  - `lib/config/env.ts`:
    - `validateEnv()` runs at startup (via `instrumentation.ts`) to validate core env vars.
    - `getRedisConfig()`, `getAIConfig()`, `checkRedisHealth()` centralize config/health.
  - Redis strategy:
    - Single Redis singleton via `lib/redis/singleton.ts` using Upstash REST when configured, otherwise a no-op client.
    - Legacy Redis usages routed through this singleton or `getRedisConfig()` (Bull, cache invalidation, DB optimization, multi-layer cache).
  - Prisma Accelerate:
    - `lib/db/extended.ts` and `.env.example` support `ACCELERATE_URL`.

- **Phase 2 – Turborepo / Modular Apps (COMPLETE)**:
  - Introduced `turbo.json` + `apps/*` + `packages/*`.
  - Created `packages/db` (Prisma schema + clients).
  - Created stubs for `packages/core`, `packages/ui`, `packages/ai`.
  - Added minimal Next.js apps: `apps/dashboard`, `apps/crm`, `apps/hr`, `apps/voice`, wired to `@payaid/db`.

- **Phase 3 – Migrate CRM & Rendering (COMPLETE)**:
  - Removed `export const dynamic = 'force-dynamic'` from root layout.
  - Added `app/crm/layout.tsx` with `export const revalidate = 60` for CRM.
  - `app/api/crm/dashboard/summary/route.ts`:
    - Uses `unstable_cache` with `revalidate: 30` per tenant.
    - Adds `Cache-Control: s-maxage=300, stale-while-revalidate=600`.
  - Migrated `app/crm/*` and `app/api/crm/*` into `apps/crm/app/...` and copied root shell (layout, providers, globals) into the CRM app.

- **Phase 4 – Migrate HR / Dashboard / Voice + Bundles (COMPLETE)**:
  - Migrated:
    - HR: `app/hr/*`, `app/api/hr/*` into `apps/hr/app/...`, with ISR layout.
    - Dashboard: `app/dashboard/*` into `apps/dashboard/app/dashboard/*`.
    - Voice: `app/voice-agents/*`, `app/api/ai/*`, `app/api/v1/voice-agents/*` into `apps/voice`.
  - All apps use consistent `@/*` alias and `optimizePackageImports` for heavy libraries.
  - Spreadsheet editor (`app/spreadsheet/[tenantId]/Spreadsheets/[id]/page.tsx`) is now dynamically imported, client-only.
  - Shared packages:
    - `@payaid/core`: contains `moduleRegistry` and public helpers/types.
    - `@payaid/ai`: exposes a defensive `tts()` stub; real chain remains in `lib/voice-agent`.

- **Phase 5 – DB / N+1 / prismaExtended / Supabase Indexes (COMPLETE)**:
  - Fixed N+1 in CRM health scores:
    - Added `calculateCustomerHealthScoresBatch(contactIds, tenantId)` and pure `scoreFromComponents`.
    - Single batched fetch for contacts, interactions, invoices, users; group in-memory by contactId.
  - Central DB exports:
    - `lib/db/index.ts` exports `prisma`, `prismaExtended`, `prismaWithRetry`.
    - Recommendation: use `prismaExtended` for read-heavy paths, especially in CRM APIs.
  - Supabase indexes:
    - `scripts/supabase-indexes-phase5.sql` with idempotent `CREATE INDEX IF NOT EXISTS` for `Interaction`, `Invoice`, `Task`, `Contact`, `Deal`.
  - Guidance for Vercel Hobby:
    - Deploy `apps/crm` first with root directory = `apps/crm`, then add other apps as separate Vercel projects later.

### 3.2 Not-Yet-Implemented / Partially Implemented Phases (Planned)

- **Phase 6 – TTS Resilience & AI Health (PLANNED)**:
  - Goal: production-safe TTS/STT/AI gateway behavior, clear feature flags, `/api/health` endpoints per app.
  - Today: multiple TTS/STT paths default to localhost; `@payaid/ai` has only a stub `tts()`.
  - Planned:
    - Central AI gateway config + feature flags (`USE_AI_GATEWAY`, `TEXT_MODE_ONLY`, etc.).
    - Production-safe fallbacks (text-only) when AI services unavailable.
    - Standard health checks for DB, Redis, AI gateway per app.

- **Phase 7 – CI (Build / Lint per App) (PLANNED)**:
  - Goal: Per-app CI that builds and lints `apps/dashboard`, `apps/crm`, `apps/hr`, `apps/voice` independently.
  - Today: no documented CI pipeline; ready to be added on top of Turborepo scripts.

- **Phase 8 – Playwright / e2e (PARTIALLY REFERENCED)**:
  - `GO-LIVE-CHECKLIST.md` mentions:
    - `dev:all`, `test:demo` Playwright flows for demos.
  - Goal: stable e2e demo flows for CRM/HR/dashboard/voice.

- **Phase 9 – Demo / Docs / DX (PLANNED)**:
  - `GO-LIVE-CHECKLIST.md` references:
    - Phase 8–9: Playwright demo flows, `dev:all`, `demo`, `deploy:*` scripts, README Quickstart, benchmarks.
  - Some pieces exist (scripts, analyzer), but full documentation and benchmark publishing are still a work in progress.

- **Phase 10 – Observability / Sentry (PLANNED)**:
  - `PHASE_11_INDIA_SMB.md` references optional Sentry integration (`npx @sentry/nextjs init apps/crm`).
  - Metrics, tracing, and centralized logging not yet standardized.

- **Phase 11 – India SMB / PG / WhatsApp / GST / ONLYOFFICE (PARTIALLY IMPLEMENTED)**:
  - See Section 4 for details; many integrations have libraries and basic wiring but need production-hardening and UX polish.

---

## 4. India SMB & Productivity Integrations (Phase 11)

This phase describes how PayAid should close gaps vs. Zoho/Odoo for Indian SMBs. Parts are implemented; others are planned.

### 4.1 Payment Gateway Suite (PG Switcher)

- **Implemented / Scaffolding**:
  - **PayAid (primary)**:
    - Lib: `lib/payments/payaid.ts` with `createOrder()` and `verifyWebhook()`.
    - API: `POST /api/payments/payaid` (create order), `POST /api/payments/payaid/webhook` (signature verify → Bull job to update invoice).
    - Env: `PAYAID_API_KEY`, `PAYAID_SALT`, `PAYAID_WEBHOOK_SECRET`.
  - **Razorpay (UPI / cards)**:
    - Package: `packages/payments` + `lib/payments/razorpay.ts`.
    - API: `POST /api/payments/razorpay`, `POST /api/payments/razorpay/webhook`.
    - Checkout page: `/checkout/razorpay` with a simple form that calls the API and opens Razorpay Checkout.
    - Env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
  - **Checkout switcher (design)**:
    - `POST /api/checkout?gateway=payaid|razorpay|stripe` with a unified request/response shape (documented in Phase 11).

- **Planned / To Finish**:
  - **Stripe (global)**:
    - Dependencies (`stripe`, `pdf-lib`) are present; Stripe path is “pending” in docs.
    - Need a concrete `/api/checkout?gateway=stripe` and Stripe webhook integration.

### 4.2 WhatsApp CRM Sync / Broadcasts

- **Implemented / Scaffolding**:
  - Libs:
    - `lib/whatsapp/baileys.ts` – session/outbound queue scaffold for Baileys.
    - `lib/whatsapp/crm-sync.ts` – CRM contact sync and activity logging.
  - Queue and worker:
    - `lib/queue/whatsapp-queue.ts` – Bull queue `whatsapp-outbound`.
    - `lib/queue/whatsapp-worker.ts` – processes outbound jobs; ready to wire Baileys `sendMessage`.
  - API:
    - `POST /api/whatsapp/webhook` – inbound webhook, syncs to CRM, optional auto-reply via queue.
  - Env:
    - `WHATSAPP_DEFAULT_TENANT_ID`, `WHATSAPP_AUTO_REPLY_ENABLED`, `WHATSAPP_AUTO_REPLY_TEXT`.
    - Optional: `WHATSAPP_BAILEYS_SESSION_PATH` or `WHATSAPP_BAILEYS_USE_REDIS`.

- **Planned / To Finish**:
  - Production-ready Baileys wiring + reconnect strategy.
  - UX flows inside CRM for broadcast lists, templates, compliance, and reporting.

### 4.3 GST E-Invoicing

- **Implemented / Scaffolding**:
  - Lib: `lib/finance/gst-cleartax.ts` with `generateIRN()` and `queueInvoiceForIRN()`.
  - Design:
    - Invoice create → queue job → IRN API → store `irn` / `ack_no` on invoice.
  - Env: `CLEARTAX_API_KEY` or `GSTN_CLIENT_ID`.

- **Planned / To Finish**:
  - Wiring into Finance invoice flows (toggle per-tenant for e-invoicing).
  - Actual ClearTax / GSTN API integration and error-handling paths.

### 4.4 ONLYOFFICE – Docs/Sheets Collab

- **Implemented / Scaffolding**:
  - Docker: `docker-compose.local-db.yml` includes `onlyoffice` profile; port 8080.
  - Editor route:
    - `app/productivity/[tenantId]/docs/editor/page.tsx` – embeds ONLYOFFICE; uses `?id=<docId>` and is designed to work with storage.
  - Env: `NEXT_PUBLIC_ONLYOFFICE_URL=http://localhost:8080`.

- **Planned / To Finish**:
  - Robust storage integration (likely Supabase storage) and permissioning.
  - Production-ready ONLYOFFICE deployment (vs. local Docker only).

### 4.5 Optional / Future in Phase 11

- **Postiz-style social scheduler**:
  - Idea: campaign scheduler with Bull + Meta/LinkedIn APIs or n8n.
  - Not yet fully implemented.
- **Sentry integration**:
  - Suggested: `npx @sentry/nextjs init apps/crm`.
  - Not yet wired into apps.

---

## 5. Social & Marketing Studio Stack

### 5.1 Dashboard-Integrated Studio (Implemented)

- Flows:
  - Audience & goal → Content & media (text/image generation) → Channels & schedule → Review & launch.
- Routing:
  - Under dashboard marketing routes: `/marketing/[tenantId]/Studio` and related pages for campaign creation, social posting, scheduling, and analytics.
- Behavior:
  - Launch campaign should create `MarketingPost` records and enqueue jobs (social connectors still stubbed).
- Environment:
  - Requires `DATABASE_URL`, `REDIS_URL` for workers, and AI/image envs like `OLLAMA_BASE_URL`, `IMAGE_WORKER_URL` or `TEXT_TO_IMAGE_SERVICE_URL`.

### 5.2 Social Dispatch Worker (Implemented / Needs Production Hardening)

- Command: `npm run worker:social-dispatch`.
- Dependencies:
  - Redis for Bull queues (`REDIS_URL` non-localhost in prod).
  - `packages/social/src/connectors/*` for WhatsApp and social networks (stubs today).
- Behavior:
  - Listens for social dispatch jobs (e.g. from Studio “Send now / schedule”).
  - Sets `MarketingPost.status` to `SENT`; actual posting to networks is stubbed.

### 5.3 Standalone PayAid Social App (Optional)

- App: `apps/social` (port 3005).
- Routes: `/studio`, `/analytics`, `/library`, `/login`, `/signup`.
- Env:
  - `NEXT_PUBLIC_SOCIAL_API_URL=http://localhost:3000` to delegate API to dashboard backend.
- Status:
  - App shell and key pages exist; connectors and deep analytics remain to be fully implemented.

---

## 6. Deploy & Go-Live Posture (Current)

### 6.1 Vercel Setup (Per App)

- Each app (`apps/dashboard`, `apps/crm`, `apps/hr`, `apps/voice`) is intended to be a separate Vercel project:
  - **Root Directory**: set to the app folder (`apps/crm`, etc.).
  - **Include source files outside Root Directory**: must be ON to include `packages/*`.
  - **Env vars**: each project needs `DATABASE_URL`, `REDIS_URL` (Upstash), and app-specific vars (AI, PG, etc.).

- CRM go-live checklist:
  - Turn on “Include source files outside of the Root Directory”.
  - Ensure `DATABASE_URL`, `NEXTAUTH_SECRET`, and related vars are set.
  - Deploy via `npm run deploy:crm`.
  - Test demo tenant dashboard (`/crm/demo-business-pvt-ltd/dashboard`) and measure Lighthouse/TTFB.

### 6.2 Local Dev & Demo

- **Full monorepo dev**:
  - `npm run dev:all` – runs multiple apps on 3000–3003.
- **Single app dev**:
  - `npm run dev:crm`, `npm run dev:hr`, `npm run dev:dashboard`, `npm run dev:voice`, `npm run dev:social`.
- **Demo e2e flows** (where Playwright/e2e is wired):
  - `npm run test:demo` – runs CTO/demo flows (Phase 8–9 docs).

### 6.3 Bundle Analysis & Heavy Dependencies

- `npm run analyze` (with `ANALYZE=true`) uses `@next/bundle-analyzer`.
- Key heavy deps to watch:
  - UI: Radix UI components, `lucide-react`, `framer-motion`, `recharts`, `@handsontable/react-wrapper`, `handsontable`, `x-data-spreadsheet`, `@tiptap/*`, `xlsx`, `dhtmlx-gantt`.
  - AI: `langchain`, `@langchain/*`.
- Some mitigation already in place:
  - `optimizePackageImports` in apps.
  - Dynamic import for spreadsheet editor.

---

## 7. Recommendations for the Rebuild

When you erase and rebuild from scratch, this is the **minimal viable architecture** to recreate, and where you can safely simplify or improve:

### 7.1 Must-Rebuild Foundations (Keep)

- **Monorepo with Turborepo**:
  - `apps/dashboard`, `apps/crm`, `apps/hr`, `apps/voice`, (optionally `apps/social`).
  - `packages/db` with a single Prisma schema and `prismaExtended`.
- **Config & Env Management**:
  - Central `env` module with `validateEnv()`, `getRedisConfig()`, `getAIConfig()`.
- **Single Redis Path**:
  - Upstash-first Redis singleton for cache and queues; no localhost defaults in prod.
- **Prisma & DB**:
  - Single schema, but reconsider model explosion; keep `prismaExtended` and avoid N+1 from day one.
- **Core Domain Modules**:
  - CRM, HR, Finance, Marketing, Inventory, Projects, Productivity, Voice/AI, Settings.
  - Shared `ModuleRegistry` and module-level navigation.

### 7.2 Where to Simplify / Clean Up

- **Package boundaries**:
  - Commit fully to `@payaid/core`, `@payaid/ui`, `@payaid/ai` and avoid cross-app `@/` imports into root.
- **Rendering strategy**:
  - Design ISR/static vs. dynamic from the start (no global `force-dynamic`).
- **AI & TTS**:
  - Start with a single AI gateway abstraction and configurable feature flags; avoid local-only defaults.
- **Queues & Redis**:
  - Clearly separate cache Redis from queue Redis (or share intentionally with config).
- **Observability**:
  - Add Sentry + basic metrics early (latency, error rate, DB/Redis health).

### 7.3 Future Phases to Plan Into the New Architecture

- Phase 6–11 items:
  - Production-safe AI/TTS, `/api/health` endpoints.
  - CI per app + CD scripts.
  - E2E demo flows for CRM/HR/dashboard/voice/social.
  - India SMB polish: PG switcher (PayAid, Razorpay, Stripe), WhatsApp broadcasts, GST e-invoicing, ONLYOFFICE collab, Social Studio + connectors.
  - Observability and Sentry.

---

## 8. Quick “What We Have vs Planned” Table

| Area | Status today | Notes / plan when rebuilding |
|------|--------------|------------------------------|
| Monorepo (Turborepo, apps/*, packages/*) | **Implemented** | Keep; consider stricter boundaries (`@payaid/core`, `@payaid/ui`, `@payaid/ai` only). |
| Env & config (`validateEnv`, Redis/AI config) | **Implemented** | Keep; ensure all new services go through central config. |
| Single Redis (Upstash, no-op fallback) | **Implemented** | Keep; explicitly configure prod Redis; consider separate cache vs. queue instances. |
| Prisma schema + `packages/db` | **Implemented** | Keep; revisit schema complexity and indexes; use `prismaExtended` for reads. |
| CRM app & API | **Implemented & migrated** | Keep domain model; rewrite UI/UX as needed. |
| HR app & API | **Implemented & migrated** | Same as CRM. |
| Dashboard app | **Implemented & migrated** | Keep unified shell and module navigation. |
| Voice/AI app & API | **Implemented & migrated** | Keep core concepts; redesign TTS/STT and AI gateway. |
| Social / Marketing Studio | **Implemented (core), connectors stubbed** | Keep flows; harden connectors and analytics. |
| Payment gateways (PayAid, Razorpay) | **Implemented** | Keep; add Stripe; standardize checkout switcher. |
| WhatsApp CRM sync | **Scaffolded** | Wire Baileys + UX; treat as first-class engagement channel. |
| GST e-invoicing | **Scaffolded** | Wire ClearTax/GSTN; toggle per-tenant. |
| ONLYOFFICE | **Scaffolded (local)** | Decide on production deployment + multi-tenant storage. |
| N+1 & DB indexes | **Partially addressed (CRM health, Supabase script)** | Run full audit in new design; integrate indexes into migrations. |
| CI & e2e | **Partially present** | Set up robust CI and Playwright e2e from the start. |
| Observability (Sentry, metrics) | **Not yet standard** | Make this first-class in the new platform. |

---

This file is the **single source of truth** for what existed in PayAid V3 before you wipe and rebuild. When starting fresh, use Sections 1–3 to reconstruct architecture and modules, and Sections 4–8 as your feature + infra roadmap.


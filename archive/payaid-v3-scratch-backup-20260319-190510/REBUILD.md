# PayAid V3 Rebuild – Audit-Preserved + Zoho Speed/RBAC

**We work in this folder (`payaid-v3-scratch`)** for the new from-scratch project. The parent repo (PayAid V3) is the old build; all new work lives here.

This doc maps **salvage vs enhance** from Phase 0–5 into the localhost-first platform. Nothing from the audit is dropped; all preserved and enhanced (faster, RBAC, India SMB).

## Phase 0–2 (applied in scratch)

- **Docker**: `docker compose up -d` (db, redis, n8n, ollama). Optional: `pnpm up-ai` for Chroma + OpenWebUI (profile ai).
- **Prisma** (`packages/db`): Tenant has `defaultCurrency`, `supportedCurrencies`, `defaultLocale`, `supportedLocales`. New models: **EmbeddingDocument** (RAG), **AiJob** (long-running AI), **ModelConfig** (per-tenant pipeline model).
- **Scripts**: `pnpm up-core` (db, redis, n8n), `pnpm up-ai` (+ ollama, chroma, openwebui), `pnpm docker:down`.

## Salvage vs Enhance

| Component | Old Status (Phase 2–4) | New Build |
|-----------|------------------------|-----------|
| **Turborepo apps** | crm/hr/dashboard/voice | Same structure; web = unified (crm/hr/marketing/whatsapp/payroll/ai/super); RSC + Redis everywhere |
| **Prisma/DB** | Single schema, indexes | All audit models kept; `tenantId` on every tenant-scoped model; Role + permissions on User |
| **Redis/Cache** | Singleton Upstash/no-op | Docker Redis, EX 60s default; L1 hot paths |
| **Auth/Modules** | lib/auth + ModuleRegistry | RBAC: SuperAdmin / BusinessAdmin / Staff; `tenant.modules[]` |
| **CRM/HR** | Full APIs/UI | Zoho widgets, kanban, bulk AI score; HR payroll/PF scaffold |
| **Payments** | PayAid/Razorpay webhooks | Switcher: `/api/payments/payaid`, `/api/payments/razorpay` + webhooks |
| **WhatsApp** | Baileys queue scaffold | WATI inbox/broadcasts; `WhatsAppSession` model; queue via Redis |
| **Marketing** | Studio flows | Canva drag-drop + Ollama animate (scaffold in suite) |
| **Voice/AI** | lib/voice-agent chains | Ollama-first; `/api/ai/bulk-score`, resilience fallbacks |
| **GST/ONLYOFFICE** | Scaffolds | `GstIrnQueue` + `lib/gst/irnQueue` cron; ONLYOFFICE embed at localhost:8080 |

## Prisma – Audit Models (All Preserved)

- **Tenant**, **User** (role: SUPERADMIN | ADMIN | STAFF, permissions[]), **Session**, **CrmLead**
- **Employee** (HR/payroll, PF)
- **Invoice** (number, gstIn, irn for e-invoice)
- **PaymentRecord** (provider: payaid | razorpay)
- **MarketingPost** (channel, scheduledAt)
- **WhatsAppSession** (WATI/Baileys queue)
- **GstIrnQueue** (IRN cron)

Run: `pnpm db:push` after schema changes.

## Docker Stack

```bash
docker compose up -d
```

| Service | Port | Purpose |
|---------|------|---------|
| db | 5432 | Postgres (payaid/payaid_secret) |
| redis | 6379 | Cache EX 60s |
| n8n | 5678 | Workflows |
| ollama | 11434 | AI (llama3.2) |
| onlyoffice | 8080 | Document editor embed |

**Baileys**: run via Node (e.g. `pnpm run whatsapp:worker`); queue uses Redis. No container.

## Dev Command

```bash
pnpm install
pnpm db:push
pnpm dev:web
```

Then:

- **localhost:3001** → redirects to `/suite`
- **localhost:3001/suite** → module grid (CRM, HR, Marketing, WhatsApp, Payroll, AI)
- **localhost:3001/crm** → Zoho-style CRM (dashboard, leads, bulk AI)
- **localhost:3001/super** → SuperAdmin (tenants, users) – use `SUPERADMIN_EMAIL`
- **localhost:3001/docs/editor** → ONLYOFFICE embed (ensure onlyoffice container is up)

## Load test / TTFB

- **Dev server** (`pnpm dev:web`): `pnpm loadtest` hits `/api/health`. Expect **~1–6s latency** (dev mode compiles on demand, single process). No errors = healthy.
- **Production** (for **&lt;300ms TTFB**): From repo root (`payaid-v3-scratch`):
  ```bash
  pnpm build:web
  pnpm start:web
  # In another terminal (same repo root):
  pnpm loadtest
  ```
  Or run `pnpm loadtest:prod` for a reminder.

## Preserved Features

- **Payments**: `POST /api/payments/payaid`, `POST /api/payments/razorpay`; webhooks at `.../webhook`.
- **GST**: `lib/gst/irnQueue.ts` – cron processes `GstIrnQueue` (IRN API integration TODO).
- **ONLYOFFICE**: `/docs/editor` embeds Document Server; set `ONLYOFFICE_URL` if not localhost:8080.

## Commit

Suggested: `git add . && git commit -m "v3-rebuild-audit-preserved"`

# PayAid V3 – Implementation Status (Step-by-Step)

**Reference:** [DUAL-FORK-PAYAID-STRATEGY.md](./DUAL-FORK-PAYAID-STRATEGY.md), [MIGRATION-REPLACE-SCRATCH-WITH-FORKS.md](./MIGRATION-REPLACE-SCRATCH-WITH-FORKS.md), [SALES-STUDIO-FRAPPE-PLAN.md](./SALES-STUDIO-FRAPPE-PLAN.md), [MAUTIC-MARKETING-PLAN.md](./MAUTIC-MARKETING-PLAN.md), [SALES-STUDIO-NO-CRM-CONFUSION.md](./SALES-STUDIO-NO-CRM-CONFUSION.md), [SALES-STUDIO-REBRAND-FRAPPE.md](./SALES-STUDIO-REBRAND-FRAPPE.md) (Cursor-proof + rebrand: CRM = Espo, Sales Studio = Frappe, Marketing = Mautic).

---

## ✅ COMPLETED (What Exists Today)

### 1. Monorepo & shell
- **pnpm workspace** with `apps/*`, `packages/*`; Turbo for build/dev.
- **apps/web** (port 3001): Main shell – landing, login, suite launcher, **/crm**, **/sales-studio**, **/finance** (iframe proxy to Espo, Frappe, Bigcapital).
- **apps/payaid-crm** (port 3003), **apps/payaid-finance** (port 3004): placeholders for forked CRM/Finance.
- **apps/suite**, **apps/marketplace** present. (Standalone **apps/crm** removed – CRM is fork-only.)

### 2. Multi-tenant data layer
- **packages/db**: Prisma schema with:
  - **Tenant** model (id, slug, name, modules, defaultCurrency, etc.).
  - **tenantId** on all tenant-scoped entities: User, CrmLead, CrmAccount, CrmContact, CrmPipeline, CrmDeal, CrmProduct, CrmOrder, CrmActivity, LeadScoringRule, Invoice, PaymentRecord, WhatsAppSession, GstIrnQueue, AiJob, etc.
  - Indexes on `tenantId` and composite (e.g. `tenantId + status`) for speed.
- **db:push** and **db:generate** wired; root `pnpm db:push` runs against `@payaid/db`.

### 3. CRM and Sales Studio in shell (fork-only, alongside)
- **CRM (Espo):** iframe proxy at `/crm` and `/crm/[slug]/…` → `PAYAID_CRM_URL` (localhost:3003). Records, leads, contacts, deals.
- **Sales Studio (Frappe):** iframe proxy at `/sales-studio` and `/sales-studio/[slug]/…` → `PAYAID_SALES_STUDIO_URL` (crm.localhost:8000). Pipelines, sequences, forecasting.
- **Marketing (Mautic):** iframe proxy at `/marketing` and `/marketing/[slug]/…` → `PAYAID_MARKETING_URL` (localhost:8001). Campaigns, email, segments. See [MAUTIC-MARKETING-PLAN.md](./MAUTIC-MARKETING-PLAN.md).
- Tenant resolution: `?tenantId=`, then session, then fallback (e.g. `"demo"`); passed as `?tenant=&slug=#/path`. Scratch CRM UI and **apps/crm** removed.

### 4. Module switcher & nav
- **MODULES** in `apps/web/lib/modules.ts`: **CRM** | **Sales Studio** | **Finance** | **Marketing** | HR, WhatsApp, Payroll, AI Studio, Docs.
- Redirects: `/crm` → `/crm/[slug]/dashboard`, `/sales-studio` → `/sales-studio/[slug]/dashboard`, `/finance` → `/finance/[slug]/dashboard`, `/marketing` → `/marketing/[slug]/dashboard`.

### 5. WhatsApp & GST (scaffolding only)
- **WhatsApp:**  
  - `apps/web/app/whatsapp/page.tsx` (page).  
  - (API stub for WhatsApp activity was in removed apps/crm; can be re-added under apps/web/api if needed.)
- **GST:**  
  - `apps/web/lib/gst/irnQueue.ts`.  
  - **GstIrnQueue** and **WhatsAppSession** in Prisma schema.  
- No full WhatsApp (Baileys) or GST e-invoice API integration yet.

### 6. EspoCRM Docker (optional, outside apps/)
- **payaid-crm** at repo root: EspoCRM **Docker** setup (from espocrm-docker) – PHP/Apache, docker-compose.
- Runs as separate stack (e.g. 8090). Shell CRM is **apps/payaid-crm** (placeholder or fork) via iframe.

### 7. Auth & tenants
- Session-based auth; tenant from session/query.
- **apps/web/app/api/tenants/route.ts** (tenant creation/list).
- Super admin / tenant users and roles in schema.

---

## ❌ PENDING (Dual-Fork Plan – Not Done)

### Step 1: Backup & wipe scratch CRM/Finance (Day 1) ✅ done
- [x] Scratch CRM removed from **apps/web** and **apps/crm** app deleted. CRM in shell is fork-only (iframe to payaid-crm).

### Step 2: Fork CRM & Finance into apps/ (Day 1) ✅ done
- [x] **apps/payaid-crm**: EspoCRM **source** cloned from `espocrm/espocrm`; added `package.json` (workspace) and `docker-compose.yml` (port 3003, mount source).
- [x] **apps/payaid-finance**: Bigcapital cloned from `bigcapitalhq/bigcapital` (full monorepo; Lerna, pnpm).
- [ ] **Install & run:** See [STEP2-RUN-FORKS.md](./STEP2-RUN-FORKS.md). CRM: `cd apps/payaid-crm && docker compose up -d`. Finance: `cd apps/payaid-finance && pnpm install`, copy `.env`, `docker compose up -d`, `pnpm run build:server`, migrate, then `dev:server` + `dev:webapp` (port 3004).

### Step 3: Supabase + multi-tenant for forks (Day 2) ✅ done
- [x] **Shared schema:** Tenant + tenantId on tables – **done** in **packages/db**.
- [x] **RLS:** Migration added in **supabase/migrations/20250315000000_add_rls_tenant_isolation.sql** – run in Supabase SQL Editor or `supabase migration up`. Policies use JWT claim `tenant_id`; see [STEP3-SUPABASE-RLS.md](./STEP3-SUPABASE-RLS.md).
- [x] **Alignment:** Shell + packages/db = single source of truth; forks (EspoCRM, Bigcapital) keep own DBs, receive tenant via iframe URL; doc explains when RLS applies (Supabase client) vs app-level tenant filter (Prisma).
- [ ] **Redis:** Optional – set `REDIS_URL` in shell for session/cache (see STEP3-SUPABASE-RLS.md).

### Step 4: Unified shell with proxy to forks (Day 3) ✅ done
- [x] **Catch-all proxy** in **apps/web**: `/crm/[slug]/[[...rest]]` and `/finance/[slug]/[[...rest]]` → iframe to **PAYAID_CRM_URL** / **PAYAID_FINANCE_URL**.
- [x] Tenant passed as `?tenant=&slug=#/path` to forked apps.

### Step 5: Rebrand (Day 4 – in progress)
- [x] EspoCRM → PayAid CRM (text + logo) in **apps/payaid-crm**.
- [x] Bigcapital → PayAid Finance in **apps/payaid-finance**.
- [ ] India: WhatsApp (e.g. Baileys) and GST invoice templates in respective forks.

### Step 6: India & AI (Week 2–3 – partial)
- [x] **WhatsApp (WAHA):** Hub integration: `PAYAID_WAHA_URL`; `lib/wahaClient.ts` (sendText, sendImage, sendTemplate); `POST /api/marketing/whatsapp/send` (Mautic webhook → WAHA); existing `POST /api/webhooks/whatsapp` relays to Frappe. See [WAHA-SETUP.md](./WAHA-SETUP.md) and `waha/docker-compose.yml`.
- [ ] **WhatsApp:** Contact notes / CRM reply handling in Hub (optional; Mautic API for reply→contact update when added).
- [ ] **GST:** E-invoice/IRN flow and templates (schema and irnQueue stub exist).
- [ ] **AI:** Lead scoring, agents (schema/model configs exist; integration in progress).

### Step 7: CRM ↔ Finance sync (Week 3–4 – not done)
- [ ] Deal → Invoice flow (CRM fork ↔ Finance fork).
- [x] **Finance** module in **MODULES** and nav (apps/payaid-finance placeholder live).

### Sales Studio (Frappe CRM) – alongside CRM (Week 1)
- [x] **Alongside:**
  - CRM = Espo (records, core CRM).
  - Sales Studio = Frappe (pipelines, sequences, forecast).
  - Switcher: **CRM | Sales Studio | Finance**.
  - See [SALES-STUDIO-NO-CRM-CONFUSION.md](./SALES-STUDIO-NO-CRM-CONFUSION.md). Rebrand (PayAid Sales Studio, no CRM wording): [SALES-STUDIO-REBRAND-FRAPPE.md](./SALES-STUDIO-REBRAND-FRAPPE.md).
- [x] **Shell:**
  - Route: `/sales-studio`
  - ENV: `PAYAID_SALES_STUDIO_URL`
  - Layout: `app/sales-studio/[slug]/layout.tsx` using AppShell
  - Page: iframe that loads `PAYAID_SALES_STUDIO_URL` with slug.
- [x] **Docker:**
  - Run Frappe: from repo root `pnpm up:sales-studio` (or `docker compose -f frappe-sales/docker-compose.yml up --detach`). Stops: `pnpm down:sales-studio`.
  - URL: `http://crm.localhost:8000` (add `127.0.0.1 crm.localhost` to hosts). First run can take 5–10 min; see [RUN-TROUBLESHOOTING.md](./RUN-TROUBLESHOOTING.md).
  - Add `PAYAID_SALES_STUDIO_URL=http://crm.localhost:8000` to `apps/web/.env` (template in `.env.example`).
- [x] **NO REPLACEMENT OF ESPO:**
  - `PAYAID_CRM_URL` must **always** point to EspoCRM (documented in `.env.example` and `.cursor/rules/crm-vs-sales-studio.mdc` at repo root).
  - Do **not** point it to Frappe now or later; do **not** add todos about "retiring Espo".
- [x] **Data sync (Espo → Frappe):**
  - Hub sync: [CRM-SALES-SYNC-HUB.md](./CRM-SALES-SYNC-HUB.md). **Push to Frappe** implemented: when Espo webhook fires and tenant has Sales Studio, `lib/frappeClient.pushLeadToFrappe` creates a Lead in Frappe and Hub stores `frappeLeadId`. Set `PAYAID_SALES_STUDIO_API_KEY` + `PAYAID_SALES_STUDIO_API_SECRET` in env (Frappe User → API Access → Generate Keys).
- [x] **WhatsApp relay:** `POST /api/webhooks/whatsapp` forwards to Frappe `crm.webhook.whatsapp`. Point WAHA/Baileys at `https://your-shell/api/webhooks/whatsapp`.

### Marketing (Mautic) – alongside (Week 1)
- [x] **Shell:** `/marketing` route + `PAYAID_MARKETING_URL`; redirect + iframe at `/marketing/[slug]/[[...rest]]`.
- [x] **Rebrand:** Marketing Studio (title, campaigns-first default route, module name/desc); see [MARKETING-STUDIO-REBRAND.md](./MARKETING-STUDIO-REBRAND.md).
- [x] **Hub:** `MarketingContact` model; GET/POST `/api/marketing/contacts` (list + CSV/JSON import).
- [x] **Docker:** `mautic-marketing/` with official mautic/docker-mautic basic example; port 8001.
- [ ] **Run:** `cd mautic-marketing && docker compose up -d`; add `PAYAID_MARKETING_URL=http://localhost:8001` to `apps/web/.env`.
- [ ] **Integration hub (Phase 2):** Mautic webhooks → PayAid → Espo/Frappe/Bigcapital; see [MAUTIC-MARKETING-PLAN.md](./MAUTIC-MARKETING-PLAN.md).

---

## Summary Table

| Item | Status | Notes |
|------|--------|--------|
| Monorepo (web, crm, suite, marketplace, packages/db, ui) | ✅ Done | Turbo, pnpm |
| Tenant model + tenantId on all CRM/finance-like tables | ✅ Done | packages/db |
| apps/web as shell with /crm/[slug], /finance/[slug] | ✅ Done | Fork-only iframe proxy |
| apps/crm (scratch CRM) | ❌ Removed | Replaced by payaid-crm |
| Module switcher (CRM, Sales Studio, Finance, HR, etc.) | ✅ Done | CRM \| Sales Studio \| Finance |
| Sales Studio iframe (/sales-studio, PAYAID_SALES_STUDIO_URL) | ✅ Done | Frappe; .env.example added |
| Marketing iframe (/marketing, PAYAID_MARKETING_URL) | ✅ Done | Mautic; mautic-marketing/ Docker |
| WhatsApp / GST (schema + stubs) | ⚠️ Partial | WAHA: send API + Mautic webhook + relay to Frappe; see WAHA-SETUP.md. Page + irnQueue; GST e-invoice pending |
| EspoCRM Docker (payaid-crm at root) | ✅ Done | Optional; not in apps/ |
| **apps/payaid-crm** (EspoCRM fork) | ✅ Done | Source in apps/; Docker on 3003 |
| **apps/payaid-finance** (Bigcapital fork) | ✅ Done | Source in apps/; run per STEP2-RUN-FORKS.md |
| Shell proxy to forks (iframe PAYAID_*_URL) | ✅ Done | /crm and /finance catch-all |
| Rebrand EspoCRM/Bigcapital → PayAid | ✅ Done | Step 5: text + logo in both forks |
| RLS in Supabase | ✅ Done | Migration in supabase/migrations/; see STEP3-SUPABASE-RLS.md |
| Deal → Invoice (CRM ↔ Finance) | ❌ Pending | After Finance fork |

---

## Module routing (Zoho-style) – CRM fork only

- **Web app (shell):** http://localhost:3001 — main app; CRM/Finance/Sales Studio open **inside** the shell (iframes). **Standalone:** same modules at http://localhost:3003, 3004, crm.localhost:8000 for direct access (install, admin). See [RUN-TROUBLESHOOTING.md](./RUN-TROUBLESHOOTING.md#standalone-vs-web-app-shell).
- **apps/payaid-crm** and **apps/payaid-finance** – run on ports 3003, 3004 (Docker / Node).
- **Shell proxy:** `/crm/[slug]/[[...rest]]` and `/finance/[slug]/[[...rest]]` render full-screen iframes to `PAYAID_CRM_URL` and `PAYAID_FINANCE_URL` with `?tenant=&slug=#/path`.
- **Scratch CRM removed:** All scratch CRM UI and the standalone **apps/crm** app have been removed. CRM in the shell is **fork-only** (iframe to payaid-crm).
- **Finance redirect:** `/finance` → `/finance/[slug]/dashboard` (same tenant resolution as `/crm`).
- **MODULES:** Finance added; CRM and Finance are first-class; module switcher links to `/crm` and `/finance` (redirect handles slug).
- **getTenantBySlug(slug)** in **apps/web/lib/tenant.ts** for proxy pages.
- **docs/MODULE-ROUTING.md** – routing and env vars.

---

## Recommended Next Steps (In Order)

1. **Sales Studio (Frappe CRM) – run Docker:**  
   - **Shell + env done:** `/sales-studio` route, `PAYAID_SALES_STUDIO_URL` in **apps/web/.env.example** (copy to `.env`).  
   - **Frappe:** From repo root run `pnpm up:sales-studio` (or `docker compose -f frappe-sales/docker-compose.yml up --detach`). Add `127.0.0.1 crm.localhost` to hosts. If the container exits (e.g. DNS failure), see [RUN-TROUBLESHOOTING.md](./RUN-TROUBLESHOOTING.md) and [SALES-STUDIO-FRAPPE-PLAN.md](./SALES-STUDIO-FRAPPE-PLAN.md).  
   - **Test:** Once Frappe is up, open http://crm.localhost:8000/app/crm (Administrator/admin), then in shell open `/sales-studio` and confirm iframe loads.

2. **Marketing (Mautic) – run Docker:**  
   - **Shell + env done:** `/marketing` route, `PAYAID_MARKETING_URL` in **apps/web/.env.example**.  
   - **Mautic:** From `mautic-marketing/`, run `docker compose up -d`. See [MAUTIC-MARKETING-PLAN.md](./MAUTIC-MARKETING-PLAN.md).  
   - **Test:** Open http://localhost:8001, complete installer if first run; then in shell open `/marketing` and confirm iframe loads.

3. **Run real forks (Espo + Finance – no replacement of Espo):**  
   - **apps/payaid-crm** = EspoCRM (core CRM); **PAYAID_CRM_URL** points to it. Keep Espo permanently.  
   - **apps/payaid-finance** = Bigcapital; **PAYAID_FINANCE_URL** already in .env.

4. **Supabase + RLS:** Align DB and RLS with **packages/db**; pass tenant into forks via URL.

5. **Rebrand + India:** EspoCRM → PayAid CRM, Bigcapital → PayAid Finance; add WhatsApp/GST in forks.

---

*Last updated from repo scan and migration checklist. Run the migration when ready; backup first.*

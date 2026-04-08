# EspoCRM → PayAid V3 Fork Plan (Self‑Hosted)

**Verdict**: EspoCRM = lightweight CRM base you control 100%. Best for self‑hosting, forking, and future Next.js shell.

> **Dual-fork (CRM + Finance):** For the full PayAid V3 plan with **Bigcapital** as the Finance fork, see **[DUAL-FORK-PAYAID-STRATEGY.md](./DUAL-FORK-PAYAID-STRATEGY.md)**.

---

## Why EspoCRM

- **Lightweight** vs Odoo (ERP monolith)
- **True self‑hosted** – you own code and data
- **Easy to fork** – PHP + frontend, multi-tenant possible
- **80% CRM done** – Leads, Contacts, Deals, Tasks, Companies, Cases, Kanban, Reports, custom fields, roles

---

## Self‑Hosted Setup (→ Production)

**Option A – Docker (fastest)**  
Official image repo: [espocrm/espocrm-docker](https://github.com/espocrm/espocrm-docker). The repo does not ship a `docker-compose.yml`; this project adds one (from the README) in `payaid-crm/docker-compose.yml`. Includes MariaDB, daemon, websocket.

```bash
# Clone Docker repo (we add docker-compose.yml from README)
git clone https://github.com/espocrm/espocrm-docker.git payaid-crm
cd payaid-crm
# docker-compose.yml is added in this repo
docker-compose -p payaid-espocrm up -d
```

**Option B – Fork & own (PayAid branded)**  
Clone app source, rebrand, multi-tenant: see **[OPTION-B-IMPLEMENTATION.md](./OPTION-B-IMPLEMENTATION.md)** (Day 1: clone, branding, docker @ 8080; Day 2: config.php + Redis, tenant slug, RLS).

**Replace scratch with forks (CRM + Finance + unified shell):** see **[MIGRATION-REPLACE-SCRATCH-WITH-FORKS.md](./MIGRATION-REPLACE-SCRATCH-WITH-FORKS.md)** – backup, dual fork (EspoCRM + Bigcapital), Supabase RLS, unified shell iframe proxy, rebrand, India.

**URL (Option A):** Open **http://localhost:8090** (this project uses 8090/8091 to avoid conflicts with other apps on 8080/8081). Login: `admin` / `password`.

**Option B – App source (for forking/rebrand)**  
Full PHP app: [espocrm/espocrm](https://github.com/espocrm/espocrm). Use when you need to edit code; add your own Dockerfile or use espocrm-docker as base.

```bash
git clone https://github.com/espocrm/espocrm.git payaid-crm-source
cd payaid-crm-source
# Then either use espocrm-docker and replace app volume, or add docker-compose
```

**Multi‑tenant (add to `config.php` in the app):**

```php
'tenantIdField' => 'tenant_id',
'teamsEntity' => false,   // Single DB, tenant isolation
```

**Your DB:** set `DATABASE_URL` (or DB_* in docker env). **PayAid branding:** theme/logo then `npm run build` (if you have a frontend build step).

**Windows / PowerShell**

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and ensure Docker is running.
- Chain commands with `;` (PowerShell) or run them one by one:
  `git clone ... ; cd payaid-crm ; docker-compose up -d`
- Paths and line endings: use WSL or Git Bash if you hit issues with scripts inside containers.

**Multi‑tenant URL**: `payaid.com/crm/acme-corp-1234` → `tenant_id = 'acme-corp-1234'`, all queries `WHERE tenant_id = ?`.

---

## Week 1–4 Roadmap

| Week | Focus | Outcome |
|------|--------|--------|
| **1** | Fork & rebrand | Logo/theme, tenant slugs; Leads/Contacts/Deals/Tasks/Companies/Cases, Kanban, Reports |
| **2** | India stack | WhatsApp (baileys → Contact notes), GST (invoice → PDF), UPI (Razorpay webhook → Deal) |
| **3** | AI | Lead scoring (Ollama), Agent console (/agents, BullMQ), Marketplace stub |
| **4** | Launch | payaid.com/crm/demo-corp-1234, billing, 10 beta → ₹50K MRR |

---

## Production Blueprint (Docker)

```yaml
# docker-compose.yml (Production)
version: '3'
services:
  payaid-crm:
    image: your-payaid-crm:latest
    ports: 80:80
    environment:
      DATABASE_URL: your-supabase
      WHATSAPP_TOKEN: ...
    volumes:
      - uploads:/var/www/html/data/uploads
  redis:
  bull-board:   # Agent queue monitoring
  n8n:          # Workflows
```

Scale: replicas + Supabase read replicas.

---

## Future: Full Control (6 months)

Replace EspoCRM frontend with your Next.js shell:

```
Your backend (Supabase + your services)
├── EspoCRM API (legacy CRM data)
└── Your React shell (new UI)
```

No lock‑in: pure Postgres → migrate anytime.

---

## Cursor Prompt: Fork EspoCRM → PayAid V3

Use this when ready to run the fork.

```md
# FORK ESPOCRM → PAYAID V3 (SELF‑HOSTED MVP)

**STEP 1**: Clone & setup
pnpm dlx degit espocrm/espocrm payaid-crm-fork
cd payaid-crm-fork
pnpm i prisma @prisma/client @whiskeysockets/baileys

**STEP 2**: Multi‑tenant (config.php + middleware)
'tenantIdField' => 'tenant_id'
RLS: all tables WHERE tenant_id = ?
Routes: /crm/{slug}/{module}

**STEP 3**: Rebrand
Global search: EspoCRM → PayAid V3
Logo → PayAid logo
Theme → indigo/purple

**STEP 4**: India integrations
WhatsApp: /api/whatsapp → Contact notes
GST: invoice templates + PDF
UPI: Razorpay webhook → Deal

**STEP 5**: Your AI
Lead detail → [AI Score ▶] → Ollama → custom field
Marketplace stub → your modules

**DELIVER**:
docker-compose.yml → payaid.com/crm/demo-1234
80% Zoho, your WhatsApp/AI

COMMIT "espocrm-payaid-selfhosted".
```

---

*EspoCRM = rocket ship. Self‑host today, own 100%.*

# Sales Studio – Frappe CRM Fork Plan

**Goal:** Add a **Sales Studio** (pipelines, sequences, forecasting) via **Frappe CRM**—closest open-source match, self-hosted, ~5-min Docker setup. Fork + customize beats building from scratch.

**Reference:** [Frappe CRM](https://github.com/frappe/crm) · [Live Demo](https://frappecrm-demo.frappe.cloud/api/method/crm.api.demo.login) · [Docs](https://docs.frappe.io/crm)

---

## Why Frappe CRM

| Repo          | Stars | Tech           | Sales Features                                              |
|---------------|-------|----------------|-------------------------------------------------------------|
| **Frappe CRM**| 10k+  | Python/JS/Frappe | Leads → Deals → Pipelines, Forecasting, Email sequences   |
| SuiteCRM      | 4k+   | PHP/MySQL      | Sequences, Workflows, Email templates, Forecasting         |
| NextCRM       | 2k+   | Next.js/React  | Pipelines, Tasks, Deals (add sequences)                    |
| Django CRM    | 1k+   | Python/Django  | Sales pipelines, Tasks, Forecasting                        |

**Winner:** Frappe CRM = modern sales engine (HubSpot Sales Hub–style). Lighter than full ERP; India-friendly (GST, multi-currency via ERPNext sibling).

### Sales Studio fit

- Pipelines (Kanban / forecasting)
- Email / WhatsApp sequences (add Baileys or [Frappe WhatsApp](https://github.com/shridarpatil/frappe_whatsapp))
- Deal playbooks (custom stages)
- Rep quotas / leaderboards
- Auto-followups
- Dialer: add later (e.g. OpenDialer, or built-in Twilio/Exotel)

---

## Docker: Two Ways to Run

### Option A – Official Frappe CRM Docker (recommended)

**Best choice:** official, isolated, ~5-min setup. Works on **Windows / Linux / Mac** (Docker Desktop).  
**Access:** **http://crm.localhost:8000/app/crm** (or open **http://crm.localhost:8000/app** and click CRM) · **Login:** Administrator / admin · **Stop:** `docker compose down`

**Linux / Mac / WSL:**

```bash
mkdir frappe-sales && cd frappe-sales
curl -O https://raw.githubusercontent.com/frappe/crm/develop/docker/docker-compose.yml
curl -O https://raw.githubusercontent.com/frappe/crm/develop/docker/init.sh
chmod +x init.sh
docker compose up -d
docker compose logs -f   # Watch setup (first run ~5 mins)
```

**Windows (PowerShell, if curl missing):**

```powershell
New-Item -ItemType Directory -Force -Path frappe-sales | Out-Null; Set-Location frappe-sales
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/frappe/crm/develop/docker/docker-compose.yml" -OutFile docker-compose.yml -UseBasicParsing
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/frappe/crm/develop/docker/init.sh" -OutFile init.sh -UseBasicParsing
docker compose up -d
```

**Troubleshooting:**  
- **"Failed to resolve 'api.github.com'"** – Add `dns: [8.8.8.8, 8.8.4.4]` under the frappe service and recreate the container.  
- **"module 'ast' has no attribute 'Str'" / "No module named 'frappe'"** – Many bench images now use Python 3.14, which breaks Frappe v15. Try **`frappe/bench:v5.26.0`** in `docker-compose.yml`. If that still shows Python 3.14, use the **alternative** below.
- **Alternative if all bench images fail:** Use [frappe_docker](https://github.com/frappe/frappe_docker) (`docker compose -f pwd.yml up`) or [kaustubhn/frappe-crm-docker](https://github.com/kaustubhn/frappe-crm-docker) for a pre-built CRM stack; then point `PAYAID_SALES_STUDIO_URL` at the URL that stack exposes (e.g. port 8080).  
- **Port 9000 already allocated** – Map socketio to another host port, e.g. `9001:9000`.  
- The repo's `frappe-sales/init.sh` uses `#!/bin/bash` (fix typo `#!bin/bash` if you copied an older version).

---

### Option B – Frappe easy-install (production-style)

Uses the generic Frappe installer; custom sitename e.g. `localhost:8001`. **Requires Linux/WSL—skip on Windows.**

```bash
wget https://frappe.io/easy-install.py
python3 easy-install.py deploy --project=sales --app=crm --sitename=localhost:8001
```

---

## PayAid V3 Fork Plan

| Step | Action |
|------|--------|
| 1 | Fork Frappe CRM → e.g. **apps/sales-studio** (or keep separate repo and point shell to it). |
| 2 | Docker: run on **localhost:8001** (Option B) or **crm.localhost:8000** (Option A). |
| 3 | Shell iframe: add route **/sales-studio** (or reuse `/crm`) → proxy to Frappe CRM URL. |
| 4 | Customize: WhatsApp (e.g. Baileys / Frappe WhatsApp) in Week 2. |
| 5 | Optional (Month 2): React shell → gradually replace UI with PayAid (unified layout). |

**Speed:** Week 1 revenue vs 8 weeks from scratch.  
**vs EspoCRM/Bigcapital:** Frappe CRM is sales-only (lighter); can coexist with existing **apps/payaid-crm** (EspoCRM) as “Sales Studio” or replace it.

---

## Shell integration (done)

- **Sales Studio** is in `apps/web/lib/modules.ts` (`pathPrefix: "sales-studio", href: "/sales-studio"`).
- Catch-all proxy **/sales-studio/[slug]/[[...rest]]** → iframe to `PAYAID_SALES_STUDIO_URL` (default `http://crm.localhost:8000`).
- Same tenant resolution as `/crm` and `/finance`; iframe src = `${PAYAID_SALES_STUDIO_URL}/crm?tenant=...&slug=...#/path`.

---

## PayAid integration (post-run)

**1. Add to `apps/web/.env`:**

```env
PAYAID_SALES_STUDIO_URL=http://crm.localhost:8000
```

**2. Shell proxy:** `apps/web/app/sales-studio/[slug]/[[...rest]]/page.tsx` — iframe src = `${base}/crm?tenant=${tenant.id}&slug=${tenant.slug}#/${path}`.

**3. Multi-tenant:** Frappe can use `tenant`/`slug` via custom script or site config; pass param in URL as above.

**4. WhatsApp (Week 2):** Patch or wire Frappe’s `/api/method/crm.webhook.whatsapp` to your Baileys/WAHA.

---

## Test commands

**Bash / WSL / Git Bash:**
```bash
cd frappe-sales
docker compose ps        # All containers up?
curl -I http://crm.localhost:8000   # 200 OK when Frappe is running
```

**PowerShell (Windows):** In PowerShell, `curl` is an alias for `Invoke-WebRequest` and can mis-handle URLs. Use the real curl or Invoke-WebRequest explicitly:
```powershell
cd frappe-sales
docker compose ps
curl.exe -I http://crm.localhost:8000
# or: Invoke-WebRequest -Uri "http://crm.localhost:8000" -Method Head
```

**Production:** Frappe is Docker-based; **not on Vercel**. Run on **Supabase/Render/Railway** (~₹500/mo) or your own Docker host.

---

## CRM vs Sales Studio (permanent – no replacement)

- **EspoCRM = Core CRM (permanent).** `PAYAID_CRM_URL` always points to Espo (e.g. localhost:3003). Espo owns Leads, Contacts, Accounts, Deals, Activities, Tasks.
- **Frappe = Sales Studio (permanent).** `PAYAID_SALES_STUDIO_URL` points to Frappe (e.g. crm.localhost:8000). Sales Studio owns Pipelines, Sequences, Forecasting. Never point `PAYAID_CRM_URL` at Frappe; do not plan to retire Espo.

*Last updated: Option A run + shell proxy and MODULES. See .cursor/rules/crm-vs-sales-studio.mdc.*

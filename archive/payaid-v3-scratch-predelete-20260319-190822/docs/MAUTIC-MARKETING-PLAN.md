# Mautic Marketing – PayAid V3 Fork Plan

**Goal:** Add **Marketing** (campaigns, email/SMS/social, segments, A/B) via **Mautic**—self-hosted, Docker ~5-min setup. Same fork+iframe pattern as Sales Studio (Frappe) and CRM (Espo).

**Reference:** [Mautic](https://github.com/mautic/mautic) · [Mautic Docker](https://github.com/mautic/docker-mautic) · [Mautic Docs](https://docs.mautic.org/) · [MARKETING-STUDIO-REBRAND.md](./MARKETING-STUDIO-REBRAND.md) (rebrand + independence)

---

## Why Mautic

| Repo       | Stars | Tech     | Key Features                                      |
|------------|-------|----------|---------------------------------------------------|
| **Mautic** | 7k+   | PHP/MySQL| Campaigns, Email builder, Social, Segments, A/B   |
| Mixpost    | 2.6k  | Laravel  | Social scheduler (FB/IG/Twitter), Calendar         |
| SendPortal | 1k+   | Laravel  | Email campaigns, Lists, Tracking                  |

**Winner:** Mautic = full marketing automation (Zoho Campaigns–style). Webhooks + REST API for PayAid hub sync.

### Master plan fit

- Campaigns (multi-channel: Email/SMS/Social)
- Email/SMS builder + A/B
- Segments (CRM integration)
- Social posts/scheduler
- Analytics (ROI, open rates)
- **Gaps:** WhatsApp → Baileys plugin; AI content → Chimpino/Groq (Week 2).

---

## Docker Setup (5–10 mins)

**Location:** `mautic-marketing/` at repo root (same level as `frappe-sales/`).

```bash
cd mautic-marketing
docker compose up -d
```

- **Access:** http://localhost:8001  
- **First run:** Complete Mautic web installer (DB credentials from `mautic-marketing/.env`).  
- **Port:** 8001 to avoid conflict with Frappe (8000). Change in `docker-compose.yml` if needed.

**PowerShell (Windows):**

```powershell
cd mautic-marketing
docker compose up -d
docker compose logs -f mautic_web
```

---

## Shell Integration (Done)

- **Marketing** is in `apps/web/lib/modules.ts` (`pathPrefix: "marketing", href: "/marketing"`).
- **Redirect:** `/marketing` → `/marketing/[slug]/dashboard` (tenant from query/session).
- **Catch-all:** `/marketing/[slug]/[[...rest]]` → iframe to `PAYAID_MARKETING_URL` (default `http://localhost:8001`).
- **Env:** In `apps/web/.env` add:
  ```env
  PAYAID_MARKETING_URL=http://localhost:8001
  ```

Same tenant resolution as `/crm` and `/sales-studio`; iframe src = `${base}?tenant=&slug=#/path`.

---

## Phase 2: PayAid Integration Hub

PayAid is the **hub**: Mautic webhooks → PayAid → Espo/Frappe/Bigcapital via their REST APIs.

### Architecture

- **Mautic** = Marketing (forms, campaigns, email/SMS, scoring). Webhooks for contact/activity; REST API for contacts/segments.
- **EspoCRM / Frappe CRM** = Sales/CRM (leads, contacts, deals). REST API; web-to-lead.
- **Bigcapital** = Finance (customers, invoices, GL). HTTP API for customers and transactions.

**Integration service (inside PayAid):**

- `POST /api/integrations/mautic/webhook` – receive Mautic events.
- Espo/Frappe/Bigcapital sync utilities (create/update lead, contact, customer, invoice).

### Step 1: Shared contact model

In PayAid DB (e.g. Prisma), add something like:

- `external_contacts`: `id`, `email` (unique), `espo_id`, `frappe_lead_id`, `mautic_id`, `bigcapital_id`, `last_sync_at`.

Match on **email**; create/update mapping; keep `*_id` fields in sync for idempotency.

### Step 2: Mautic → CRM (Leads & activity)

1. In Mautic: create webhook → `https://<payaid>/api/integrations/mautic/webhook`.  
   Events: `contact.updated`, `form.submit`, `email.open`, `page.hit`, etc.
2. Handler: parse payload → email, name, tags, score; lookup `external_contacts`.
3. If no `espo_id`/`frappe_lead_id`: create Lead/Contact via Espo or Frappe API; store returned ID.
4. For activities: create Note/custom Activity on Lead/Contact; optionally update score.

### Step 3: CRM → Mautic (Segments & nurture)

When lead status changes (e.g. New → Qualified, Won, Lost):

- PayAid (workflow or cron) calls Mautic API: create/update contact if needed; add/remove tags or segments (e.g. `qualified`, `customer`).
- Keeps Mautic segments in sync with pipeline status.

### Step 4: CRM → Bigcapital (Deal → Invoice)

When deal is **Won** in Espo/Frappe:

1. Create customer in Bigcapital if no `bigcapital_id`.
2. Create invoice/sales transaction with line items, GST, due date.
3. Flow: **Mautic (lead/campaign) → CRM (won deal) → Bigcapital (invoice)**.

### Step 5: Implementation checklist

- **Auth:** Espo/Frappe API user + role; Mautic API credentials and webhooks; Bigcapital API key.
- **Routes:** `/api/integrations/mautic/webhook` (verify signature, parse events, call CRM/DB).
- **Utilities:** Espo/Frappe REST (lead/contact, Note); Bigcapital (customer, invoice).
- **Idempotency:** Store last Mautic event IDs; ignore duplicates; job queue for retries.

---

## Frappe CRM (Sales Studio) integration

Same hub pattern: add `frappe_lead_id` (or similar) to `external_contacts`.

- **Mautic webhook → PayAid → Frappe:** `POST /api/resource/Lead` with name, email, source (e.g. "Mautic Campaign X").
- **Frappe deal won → PayAid → Mautic:** `PATCH /contacts/{mautic_id}` with tags e.g. `["qualified"]`.

Frappe API: same as ERPNext (`/api/resource/Lead`, API key auth).

---

## Week 2: AI and WhatsApp gaps

| Gap           | Option                          |
|---------------|----------------------------------|
| AI text       | Chimpino AI plugin or Groq in PayAid |
| AI images     | DALL·E plugin or ComfyUI proxy  |
| WhatsApp      | Baileys webhook (your stack)    |

**ComfyUI (optional):** AI images/video; run separately (e.g. port 8188); PayAid hub can call `/api/ai/image` or similar to generate assets for Mautic campaigns.

---

## Mautic vs master plan

| Master plan   | Mautic native | Gap    | Fix                    |
|---------------|---------------|--------|------------------------|
| Campaigns     | Yes           | –      | Ready                  |
| Social scheduler | Yes        | –      | Ready                  |
| Email builder / A/B | Yes   | –      | Ready                  |
| AI content    | No            | Plugin | Chimpino / Groq        |
| Image gen     | No            | Plugin | DALL·E / ComfyUI       |
| WhatsApp      | No            | Custom | Baileys                |

**Mautic ≈ 90% day 1;** AI/WhatsApp in Week 2.

---

## Test commands

```bash
cd mautic-marketing
docker compose ps
curl -I http://localhost:8001
```

In PayAid shell: open `/marketing` and confirm iframe loads Mautic (after install).

---

## Summary

| Step | Status |
|------|--------|
| Docker (mautic-marketing/) | Done |
| Shell route /marketing + iframe | Done |
| PAYAID_MARKETING_URL in .env.example | Done |
| Integration hub (webhooks, external_contacts, Espo/Frappe/Bigcapital) | Planned (Phase 2) |

*Last updated: Mautic Docker + shell proxy; Phase 2 = integration hub.*

# Phase 1A — Implementation Status vs Roadmap

**Source:** `docs/PHASE_1A_CURSOR_PROMPT_RAW.md`  
**Purpose:** What’s implemented vs what’s still missing from the Phase 1A roadmap.

---

## 1. AI LEAD SCORING + WHATSAPP CRM

### Core features

| Roadmap item | Status | Notes |
|--------------|--------|--------|
| Auto-import leads (CSV upload, contacts table) | ✅ Done | `POST /api/leads/import` — CSV/XLSX, creates Contact records; `app/crm/[tenantId]/Leads` has import UI. |
| WhatsApp tracking (send/track opens/clicks/replies) | ✅ Done | **Replies:** webhook + rescore. **Opens/clicks:** `GET /api/whatsapp/track?contactId=...&type=open|click` — use this URL in messages to track; updates `whatsappStatus` and triggers rescore. |
| AI Lead Score (0–100), Groq → hot/warm/cold | ✅ Done | `lib/ai/lead-scorer-groq.ts`; GET/POST `/api/leads/score?useGroq=true`; output includes `stage`, `nurture_action`, `predicted_mrr`. |
| Nurture sequences (AI 3-touch WhatsApp/email flows) | ✅ Done | **AI generator:** POST `/api/nurture/generate-ai` (Groq 3-touch, day 0/2/5). **Scheduler:** GET/POST `/api/nurture/run-scheduled` (cron); sends due steps (WhatsApp/email). **Enrollment:** existing templates + enroll. |
| Dashboard: Lead pipeline + ₹ revenue forecast | ✅ Done | **Revenue forecast:** `RevenueForecast` + `/api/crm/analytics/revenue-forecast`. **Lead pipeline:** Leads page has **Kanban** view (drag-drop stages) via `LeadsKanban` + view toggle (Table / Sheet / Kanban). |

### Database schema

| Roadmap (Supabase) | Status | Notes |
|-------------------|--------|--------|
| whatsapp_number | ✅ Mapped | WhatsApp number via `WhatsappContactIdentity.whatsappNumber` (linked to Contact). |
| lead_score, score_updated_at | ✅ Done | `Contact.leadScore`, `Contact.scoreUpdatedAt`. |
| whatsapp_status (JSONB) | ✅ Done | `Contact.whatsappStatus` (Phase 1A migration). |
| nurture_stage | ✅ Done | `Contact.nurtureStage` (cold/warm/hot). |
| predicted_revenue (₹) | ✅ Done | `Contact.predictedRevenue` Decimal(12,2). |

### AI scoring logic (Groq)

| Roadmap | Status | Notes |
|---------|--------|--------|
| INPUT: lead data (industry, size, engagement, whatsapp) | ✅ Done | Built in `scoreLeadWithGroq` / `scoreContactWithGroqAndPersist`. |
| OUTPUT: score, stage, nurture_action, predicted_mrr | ✅ Done | Returned by API and persisted on Contact. |
| Prompt (India SMB, factors, JSON only) | ✅ Done | In `lib/ai/lead-scorer-groq.ts` (INDIA_SMB_SYSTEM_PROMPT). |

### Implementation steps (from roadmap)

| Step | Roadmap path | Status | Actual location / note |
|------|-----------------------|--------|---------------------------|
| 1 | crm/leads → Kanban dashboard (drag-drop stages) | ✅ Done | `components/crm/LeadsKanban.tsx`; view toggle Table / Sheet / **Kanban** on Leads page; PATCH contact stage on drop. |
| 2 | lead-scorer.ts (Groq) | ✅ Done | `lib/ai/lead-scorer-groq.ts` + wiring in `/api/leads/score`. |
| 3 | webhooks/whatsapp → track opens/replies → auto-rescore | ✅ Done | **Replies:** webhook. **Opens/clicks:** `/api/whatsapp/track?contactId=&type=open|click`; updates status + rescore. |
| 4 | LeadNurtureFlow → AI sequence generator + scheduler | ✅ Done | **LeadNurtureFlow:** UI. **Generator:** POST `/api/nurture/generate-ai`. **Scheduler:** GET/POST `/api/nurture/run-scheduled` (cron). |
| 5 | Metrics (conversion, score→revenue, WhatsApp open rates) | ✅ Done | GET `/api/crm/analytics/metrics`; page at `/crm/[tenantId]/Metrics`. |

---

## 2. INDUSTRY AGENT BUNDLES (5 PRE-BUILT)

| Agent | Status | What exists | What’s missing |
|-------|--------|-------------|----------------|
| **1. Retail Inventory** | ✅ Done | `lib/agents/retail-inventory-agent.ts`, `POST /api/agents/retail-inventory`. Sales 30d, reorder list, WhatsApp message. **Shiprocket:** `lib/integrations/shiprocket.ts` (real rates when SHIPROCKET_* set). **PO:** creates PurchaseOrder + items (vendor “Reorder Supplier (Agent)”). |
| **2. Services Lead Follow-up** | 🔲 Stub | `POST /api/agents/services-lead-followup` returns 501 Coming soon. |
| **3. Manufacturing GST Compliance** | 🔲 Stub | `POST /api/agents/manufacturing-gst` returns 501 Coming soon. |
| **4. F&B Revenue Optimizer** | 🔲 Stub | `POST /api/agents/fb-revenue` returns 501 Coming soon. |
| **5. Ecom Shiprocket Optimizer** | 🔲 Stub | `POST /api/agents/ecom-shiprocket` returns 501 Coming soon. |

### Agent dashboard

| Roadmap | Status | Notes |
|---------|--------|--------|
| 5 Industry agents → agent dashboard | ✅ Done | `/crm/[tenantId]/Agents` — lists all 5 agents; Run for Retail; others show “Coming soon”. Nav: Agents + Metrics in CRM layouts. |

---

## 3. CURSOR IMPLEMENTATION RULES (STRICT)

These are code-quality guidelines, not single “features.” The codebase generally follows them; no discrete “implemented/not implemented” list. Consider: TypeScript strict, error boundaries, loading states, mobile-first, ₹ and India formats, no $/USD, component size.

---

## 4. DEPLOYMENT CHECKLIST (ROADMAP)

| Item | Status | Note |
|------|--------|------|
| Vercel preview deploy passes | — | Manual / CI. |
| Schema migrations applied | ✅ Done | Phase 1A Contact columns; migration SQL in `prisma/migrations/`. |
| Groq API keys in Vercel env (rate limited) | — | Env/config; no code gap. |
| WhatsApp sandbox testing complete | — | Manual. |
| 5 Industry agents → agent dashboard | ❌ Missing | Only Retail agent; no dashboard. |
| Lead scoring accuracy >85% (100 sample leads) | — | Measurement/QA. |

---

## 5. SUCCESS METRICS (WEEK 4)

These are targets to measure, not implementation tasks. Implementation that supports them: lead scoring (done), WhatsApp tracking (replies done; opens not), revenue forecast (done), dashboard (table exists; Kanban + agent dashboard missing).

---

## 6. START HERE (ROADMAP)

| Item | Status | Note |
|------|--------|------|
| 1. Create schema extensions | ✅ Done | Contact: whatsappStatus, nurtureStage, predictedRevenue. |
| 2. Build lead-scorer.ts (Groq) | ✅ Done | `lib/ai/lead-scorer-groq.ts` + API. |
| 3. Dashboard: crm page | ⚠️ Partial | CRM Home + Leads (table); no Kanban; revenue forecast exists. |
| 4. Deploy agent #1 (Retail) as proof | ⚠️ Partial | Retail agent runs; Shiprocket real API + PO update missing. |

---

## Summary

### Implemented

- Contact schema (Phase 1A): whatsappStatus, nurtureStage, predictedRevenue, leadScore, scoreUpdatedAt.
- Groq India SMB lead scorer and GET/POST score API (with useGroq).
- WhatsApp webhook: store message, update contact whatsappStatus (replied), trigger rescore.
- LeadNurtureFlow on contact detail: stage, recommended action, predicted MRR (₹), Rescore with AI.
- CSV/XLSX lead import and Revenue forecast (component + API).
- Nurture templates + enrollment (no AI-generated 3-touch yet).
- Retail Inventory Agent (steps 1–3; placeholder Shiprocket; no PO update).
- Cursor rules: largely followed (TS, ₹, structure).

### Missing or partial

1. **Agents 2–5 (full implementation):** Services, Manufacturing GST, F&B, Ecom Shiprocket — API stubs (501) and dashboard placeholders exist; full workflows not yet built.

Use this as the single source of truth for “what’s done vs what’s missing” from the Phase 1A roadmap.

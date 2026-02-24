# PayAid V3 — Phase 1A Cursor Prompt

**AI CRM + Industry Agents (Weeks 1–4)**  
Target: Beat Zoho lead scoring + Razorpay CRM gaps.  
**STRICT: India SMBs only. ₹ INR currency. No $ or foreign formats.**

---

## Project context

PayAid V3 = India-first Business OS for SMBs (6Cr market).  
Phase 1A delivers:

1. **AI Lead Scoring + WhatsApp CRM** (beats Zoho automation)
2. **5 Pre-built Industry Agents** (retail, services, manufacturing, F&B, ecom)
3. **Production-ready:** Vercel deploy, Groq inference, TypeScript strict

---

## Tech stack (mandatory)

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Prisma + PostgreSQL (Vercel Postgres or Supabase)
- **AI:** Groq (llama3.2 + gemma2), self-hosted fallback via Ollama
- **Payments:** PayAid Payments ONLY (per integration guide)
- **Comms:** WhatsApp Business API + Twilio / WAHA
- **Currency:** ₹ INR ONLY. No USD/EUR display or storage.

---

## 1. AI Lead Scoring + WhatsApp CRM

### Core features

- Auto-import leads: CSV upload, contacts table
- WhatsApp tracking: send/track opens/clicks/replies via API
- **AI Lead Score (0–100):** Groq analyzes signals → hot/warm/cold
- Nurture sequences: AI generates 3-touch WhatsApp/email flows
- Dashboard: Lead pipeline (Kanban + metrics), ₹ revenue forecast

### Database (Prisma)

Contact model extensions (Phase 1A):

- `whatsappStatus` (Json) — e.g. `{ sent, opened, replied }`
- `nurtureStage` (String) — cold | warm | hot
- `predictedRevenue` (Decimal) — ₹ INR only

### AI scoring logic (Groq)

- **Input:** Lead data (industry, size, engagement, WhatsApp replies)
- **Output:** `{ score, stage, nurture_action, predicted_mrr }` (JSON)
- **Prompt:** *"Score this Indian SMB lead 0–100. Factors: industry fit (PayAid strong in retail/F&B), engagement (WhatsApp opens=40pts), business size (10+ emp=30pts), pain signals (e.g. 'GST headaches'=20pts). Output JSON only."*

### Implementation (done in codebase)

- `lib/ai/lead-scorer-groq.ts` — Groq India SMB scorer
- `GET/POST /api/leads/score?contactId=…&useGroq=true` — optional Groq scoring
- WhatsApp webhook updates `whatsappStatus` and triggers rescore
- `components/crm/LeadNurtureFlow.tsx` — nurture stage + recommended action + “Rescore with AI”

---

## 2. Industry Agent Bundles (5 pre-built)

### Agent architecture

- Each agent = multi-step workflow (Groq tools + DB actions)
- Template: `{ name, industry, trigger, steps[], tools[], output }`
- Deploy as: Next.js API route + optional cron

### Agent 1: Retail Inventory Agent ✅

- **Trigger:** Low stock (inventory &lt; threshold)
- **Steps:** Analyze sales (last 30d), Shiprocket placeholder, reorder list + WhatsApp supplier message
- **Output:** e.g. *"Reorder 50 shirts @₹299 = ₹14,950. Shiprocket: ₹89 delivery."*
- **Code:** `lib/agents/retail-inventory-agent.ts`, `POST /api/agents/retail-inventory`

### Agent 2: Services Lead Follow-up

- **Trigger:** Lead score &gt;70 + no reply in 48h
- **Steps:** AI WhatsApp nudge → email → call script
- **Tools:** WhatsApp API, email templates, calendar

### Agent 3: Manufacturing GST Compliance

- **Trigger:** Monthly cron (1st)
- **Steps:** Pull invoices → validate GSTIN → e-invoice → GSTR-1
- **Output:** e.g. *"GSTR-1 filed. ₹2.45L output tax."*

### Agent 4: F&B Revenue Optimizer

- **Trigger:** Weekly sales dip
- **Steps:** Menu performance → price/promos → Swiggy/Zomato listings

### Agent 5: Ecom Shiprocket Optimizer

- **Trigger:** Order batch &gt;10
- **Steps:** Courier selection → bulk labels → tracking dashboard

---

## 3. Cursor implementation rules (strict)

**Do:**

- TypeScript strict mode, no `any` where avoidable
- Error boundaries and loading skeletons (Tailwind shimmer)
- Mobile-first (India: 70% mobile SMBs)
- India phone: +91 XXXXX XXXXXX
- ₹12,450 format (Indian commas: ₹12,45,000)

**Don’t:**

- Dollar signs $, USD, EUR
- Generic lorem ipsum (use Indian business examples)
- Bloated components (max ~200 LOC per component)
- Magic numbers (use named constants)

---

## 4. Deployment checklist

- [ ] Vercel preview deploy passes
- [ ] Prisma migrations applied (Contact: whatsappStatus, nurtureStage, predictedRevenue)
- [ ] Groq API key in Vercel env (rate limited)
- [ ] WhatsApp sandbox testing complete
- [ ] Retail agent callable via `POST /api/agents/retail-inventory`
- [ ] Lead scoring accuracy &gt;85% (test 100 sample leads)

---

## 5. Success metrics (Week 4)

- 90% lead scoring accuracy vs manual
- WhatsApp open rates &gt;45%
- 5 agents deployed, 100 test runs each
- Dashboard loads &lt;1.5s (Lighthouse 95+)
- ₹ revenue forecast error &lt;15%

---

## Start here (next steps)

1. Run Prisma migration for Contact schema extensions.
2. Use `lib/ai/lead-scorer-groq.ts` and `GET/POST /api/leads/score?useGroq=true`.
3. Add `LeadNurtureFlow` to contact detail page where appropriate.
4. Trigger Retail agent from dashboard or cron: `POST /api/agents/retail-inventory`.

**Deliverable:** Working Phase 1A demo → Week 4 soft launch to 100 SMBs.

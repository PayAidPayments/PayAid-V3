# PayAid V3 — Phase 1A (copy-paste into Cursor AI)

**Use this prompt in Cursor for Phase 1A.**  
**PayAid V3 adaptation:** This repo uses **Prisma + PostgreSQL** (not Supabase) and **Next.js App Router** under `app/`. Map as follows when implementing:
- "Supabase contacts/schema" → **Prisma `Contact` model**; migrations in `prisma/migrations/`.
- "src/app/crm/leads" → **app/crm/[tenantId]/Leads/page.tsx**
- "src/app/crm/page.tsx" → **app/crm/[tenantId]/Home/page.tsx** or **app/crm/page.tsx**
- "src/lib/ai/lead-scorer.ts" → **lib/ai/lead-scorer-groq.ts** (already exists) + **lib/ai-helpers/lead-scoring.ts**
- "src/api/webhooks/whatsapp" → **app/api/whatsapp/webhooks/message/route.ts**
- **LeadNurtureFlow** → **components/crm/LeadNurtureFlow.tsx** (already exists)

---

# 🚀 PAYAID V3 - PHASE 1A IMPLEMENTATION
# AI CRM + Industry Agents (Weeks 1-4)
# Target: Beat Zoho lead scoring + Razorpay CRM gaps
# STRICT: India SMBs only. ₹ INR currency. No $ or foreign formats.

## PROJECT CONTEXT
PayAid V3 = India-first Business OS for SMBs (6Cr market).
Phase 1A delivers:
1. AI Lead Scoring + WhatsApp CRM (beats Zoho automation)
2. 5 Pre-built Industry Agents (retail, services, manufacturing, F&B, ecom)
3. Production-ready: Vercel deploy, Groq inference, TypeScript strict

## TECH STACK (MANDATORY)
- Frontend: Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL auth/database), Vercel Edge Functions
- AI: Groq (llama3.2 + gemma2), self-hosted fallback via Ollama
- Payments: PayAid Payments ONLY (per integration guide)
- Comms: WhatsApp Business API + Twilio
- Currency: ₹ INR ONLY. No USD/EUR display or storage.

## 1. AI LEAD SCORING + WHATSAPP CRM

### Core Features
- Auto-import leads: CSV upload, Supabase contacts table
- WhatsApp tracking: Send/track opens/clicks/replies via API
- AI Lead Score (0-100): Groq analyzes signals → hot/warm/cold
- Nurture Sequences: AI generates 3-touch WhatsApp/email flows
- Dashboard: Lead pipeline (Kanban + metrics), ₹ revenue forecast

### Database Schema (Supabase)
```sql
-- contacts table (existing + extensions)
ALTER TABLE contacts ADD COLUMN:
  whatsapp_number VARCHAR(15),
  lead_score INTEGER DEFAULT 0,
  score_updated_at TIMESTAMP,
  whatsapp_status JSONB, -- {sent: true, opened: true, replied: true}
  nurture_stage VARCHAR(50) DEFAULT 'cold',
  predicted_revenue DECIMAL(12,2) DEFAULT 0; -- ₹ INR only
```

### AI Scoring Logic (Groq Prompt)
INPUT: Lead data (industry, size, engagement, whatsapp replies)
OUTPUT: {score: 85, stage: 'hot', nurture_action: 'Schedule demo', predicted_mrr: 25000}
PROMPT: "Score this Indian SMB lead 0-100. Factors: industry fit (PayAid strong in retail/F&B), engagement (WhatsApp opens=40pts), business size (10+emp=30pts), pain signals (mentioned 'GST headaches'=20pts). Output JSON only."

### Implementation Steps
1. src/app/crm/leads/page.tsx → Kanban dashboard (drag-drop stages)
2. src/lib/ai/lead-scorer.ts → Groq client + scoring function
3. src/api/webhooks/whatsapp.ts → Track opens/replies → auto-rescore
4. src/components/LeadNurtureFlow.tsx → AI sequence generator + scheduler
5. Metrics: Conversion rate, avg score→revenue, WhatsApp open rates

## 2. INDUSTRY AGENT BUNDLES (5 Pre-built)

### Agent Architecture
Each agent = Multi-step workflow (Groq tools + Supabase actions)
Template: {name, industry, trigger, steps[], tools[], output}
Deploy as: Vercel Edge Function + Supabase Edge Function

### Agent 1: Retail Inventory Agent
TRIGGER: Low stock alert (Supabase inventory < threshold)
STEPS:
1. Analyze sales patterns (last 30d)
2. Check Shiprocket rates (API call)
3. Generate reorder list + WhatsApp supplier message
4. Update purchase orders table
OUTPUT: "Reorder 50 shirts @₹299 = ₹14,950. Shiprocket: ₹89 delivery."

### Agent 2: Services Lead Follow-up
TRIGGER: Lead score >70 + no reply in 48h
STEPS: AI WhatsApp nudge → if no reply, email → if no reply, call script
TOOLS: WhatsApp API, email templates, calendar booking

### Agent 3: Manufacturing GST Compliance
TRIGGER: Monthly cron (1st)
STEPS: Pull invoices → validate GSTIN → generate e-invoice → file GSTR-1
OUTPUT: "GSTR-1 filed. ₹2.45L output tax. Next: Input reconciliation."

### Agent 4: F&B Revenue Optimizer
TRIGGER: Weekly sales dip detected
STEPS: Analyze menu performance → suggest price/promos → create Swiggy/Zomato listings
TOOLS: Google Trends India, competitor pricing scrape

### Agent 5: Ecom Shiprocket Optimizer
TRIGGER: Order batch >10
STEPS: Optimal courier selection → bulk label generation → tracking dashboard
TOOLS: Shiprocket API, rate comparison

## 3. CURSOR IMPLEMENTATION RULES (STRICT)

✅ YES:
- TypeScript strict mode, no 'any'
- Error boundaries everywhere
- Loading skeletons (Tailwind shimmer)
- Mobile-first responsive (India: 70% mobile SMBs)
- India phone formats: +91 XXXXX XXXXXX
- ₹12,450 format (Indian commas: ₹12,45,000)

❌ NO:
- Dollar signs $, USD, EUR displays
- Generic lorem ipsum (use Indian business examples)
- Bloated components (max 200 LOC per component)
- External dependencies beyond stack
- Magic numbers (use constants)

## 4. DEPLOYMENT CHECKLIST
- [ ] Vercel preview deploy passes
- [ ] Supabase schema migrations applied
- [ ] Groq API keys in Vercel env (rate limited)
- [ ] WhatsApp sandbox testing complete
- [ ] 5 Industry agents → agent dashboard
- [ ] Lead scoring accuracy >85% (test 100 sample leads)

## 5. SUCCESS METRICS (Week 4)
- 90% lead scoring accuracy vs manual
- WhatsApp open rates >45%
- 5 agents deployed, 100 test runs each
- Dashboard loads <1.5s (Lighthouse 95+)
- ₹ revenue forecast error <15%

## START HERE:
1. Create Supabase schema extensions
2. Build src/lib/ai/lead-scorer.ts (Groq integration)
3. Dashboard: src/app/crm/page.tsx
4. Deploy agent #1 (Retail Inventory) as proof

DELIVERABLE: Working Phase 1A demo → Week 4 soft launch to 100 SMBs.

BUILD IT. PayAid V3 becomes India SMB market leader. 🚀

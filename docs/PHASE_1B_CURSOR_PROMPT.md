# PayAid V3 — Phase 1B Cursor Prompt

**AI + Retention Moat (Weeks 5–8)**  
Target: No-Code Agent Builder, Churn Predictor Dashboard, Website Builder v2. Beat Odoo complexity and Zoho retention gaps.  
**STRICT: India SMBs only. ₹ INR. TypeScript strict. Mobile-first.**

---

## Project context

Phase 1A delivered: AI Lead Scoring + WhatsApp CRM, Groq India SMB scorer, Retail Inventory Agent, Lead Nurture Flow.  
Phase 1B delivers:

1. **No-Code Agent Builder** — Drag-drop workflows for SMBs (like multi-agent but UI-first). Beats Odoo customization hell.
2. **Churn Predictor Dashboard** — AI flags at-risk customers; retention recommendations. Zoho lacks. Target ~90% retention boost.
3. **Website Builder v2** — SmartPrompt + Groq for industry-tuned pro sites in ~60s (India SMB industries).

---

## Tech stack (mandatory)

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui, drag-drop (e.g. @dnd-kit — already in package.json).
- **Backend:** Prisma + PostgreSQL. Next.js API routes. No new databases; extend existing models.
- **AI:** Groq (primary), Ollama fallback. Use `getGroqClient()` from `@/lib/ai/groq`.
- **Currency:** ₹ INR only. No $ or USD/EUR.
- **Existing:** `lib/ai/website-builder.ts`, HR flight-risk/retention patterns in `lib/hr`, `lib/agents/retail-inventory-agent.ts` as agent template.

---

## 1. No-Code Agent Builder

### Goal

SMB users build automation workflows via UI: choose trigger → add steps (conditions, actions, AI step) → save. No code. Deploy as runnable workflow (cron or event).

### Core features

- **Canvas:** Drag-drop nodes for Trigger, Condition, Action, AI Step, Delay.
- **Triggers:** Schedule (cron), Webhook, “Lead score > X”, “Order created”, “Low stock” (reuse Retail agent trigger).
- **Steps:** Send WhatsApp, Send email, Update contact/deal, Call API (PayAid endpoints), “Run Groq” (prompt + parse JSON).
- **Templates:** Pre-built “Services Lead Follow-up”, “Weekly digest”, “Low stock reorder” (wrap existing Retail agent).
- **Run engine:** Interpret saved workflow JSON; execute steps in order; respect conditions; rate-limit and log runs.

### Data model (Prisma)

```prisma
model AgentWorkflow {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  trigger     Json     // { type: 'schedule'|'webhook'|'lead_score'|..., config: {...} }
  steps       Json     // [{ id, type, config }, ...]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(...)
  runs        AgentWorkflowRun[]
}

model AgentWorkflowRun {
  id         String   @id @default(cuid())
  workflowId String
  status     String   // running | success | failed
  startedAt  DateTime @default(now())
  endedAt    DateTime?
  logs       Json?    // step-by-step log
  workflow   AgentWorkflow @relation(...)
}
```

### Implementation outline

- `app/crm/[tenantId]/Agents/page.tsx` — List workflows; “New workflow”.
- `app/crm/[tenantId]/Agents/builder/page.tsx` — Canvas with drag-drop (trigger + steps). Save to `AgentWorkflow`.
- `lib/agents/workflow-engine.ts` — Execute workflow from JSON: resolve trigger, run steps, call Groq when step type is `ai`, call WhatsApp/email/API.
- `POST /api/agents/workflows` — CRUD. `POST /api/agents/workflows/[id]/run` — manual run.
- Reuse Retail agent logic as a “block” in the engine (e.g. step type `retail_inventory`).

### Cursor rules

- Max 200 LOC per React component; split into `WorkflowCanvas`, `StepNode`, `TriggerPicker`.
- Use existing `@/lib/ai/groq` and `@/lib/hr/whatsapp-send-internal` (or CRM WhatsApp) for actions.
- India phone formats only; ₹ for any money.

---

## 2. Churn Predictor Dashboard

### Goal

Single dashboard showing at-risk customers (contacts/deals), risk score, reason, and recommended action. Feeds retention playbooks. Target ~90% retention improvement on flagged accounts.

### Core features

- **Risk score (0–100):** Per contact or per account. Factors: declining engagement, support tickets, payment delays, deal slippage, no login in 30d, NPS/feedback (if available).
- **Segment list:** “High risk”, “Medium risk”, “Low risk” with count and total ₹ at risk.
- **Drill-down:** Click segment → list of contacts/accounts with score, reason summary, “Recommended action” (e.g. “Schedule check-in call”, “Send renewal reminder”).
- **Retention actions:** Buttons to create task, send WhatsApp, or enroll in nurture (reuse Phase 1A nurture).

### Data and AI

- **Reuse patterns:** HR has `flight-risk-service`, retention interventions, manager alerts. Mirror for CRM: `lib/crm/churn-predictor.ts` (or `lib/ai/churn-predictor.ts`).
- **Inputs (from existing DB):** Contact lastContactedAt, deal stages/dates, invoice status, interactions count, WhatsApp engagement (whatsappStatus), leadScore trend.
- **Groq:** Optional “reason summary” and “recommended action” from structured inputs. Output JSON: `{ riskScore, reasonSummary, recommendedAction }`.
- **Storage:** Either compute on-demand or cache score in Contact/Account (e.g. `churnRiskScore`, `churnRiskUpdatedAt`, `churnReasonSummary`). Contact already has `churnRisk` (Boolean); extend with numeric score and reason.

### Implementation outline

- `lib/ai/churn-predictor.ts` — Compute risk from Contact + deals + invoices + interactions; optionally call Groq for reason/action.
- `GET /api/crm/churn/dashboard` — Returns segments (high/medium/low), counts, and list of at-risk with score/reason/action.
- `app/crm/[tenantId]/Churn/page.tsx` — Dashboard: KPI cards (at-risk count, ₹ at risk), table or list of at-risk with actions (Create task, Send WhatsApp, Enroll nurture).

### Cursor rules

- Reuse existing Contact fields and APIs. No new tables required for MVP; add `churnRiskScore` (Float), `churnReasonSummary` (String?), `churnRiskUpdatedAt` (DateTime?) on Contact if caching.
- Currency always ₹. Mobile-friendly table (card layout on small screens).

---

## 3. Website Builder v2

### Goal

Pro-quality landing/site in ~60s. Industry-tuned for Indian SMB (retail, F&B, services, manufacturing, ecom). Uses SmartPrompt-style discipline + Groq.

### Core features

- **Industry selector:** Retail, F&B, Services, Manufacturing, Ecom. Pre-filled copy and sections.
- **Sections:** Hero, Features, Pricing (₹ only), Testimonials, CTA, Contact/WhatsApp.
- **SmartPrompt discipline:** Structured system prompt: tone (professional, India SMB), no lorem ipsum, real placeholder copy (e.g. “GST-ready billing”), Indian phone/address format.
- **Output:** HTML or React components (reuse `lib/ai/website-builder.ts`). Option to export or host on PayAid subdomain.

### Implementation outline

- Extend `lib/ai/website-builder.ts`: add `industry` to request; map industry → seed sections and Groq system prompt (India SMB, ₹, no $).
- `app/(marketing or tools)/website-builder-v2/page.tsx` — Form: industry, business name, 1-line description; “Generate” → call generateWebsiteComponents with industry-tuned prompt; show preview.
- **60s target:** Stream or single Groq call; show loading state with “Generating your site…” and progress (sections).

### Cursor rules

- All copy and pricing in ₹. Indian address/phone placeholders.
- Reuse existing `getGroqClient()` and `generateWebsiteComponents`; add industry presets and prompt layer only.

---

## 4. Deployment and success metrics (Week 8)

- **No-Code Agent Builder:** At least 3 templates (Lead follow-up, Low stock, Weekly digest); 1 workflow runnable from UI.
- **Churn Predictor:** Dashboard live; risk score computed for all contacts with sufficient data; at least “Create task” and “Send WhatsApp” actions wired.
- **Website Builder v2:** 5 industries; generate + preview in one flow; output valid HTML/React.

---

## 5. Start here (implementation order)

1. **Churn Predictor** — Add `churnRiskScore`, `churnReasonSummary`, `churnRiskUpdatedAt` to Contact (migration); implement `lib/ai/churn-predictor.ts` and `GET /api/crm/churn/dashboard`; build `app/crm/[tenantId]/Churn/page.tsx`.
2. **No-Code Agent Builder** — Add `AgentWorkflow` and `AgentWorkflowRun`; build canvas UI and `lib/agents/workflow-engine.ts`; wire Retail agent as template.
3. **Website Builder v2** — Add industry presets and India SMB prompts to `lib/ai/website-builder.ts`; add v2 page and preview.

**Deliverable:** Phase 1B feature-complete by Week 8; ready for GTM (Weeks 9–12).

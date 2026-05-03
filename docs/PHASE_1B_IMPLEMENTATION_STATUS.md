# Phase 1B Implementation Status

India SMB only. ₹ INR.

## Done

- **Churn Predictor:** Contact churn fields in schema; `lib/ai/churn-predictor.ts`; `GET /api/crm/churn/dashboard`; `app/crm/[tenantId]/Churn/page.tsx`; Churn in CRM nav.
- **No-Code Agent Builder:** `AgentWorkflow` + `AgentWorkflowRun` in Prisma; `lib/agents/workflow-engine.ts`; CRUD + run APIs; `app/crm/[tenantId]/Agents/builder/page.tsx`; "My workflows" on Agents page.
- **Website Builder v2:** Industry presets (retail, fb, services, manufacturing, ecom) in `lib/ai/website-builder.ts`; India SMB prompts; `POST /api/websites/generate/v2`; `app/website-builder-v2/page.tsx`.

## Pending

- Churn: run migration; optional cron to refresh scores.
- Workflow engine: real send_whatsapp, send_email, update_contact; schedule/webhook triggers.
- Website v2: export/host; streaming UI.
- Workflow templates (Lead follow-up, Low stock, Weekly digest).

# Phase 3B – CRM Zoho-Level Upgrade (Complete)

Summary of changes to bring CRM to enterprise (Zoho) level in **payaid-v3-scratch**.

## 1. Schema (packages/db/prisma/schema.prisma)

- **CrmLead**: added `ownerId`, `phone`; relation to `deals`, `activities`.
- **CrmPipeline** / **CrmPipelineStage**: pipeline with ordered stages (New, Contacted, Proposal, Won, Lost).
- **CrmDeal**: tenantId, pipelineId, stageId, leadId, title, value, closeDate.
- **CrmActivity**: tenantId, leadId, dealId, type (call/email/meeting/whatsapp/task), title, notes, dueAt, status.
- **LeadScoringRule**: tenantId, name, field, operator, value, points, active.
- **SavedView**: tenantId, userId, module, name, filtersJson.

Run: `pnpm db:push` (from scratch root).

## 2. CRM service (apps/web/lib/crmService.ts)

- `getPipeline(ctx)` – default pipeline + stages (created on first use).
- `listDeals(ctx, filters)` – deals with stage and lead.
- `moveDeal(ctx, dealId, stageId)` – update deal stage (invalidates cache).
- `listRecentActivities(ctx, limit)` – activities with lead/deal.
- `createActivity(ctx, data)` – log activity.
- `getDashboard(ctx)` – KPIs (total/new/contacted/won, win rate, avg score, pipeline value, avg deal size, days to close), buckets, scoreBuckets.
- `listSavedViews(ctx, module)` / `saveView(ctx, module, name, filtersJson)`.
- `getLeadSignals(leadIds)` / `updateLeadScores(updates)` / `applyScoringRules(ctx, leadId)`.

Cache keys: `crm-dashboard`, `crm-pipeline`, `crm-activities:{limit}` (Redis + 30–60s TTL).

## 3. Dashboard (apps/web/app/crm/dashboard/page.tsx)

- Uses `getDashboard` and `listRecentActivities` from crmService.
- **KPIs**: Total leads, New, Contacted, Won, Win rate, Avg score; then Pipeline value, Avg deal size, Days to close.
- **Pipeline**: existing MiniKanban (leads by status).
- **Recent leads** + **Bulk AI** card unchanged.
- **Open activities**: last 10 with link to `/crm/activities`.
- **Score distribution**: cold / warm / hot bars (0–25, 26–75, 76–100).

## 4. Pipeline page (apps/web/app/crm/pipeline)

- **Page**: loads pipeline + all deals, renders `PipelineKanban`.
- **PipelineKanban**: one column per stage; deal cards with title, value (formatINR), lead name; “→ Stage” buttons to move deal (POST `/api/crm/move-deal`).

## 5. Activities page (apps/web/app/crm/activities)

- **Page**: `listRecentActivities(ctx, 50)` + “Log activity” dropdown.
- **ActivityFeed**: timeline of activities (type icon, title, related lead/deal, notes, date).
- **LogActivityForm**: “Log activity” → Call / Email / Meeting / Task (POST `/api/crm/activities`).

## 6. Leads list (apps/web/app/crm/leads)

- **Score badge**: hot (76–100), warm (51–75), cold (0–50) with color.
- **Convert to deal**: row menu “Convert to deal” → creates deal in first stage and links lead (POST `/api/crm/convert-to-deal`).
- Existing: search, status filter, Score (AI) button, Edit/Delete.

## 7. API routes (apps/web/app/api/crm/)

- **POST /api/crm/move-deal** – body: `{ dealId, stageId, tenantId }`.
- **POST /api/crm/activities** – body: `{ tenantId, leadId?, dealId?, type, title, notes?, dueAt? }`.
- **POST /api/crm/recalculate-scores** – body: `{ tenantId, leadId }` (applies LeadScoringRules).
- **POST /api/crm/enrich-lead** – body: `{ tenantId, leadId, suggested? }` (stub: optional company update).
- **POST /api/crm/convert-to-deal** – body: `{ tenantId, leadId }` (creates deal in default pipeline first stage).

## 8. Sidebar (apps/web/components/layout/CrmSidebar.tsx)

- Added **Pipeline** and **Activities** links.

## 9. UI / utils

- **formatINR** in `lib/utils.ts` (₹, Lakhs/Crores).
- **RecentActivities** and **ScoreDistribution** in dashboard.
- **Button** in `components/ui/button.tsx` (for Log activity).

## How to test

1. From **payaid-v3-scratch**: `pnpm up-core`, `pnpm db:push`, `pnpm dev:web`.
2. Open `/crm/dashboard` – KPIs, pipeline, recent activities, score distribution.
3. Open `/crm/pipeline` – create a deal from a lead (Leads → Convert to deal), then move between stages.
4. Open `/crm/activities` – log call/email/meeting, see feed.
5. Leads list – score badges, Convert to deal, bulk score (existing).

## Perf

- Dashboard and pipeline use cached service methods (Redis 30–60s).
- List/detail pages use existing cache or short revalidate.
- No heavy client bundles; charts are minimal (sparkline, score bars).

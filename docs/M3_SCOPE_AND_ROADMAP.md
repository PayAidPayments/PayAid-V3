# PayAid V3 — M3 Scope and Roadmap

> **Status:** Planning  
> **Target start:** Q2 2026  
> **Prerequisite:** M2 staging validation complete (marketplace installs ≥ 8, SDR audit trace confirmed, CPQ conversion end-to-end verified in staging)

---

## Overview

M3 builds on the AI-native operating loop (M0/M1) and the CRM surface layer (M2) to deliver **deep analytics, cross-module intelligence, and operational governance** at scale.

The three pillars are:
1. **Revenue Intelligence 2.0** — cohort analysis, LTV forecasting, and deal health scoring
2. **AI Decision Audit & Governance** — full event timeline UI, model decision explanation, human override loop
3. **Operational Completeness** — HR module smoke coverage, Inventory reorder automation, multi-tenant admin console

---

## M3.1 — Revenue Intelligence 2.0

### Goals
- Cohort-based win rate tracking (by industry, deal size, rep, source)
- LTV (Lifetime Value) forecasting using deal history and renewal signals
- AI-powered deal health score (0–100) surfaced in Deal list and detail pages

### APIs
| Route | Method | Description |
|---|---|---|
| `/api/v1/revenue/cohorts` | GET | Win rate by cohort (industry / size / source) with time window |
| `/api/v1/revenue/ltv` | GET | Predicted LTV per contact/account using deal history |
| `/api/v1/revenue/deal-health/[id]` | GET | Real-time deal health score + risk signals |
| `/api/v1/revenue/deal-health/batch` | POST | Bulk health scores for deal list view |

### UI Surfaces
- `crm/[tenantId]/Revenue-Intelligence/page.tsx` — extend existing page with:
  - Band 2: Cohort heatmap (industry × deal-size win rates)
  - Band 3: LTV histogram + top-10 LTV accounts
  - Band 4: Deal health leaderboard (highest risk deals needing attention)
- Deal detail page: deal health score card with explanation chips

### Data Model
- No new Prisma models required — use existing `Deal`, `Contact`, `AuditLog`, `WorkflowExecution`
- LTV model runs as a periodic job (M3 background job spec in `docs/M3_BACKGROUND_JOBS.md`)

### Exit Criteria
- [ ] `GET /api/v1/revenue/cohorts` returns win-rate matrix (p95 < 300ms on 10k deals)
- [ ] Deal health score shown on at least 80% of open deals in staging
- [ ] Cohort heatmap visible in Revenue Intelligence UI

---

## M3.2 — AI Decision Audit & Governance

### Goals
- Surface every AI suggestion (accept / override / ignore) in a queryable timeline
- Let managers review and override AI decisions via a dedicated UI
- Close the DoD item: _"AI suggestion acceptance/override rate"_ in the KPI scorecard

### APIs
| Route | Method | Description |
|---|---|---|
| `/api/v1/ai/decisions` | GET | Paginated list of AI decisions with filters (type, actor, outcome) |
| `/api/v1/ai/decisions/[id]` | GET | Single decision detail + reasoning trace |
| `/api/v1/ai/decisions/[id]/override` | POST | Human override of an AI decision |
| `/api/v1/ai/decisions/stats` | GET | Acceptance rate, override rate, outcome correlation |

### UI Surfaces
- `settings/[tenantId]/Policies/page.tsx` — extend existing Policies page:
  - "Recent AI Decisions" panel: decision log table with type, actor, outcome, timestamp
  - Expand row to show reasoning trace and override form
- New: `crm/[tenantId]/Home/` AI Command Center — acceptance rate sparkline

### Data Model
```sql
-- Extend existing AuditLog with AI-specific fields
-- No new table needed; use entityType: 'ai_decision'
-- afterSnapshot: { type, action, confidence, accepted, override_reason }
```

### Exit Criteria
- [ ] `GET /api/v1/ai/decisions` returns 200 with paginated results
- [ ] Override flow emits `AuditLog` with `changeSummary: 'ai_decision_overridden'`
- [ ] Acceptance rate visible on CRM Home AI Command Center

---

## M3.3 — HR Module Smoke Coverage

### Goals
- Wire HR module APIs to smoke tests (currently untested in M2 gate)
- Ensure `test:m0` or a new `test:m3:smoke` covers HR core paths

### APIs to Cover
| Route | Coverage goal |
|---|---|
| `GET /api/hr/employees` | List + pagination |
| `POST /api/hr/employees` | Create + validation |
| `GET /api/hr/leaves` | List with status filter |
| `POST /api/hr/leaves` | Create + approval flow |
| `GET /api/hr/payroll` | Payroll summary |
| `POST /api/hr/requisitions` | New requisition + approval |

### Test Command
```bash
npm run test:m3:smoke   # new Jest config: jest.m3.smoke.config.js
```

### Exit Criteria
- [ ] HR smoke suite: ≥ 8 tests, all green
- [ ] `test:m3:smoke` added to CI pipeline

---

## M3.4 — Inventory Reorder Automation

### Goals
- Trigger automatic reorder workflows when stock drops below `reorder_level`
- Surface pending reorder approvals in Inventory dashboard

### APIs
| Route | Method | Description |
|---|---|---|
| `/api/v1/inventory/reorder-triggers` | GET | List items below reorder level |
| `/api/v1/inventory/reorder-triggers/[id]/approve` | POST | Approve reorder → create PO draft |
| `/api/inventory/reorder-webhook` | POST | Webhook from supplier confirmation |

### Data Model
- Reuse existing `StockTransfer` + `AuditLog` — no new migrations
- Add `reorder_level` field to `Product` via Prisma migration (optional nullable field)

### UI Surfaces
- `apps/dashboard/app/inventory/[tenantId]/` — add Band 4 reorder alerts card
- Items below threshold: highlighted in red with "Reorder" CTA

### Exit Criteria
- [ ] Reorder trigger detected on stock update
- [ ] Approval emits `AuditLog` with `entityType: 'reorder_request'`

---

## M3.5 — Multi-Tenant Admin Console

### Goals
- Super-admin role can view all tenants, module licenses, and usage metrics
- Tenant-level feature flag management UI (enable/disable `m2_*` gates)

### APIs
| Route | Method | Description |
|---|---|---|
| `/api/admin/tenants` | GET | List all tenants with module license summary |
| `/api/admin/tenants/[id]` | GET | Tenant detail: users, licenses, usage |
| `/api/admin/tenants/[id]/features` | GET/PUT | Read/write tenant feature flags |
| `/api/admin/tenants/[id]/impersonate` | POST | Impersonate tenant (audit-logged) |

### Auth Model
- New `SUPER_ADMIN` role in JWT claims
- All `/api/admin/*` routes gated on `role === 'SUPER_ADMIN'`

### UI Surfaces
- New route: `admin/tenants/page.tsx` — tenant list + usage sparklines
- New route: `admin/tenants/[id]/page.tsx` — tenant detail with feature flag toggles

### Exit Criteria
- [ ] `GET /api/admin/tenants` requires `SUPER_ADMIN` role (403 otherwise)
- [ ] Feature flag toggle emits `AuditLog` with `entityType: 'tenant_feature_change'`
- [ ] Admin console UI renders tenant list with license badges

---

## M3 Exit Criteria (All)

- [ ] `npm run test:m3:smoke` — ≥ 30 tests, all green
- [ ] `npm run typecheck:dashboard` — 0 errors (target)
- [ ] `npm run lint -w dashboard` — ≤ 50 errors (target, down from current ~172)
- [ ] Revenue Intelligence 2.0: cohorts + LTV + deal health in staging
- [ ] AI Decision Audit: decision timeline UI live, override loop closed
- [ ] HR smoke coverage: ≥ 8 tests, 0 failures
- [ ] Inventory reorder triggers: automatic detection + approval flow
- [ ] Multi-tenant admin: tenant list + feature flag management UI

---

## Suggested M3 Execution Order

1. **M3.1** — Revenue cohorts API + UI (highest product value, no schema changes)
2. **M3.2** — AI decision audit (closes DoD governance gap)
3. **M3.3** — HR smoke tests (low effort, removes test coverage gap)
4. **M3.4** — Inventory reorder (medium effort, requires optional migration)
5. **M3.5** — Admin console (highest effort, defer until M3.1–3.3 are validated)

---

## Dependencies

| Item | Dependency |
|---|---|
| Revenue cohorts | M1 revenue APIs (`/api/v1/revenue/funnel`, `velocity`) stable |
| AI decision audit | M0 `AuditLog` schema + `listActionAudit` service |
| Inventory reorder | M2 stock movements stable |
| Admin console | Multi-tenant JWT claims refactor (coordinated with auth team) |

---

*This document is the source of truth for M3 scope. Update exit criteria checkboxes as features ship.*

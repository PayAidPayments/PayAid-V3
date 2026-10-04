# PayAid Customer Specialist Pack (Phase 2)

In-product Business Specialist Pack. Separate from internal NEXUS (`docs/ai/nexus/`).

## Deliverables

| Artifact | Path |
|---|---|
| Divisions | `docs/ai/customer/divisions.json` |
| Agents + entitlement headers | `docs/ai/customer/agents.json` |
| Entitlement contract | `docs/ai/customer/entitlement-header.md` |
| Evaluator (fail closed) | `lib/ai/customer-specialists/evaluate-entitlement.ts` |
| Integrity check | `npm run check:customer-specialists` |

Human docs also required by `AGENTS.md`:

- `docs/ai/payaid-specialists.md`
- `docs/ai/payaid-specialist-router.md`
- `docs/ai/payaid-specialist-permissions.md`
- `docs/ai/agent-routing-matrix.md`

## Divisions (Phase 2)

| Division | Agents | Licensed module(s) |
|---|---|---|
| Sales | Discovery Coach, Deal Strategist, Pipeline Analyst, Proposal Strategist | `sales` and/or `crm` |
| Finance | Bookkeeper, FP&A Analyst | `finance` |
| Marketing | Content Creator, Email Strategist, SEO Specialist | `marketing` |
| Support | Support Responder, Executive Summary Generator | `communication` (+ `analytics` for exec summary) |
| Success | Customer Success Manager | `crm` and/or `sales` |

## Hard rules

1. Fail closed: no licensed module ⇒ agent denied.
2. Draft/advise only. No autonomous send, pay, publish, or delete.
3. Every decision is audit-required.
4. India/GST finance prompts stay draft-first + approval (`guarded-ops` / `external-actions` where relevant).
5. Never route internal NEXUS coding specialists into the product.

## How to evaluate

```ts
import {
  loadCustomerSpecialistCatalog,
  evaluateCustomerSpecialistEntitlement,
} from '@/lib/ai/customer-specialists'

const catalog = loadCustomerSpecialistCatalog()
const decision = evaluateCustomerSpecialistEntitlement({
  catalog,
  agentSlug: 'sales-discovery-coach',
  context: {
    tenantId: 't1',
    userId: 'u1',
    roles: ['member'],
    licensedModules: ['crm'],
    requestedCapability: 'draft',
  },
})
// decision.allowed === true|false
```

## Phase 2 done criteria

- [x] Customer catalog with entitlement headers
- [x] Fail-closed evaluator for missing module/role
- [x] Router + permissions docs for in-product use
- [x] Integrity check script
- [x] Audit required on every agent

## Phase 3 product flows

| Flow | Route | Check |
|---|---|---|
| Sales follow-up draft | `POST /api/ai/customer-flows/sales-follow-up` | Discovery → deal → proposal drafts, never sent |
| GST invoice draft | `POST /api/ai/customer-flows/gst-invoice-draft` | Bookkeeper draft, pending approval, not filed/paid |

Details: `docs/ai/customer/flows.md`  
Integrity: `npm run check:customer-flows`

## Phase 4 thin orchestrator + approval UX

| Item | Path / route |
|---|---|
| Orchestrator docs | `docs/ai/customer/orchestrator.md` |
| Orchestrate API | `POST /api/ai/customer-flows/orchestrate` |
| Pending drafts API | `GET /api/ai/customer-flows/drafts?pending=1` |
| Approve/reject API | `POST /api/ai/customer-flows/drafts/[draftId]/approve` |
| UI | `/ai-studio/[tenantId]/Flows` |
| Integrity | `npm run check:customer-orchestrator` |

## Out of scope (later)

- Live send/pay/filing after approval
- Autonomous payment execution
- Expanding beyond the two Phase 3 runbooks without Product acceptance

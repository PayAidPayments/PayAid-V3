# PayAid Customer Specialist Router

Use this router inside the product AI workspace. Do not use internal NEXUS coding specialists here.

## Invocation algorithm

1. Resolve auth (`tenantId`, `userId`, roles).
2. Resolve `licensedModules` for the tenant.
3. Map user intent → candidate agent slug (see matrix).
4. Call `evaluateCustomerSpecialistEntitlement(...)`.
5. If denied → show reason; do not call the model as that specialist.
6. If allowed → run specialist in `advise` or `draft` mode only.
7. Persist audit row for allow and deny.
8. Persist draft artifact when `actionMode` is `draft`.

## Intent → agent mapping (Phase 2)

| User intent | Agent slug |
|---|---|
| Prepare discovery call / qualify lead | `sales-discovery-coach` |
| Score deal / win plan | `sales-deal-strategist` |
| Pipeline / forecast health | `sales-pipeline-analyst` |
| Draft proposal | `sales-proposal-strategist` |
| Draft invoice / month-end checklist | `finance-bookkeeper` |
| Forecast / variance commentary | `finance-fpa-analyst` |
| Campaign copy / calendar | `marketing-content-creator` |
| Email sequence draft | `marketing-email-strategist` |
| SEO advice | `marketing-seo-specialist` |
| Draft ticket reply | `support-responder` |
| Executive support summary | `support-executive-summary-generator` |
| Renewal / health / expansion advice | `success-customer-success-manager` |

If intent is ambiguous, ask a clarifying question before selecting an agent.

## Denial UX

When denied for module/role:

- State which module license or role is missing.
- Do not leak data from unlicensed modules.
- Offer upgrade/settings path when appropriate.

## Phase 3 product flows

| Intent | Route |
|---|---|
| Full sales follow-up draft pack | `POST /api/ai/customer-flows/sales-follow-up` |
| GST invoice draft (approval pending) | `POST /api/ai/customer-flows/gst-invoice-draft` |

See `docs/ai/customer/flows.md`.

## Phase 4 orchestrator + approvals

| Intent | Route / UI |
|---|---|
| Run customer runbook | `POST /api/ai/customer-flows/orchestrate` |
| List pending drafts | `GET /api/ai/customer-flows/drafts?pending=1` |
| Approve/reject draft | `POST /api/ai/customer-flows/drafts/[draftId]/approve` |
| Operator UI | `/ai-studio/[tenantId]/Flows` |

See `docs/ai/customer/orchestrator.md`.

## Boundary with internal pack

| Pack | Location | Audience |
|---|---|---|
| Internal NEXUS | `docs/ai/nexus/` | Cursor / engineers |
| Customer specialists | `docs/ai/customer/` | Tenant users in-product |

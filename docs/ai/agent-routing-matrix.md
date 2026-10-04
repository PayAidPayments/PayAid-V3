# PayAid Agent Routing Matrix

## Pack selection

| Work context | Pack | Entry |
|---|---|---|
| Engineering ticket in Cursor | Internal NEXUS | `docs/ai/nexus/README.md` |
| Tenant user in product AI | Customer specialists | `docs/ai/customer/README.md` |

Never mix packs in one invocation.

## Internal NEXUS (Phase 1)

| Situation | Runbook slug |
|---|---|
| New/changed route, button, page | `new-page-or-route` |
| Prisma/schema, finance, GST, billing | `schema-or-billing-change` |
| Performance-sensitive change | `performance-pass` |
| Production go/no-go | `release` |
| Live incident | `production-incident` |

## Customer specialists (Phase 2)

| Module licensed | Available agents |
|---|---|
| `crm` | Discovery Coach, Deal Strategist, Proposal Strategist, Customer Success Manager |
| `sales` | Discovery Coach, Deal Strategist, Pipeline Analyst, Proposal Strategist, Customer Success Manager |
| `finance` | Bookkeeper, FP&A Analyst |
| `marketing` | Content Creator, Email Strategist, SEO Specialist |
| `communication` | Support Responder, Executive Summary Generator (also accepts `analytics`) |
| `analytics` | Executive Summary Generator (with communication) |

No license match ⇒ deny.

## Action mode matrix

| Mode | Allowed | Forbidden |
|---|---|---|
| advise | read + recommendations | drafts not required; no send/write |
| draft | create listed `draftTypes` | send/pay/publish/delete |

## Phase 3 product flows

| Flow | Modules | Output |
|---|---|---|
| Sales follow-up draft | `sales` or `crm` | Discovery + deal score + proposal drafts (`not_sent`) |
| GST invoice draft | `finance` (+ manager role) | Invoice draft (`pending_approval`, not filed/paid) |

## Phase 4 orchestrator

| Entry | Purpose |
|---|---|
| `POST /api/ai/customer-flows/orchestrate` | Run a customer runbook with retries/escalation |
| `/ai-studio/[tenantId]/Flows` | Runbook UI + pending draft approvals |
| `POST .../drafts/[draftId]/approve` | Approve/reject pending drafts (still not executable) |

## Quality gates

| Pack | Gate |
|---|---|
| Internal | Missing `shipBlockedWithout` agent ⇒ ship blocked |
| Customer | Entitlement deny ⇒ specialist not invoked; audit still written |
| Customer flows | Missing module/role ⇒ HTTP 403; drafts never executable |

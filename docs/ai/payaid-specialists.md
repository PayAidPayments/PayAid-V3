# PayAid Business Specialists (Customer-Facing)

Primary catalog: `docs/ai/customer/`

This pack is **in-product only**. It is not the Cursor Dev Specialist Pack (`docs/ai/nexus/`).

## Design principles

1. Module-aware and entitlement-aware.
2. Specialists only access tenant data allowed by subscription and role.
3. Sensitive actions are draft-first or require approval.
4. All actions must be logged for auditability.

## Phase 2 roster

| Slug | Name | Division | Mode |
|---|---|---|---|
| `sales-discovery-coach` | Discovery Coach | Sales | draft |
| `sales-deal-strategist` | Deal Strategist | Sales | draft |
| `sales-pipeline-analyst` | Pipeline Analyst | Sales | advise |
| `sales-proposal-strategist` | Proposal Strategist | Sales | draft |
| `finance-bookkeeper` | Bookkeeper | Finance | draft + approval |
| `finance-fpa-analyst` | FP&A Analyst | Finance | draft |
| `marketing-content-creator` | Content Creator | Marketing | draft |
| `marketing-email-strategist` | Email Strategist | Marketing | draft + approval before send |
| `marketing-seo-specialist` | SEO Specialist | Marketing | advise |
| `support-responder` | Support Responder | Support | draft |
| `support-executive-summary-generator` | Executive Summary Generator | Support | draft |
| `success-customer-success-manager` | Customer Success Manager | Success | advise |

## Related docs

- Entitlements: `docs/ai/payaid-specialist-permissions.md`
- Router: `docs/ai/payaid-specialist-router.md`
- Matrix: `docs/ai/agent-routing-matrix.md`
- Header schema: `docs/ai/customer/entitlement-header.md`

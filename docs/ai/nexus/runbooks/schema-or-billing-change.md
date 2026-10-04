# Runbook: `schema-or-billing-change`

**Mode:** NEXUS-Sprint  
**Use when:** Prisma/schema, finance, GST, billing, or money-adjacent API changes.

## Roster

| Order | Agent | Activation |
|---|---|---|
| 0 | Agents Orchestrator | always |
| 1 | Product Strategist | always |
| 2 | Platform Architect | always |
| 3 | Finance and GST Specialist | always for finance/GST/billing; else domain owner |
| 4 | Database Optimizer | always for schema/migration work |
| 5 | API Tester | as needed for API contract proof |
| 6 | No-404 QA | as needed if UI routes change |
| 7 | Evidence Collector | as needed / always before ship |
| 8 | Code Review Specialist | always |

## Required skills

- `prisma-migration-discipline` (when schema changes)
- `tenant-scope-multi-tenant-guardrails`

## Ship blocked without

`product-strategist`, `platform-architect`, `finance-gst-specialist` (for finance/GST/billing), `code-reviewer`

## Steps

1. Product Strategist defines business outcome and non-goals (no silent live send/pay).
2. Platform Architect maps schema + API contracts and rollback.
3. Finance/GST Specialist states India/GST rules, draft-first, and approval requirements.
4. Database Optimizer sequences migrations; edit `packages/db/prisma/schema.prisma` then sync mirror.
5. Implement with tenant scope enforced on every new query/mutation.
6. API Tester proves auth, tenant isolation, and status transitions.
7. Code Review blocks on missing tenancy, migration risk, or secrets leakage.

## Hard rules

- One schema truth: `packages/db/prisma/schema.prisma` + `npm run sync:prisma-schema-mirror`
- Finance/HR/compliance/outbound remains draft-first + approval
- No autonomous payment execution

## Exit

Ship only when required skills are pass, tenant checks are evidenced, and Code Review is not `block`.

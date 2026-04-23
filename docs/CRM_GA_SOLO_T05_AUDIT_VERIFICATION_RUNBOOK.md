# SOLO-T05 Audit Verification Runbook - Mutation Audit Coverage

Date: 2026-04-23  
Owner: Phani  
Scope: verify audit event coverage for Day 5 protected CRM mutations required by queue #6 closure.

## Objective

Confirm that Day 5 high-risk mutation flows emit auditable events with consistent actor, tenant, action, and target metadata.

## Prerequisites

- Day 5 mutation endpoints are reachable in a signed-in tenant context.
- Access to audit-log surface or query endpoint used by this workspace.
- Stable seed records to execute mutation actions safely.

## Audit coverage checks

| ID | Mutation flow | Expected audit signal |
|---|---|---|
| A1 | `POST /api/tasks/bulk-complete` | event present with actor + tenant + affected task ids/count |
| A2 | `POST /api/crm/contacts/bulk-delete` | event present with actor + tenant + deleted contact ids/count |
| A3 | `DELETE /api/contacts/[id]` | event present with actor + tenant + target contact id |
| A4 | `POST /api/crm/contacts/mass-transfer` | event present with actor + tenant + source/target ownership metadata |
| A5 | `POST /api/crm/leads/mass-transfer` | event present with actor + tenant + source/target ownership metadata |
| A6 | `POST /api/crm/leads/mass-delete` | event present with actor + tenant + deleted lead ids/count |
| A7 | `POST /api/crm/leads/mass-update` | event present with actor + tenant + updated lead ids/count |

## Verification method

For each mutation:

1. Execute one deterministic action in tenant scope.
2. Capture response status and timestamp.
3. Query/inspect audit feed for the matching action window.
4. Record event id (or equivalent), action key, actor, and target metadata.

## Results table (fill during execution)

| ID | Mutation result | Audit present | Event/action key | Actor + tenant verified | Notes |
|---|---|---|---|---|---|
| A1 |  |  |  |  |  |
| A2 |  |  |  |  |  |
| A3 |  |  |  |  |  |
| A4 |  |  |  |  |  |
| A5 |  |  |  |  |  |
| A6 |  |  |  |  |  |
| A7 |  |  |  |  |  |

## Evidence mapping

- Primary execution artifact: `docs/evidence/closure/2026-04-23-crm-day5-rbac-audit-runtime-checks.md`
- Optional API payload snippets/screenshots can be appended under the same artifact.

## Closure rule

Queue #6 audit-verification portion can be marked complete only when:

1. all A1-A7 rows have a corresponding audit record,
2. actor and tenant attribution are correct for each row,
3. no missing or malformed audit event remains open.

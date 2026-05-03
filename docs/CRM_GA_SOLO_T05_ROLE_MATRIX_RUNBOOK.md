# SOLO-T05 Role Matrix Runbook - RBAC Coverage

Date: 2026-04-23  
Owner: Phani  
Scope: signed-in role authorization verification for Day 5 queue closure (`docs/LAUNCH_CHECKLIST.md` queue #6).

## Objective

Verify that role-gated CRM mutation endpoints enforce policy consistently for `admin`, `manager`, `rep`, and `read-only` users in the same tenant.

## Prerequisites

- Dashboard app is reachable and signed-in sessions are available for all 4 roles.
- Test tenant has representative CRM records (contacts, leads, tasks, deals).
- API tooling is available (browser devtools, Postman, or curl).
- Day 5 endpoint set from `docs/CRM_GA_SOLO_T05_PREP_RBAC_AUDIT.md` is available for execution.

## Policy baseline

- `admin` and `manager`: allowed on Day 5 protected mutations.
- `rep` and `read-only`: denied with `403` and code `CRM_ROLE_FORBIDDEN`.

## Role matrix checks

Use the same endpoint payload per role where possible to keep comparisons deterministic.

| ID | Endpoint / action | Admin | Manager | Rep | Read-only | Expected |
|---|---|---|---|---|---|---|
| R1 | `POST /api/tasks/bulk-complete` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R2 | `POST /api/crm/contacts/bulk-delete` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R3 | `DELETE /api/contacts/[id]` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R4 | `DELETE /api/deals/[id]` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R5 | `POST /api/crm/contacts/export` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R6 | `POST /api/crm/contacts/mass-transfer` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R7 | `POST /api/crm/leads/mass-transfer` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R8 | `POST /api/crm/leads/mass-delete` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R9 | `POST /api/crm/leads/mass-update` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R10 | `POST /api/crm/scoring/thresholds` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R11 | `POST /api/crm/scoring/rules` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R12 | `PATCH /api/crm/scoring/rules/[id]` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R13 | `POST /api/crm/pipelines` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R14 | `POST /api/crm/pipelines/custom` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |
| R15 | `POST /api/crm/field-layouts` | Allow | Allow | Deny | Deny | Denied roles return `403 CRM_ROLE_FORBIDDEN` |

## Command pack

```powershell
# static RBAC helper regression
npm run test:crm:rbac
```

## Results table (fill during execution)

| ID | Admin | Manager | Rep | Read-only | Signal | Notes |
|---|---|---|---|---|---|---|
| R1 |  |  |  |  |  |  |
| R2 |  |  |  |  |  |  |
| R3 |  |  |  |  |  |  |
| R4 |  |  |  |  |  |  |
| R5 |  |  |  |  |  |  |
| R6 |  |  |  |  |  |  |
| R7 |  |  |  |  |  |  |
| R8 |  |  |  |  |  |  |
| R9 |  |  |  |  |  |  |
| R10 |  |  |  |  |  |  |
| R11 |  |  |  |  |  |  |
| R12 |  |  |  |  |  |  |
| R13 |  |  |  |  |  |  |
| R14 |  |  |  |  |  |  |
| R15 |  |  |  |  |  |  |

## Closure rule

Queue #6 role-matrix portion can be marked complete only when:

1. all rows are executed,
2. denied-role checks consistently return `403 CRM_ROLE_FORBIDDEN`,
3. no role-based contradiction is left unresolved.

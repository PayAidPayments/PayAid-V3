# Customer Specialist Entitlement Header

Every customer agent in `docs/ai/customer/agents.json` must carry this header.

Version: `2026-10-03-v1`

## Required fields

| Field | Type | Rule |
|---|---|---|
| `modulesAny` | string[] | Tenant must be licensed for **at least one**. Empty = invalid. |
| `modulesAll` | string[] | Tenant must be licensed for **all** listed (optional). |
| `minRoles` | string[] | Caller role must match one entry (case-insensitive). |
| `denyWithoutModule` | boolean | Must be `true` for Phase 2. Fail closed. |
| `dataRead` | string[] | Logical data scopes the agent may read. |
| `draftTypes` | string[] | Draft artifacts the agent may create (`actionMode: draft`). |
| `forbiddenCapabilities` | string[] | Always denied for this agent (usually includes `send`). |
| `auditRequired` | boolean | Must be `true`. Every invoke writes an audit record. |
| `requiresApprovalBefore` | string[] | Optional capabilities that need human approval even if later promoted. |

## Action modes

| Mode | Meaning |
|---|---|
| `advise` | Read + recommendations only. No draft persistence required. |
| `draft` | May create draft artifacts only. Never send/pay/publish. |

Customer agents do **not** use an autonomous `approve` or `execute` mode. A human approves outside the agent.

## Approval policy IDs

Must match `lib/ai/platform/workflows/approval-policy.ts`:

- `read-only`
- `draft-first`
- `guarded-ops`
- `external-actions`
- `destructive` (not used by Phase 2 agents)

## Module IDs

Must be members of `ALL_LICENSE_MODULE_IDS` in `lib/modules/catalog.ts`:

`crm`, `sales`, `marketing`, `finance`, `hr`, `communication`, `ai-studio`, `analytics`, `projects`, `inventory`

Support specialists use `communication` as the licensed module.

## Evaluation order (fail closed)

Implemented by `evaluateCustomerSpecialistEntitlement()`:

1. Unknown agent slug → deny (`AGENT_UNKNOWN`)
2. Missing tenant / user → deny (`AUTH_REQUIRED`)
3. `denyWithoutModule` and no licensed module from `modulesAny` → deny (`MODULE_NOT_LICENSED`)
4. Missing any `modulesAll` entry → deny (`MODULE_NOT_LICENSED`)
5. Role not in `minRoles` → deny (`ROLE_DENIED`)
6. Requested capability in `forbiddenCapabilities` → deny (`CAPABILITY_FORBIDDEN`)
7. Otherwise allow, with `auditRequired: true`

## Audit minimum

Every allow or deny decision should be auditable with:

- tenantId, userId, agentSlug
- decision + reason code
- licensed modules considered
- draftType (if any)
- timestamp

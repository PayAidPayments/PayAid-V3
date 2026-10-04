# PayAid Customer Specialist Permissions

Source of truth: entitlement headers in `docs/ai/customer/agents.json`  
Evaluator: `lib/ai/customer-specialists/evaluate-entitlement.ts`  
Policy IDs: `lib/ai/platform/workflows/approval-policy.ts`  
Modules: `lib/modules/catalog.ts`

## Fail-closed defaults

| Condition | Result |
|---|---|
| Unknown specialist slug | Deny (`AGENT_UNKNOWN`) |
| Missing tenantId/userId | Deny (`AUTH_REQUIRED`) |
| Tenant lacks all of `modulesAny` | Deny (`MODULE_NOT_LICENSED`) |
| Tenant lacks any of `modulesAll` | Deny (`MODULE_NOT_LICENSED`) |
| Role outside `minRoles` | Deny (`ROLE_DENIED`) |
| Capability in `forbiddenCapabilities` | Deny (`CAPABILITY_FORBIDDEN`) |
| Unknown draft type | Deny (`DRAFT_TYPE_FORBIDDEN`) |

`denyWithoutModule` is required `true` for every Phase 2 agent.

## Capability policy

Customer specialists may use:

- `read` (advise)
- `draft` (create drafts only)

They must not use autonomously:

- `send`
- `execute`
- `delete`
- `admin`

Finance bookkeeper and support/email strategists may later request `write`/`send` only through human approval flows (`requiresApprovalBefore`).

## Audit requirement

`auditRequired: true` on every agent. Log at least:

- tenantId, userId, agentSlug
- allowed/denied + reasonCode
- matched modules
- draftType if present
- timestamp

## Role baseline

Common role tokens (lowercase match):

- `member`
- `manager`
- `admin`
- `owner`

Finance drafts require `manager`+.

## India / GST note

Finance agents are GST-aware draft assistants. They do not file returns or execute payments.

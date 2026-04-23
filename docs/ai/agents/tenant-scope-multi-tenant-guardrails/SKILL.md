---
name: tenant-scope-multi-tenant-guardrails
description: Verify PayAid multi-tenant safety across routes, queries, and actions so data and actions remain tenant-scoped and role-appropriate. Use when implementing APIs, routing, automation flows, or auditing tenant isolation.
---

# Tenant Scope Multi-tenant Guardrails

## When to use

Use this skill for:

- API or workflow changes that read/write tenant data
- auth/permission-sensitive route work
- module gating and entitlement checks
- tenant isolation audits

## Mandatory routing

1. Run **PayAid Product Strategist**.
2. Run **Platform Architect** if scope crosses modules.
3. Include domain specialist if finance/HR/compliance/outbound actions are in scope.

## Guardrail checklist

```markdown
## Tenant Guardrail Card
- Route/feature:
- Tenant context source (token/path/query):
- Roles/permissions required:

### Checks
- [ ] Tenant identity resolved from trusted source
- [ ] All data reads are tenant-filtered
- [ ] All writes are tenant-filtered and authorized
- [ ] Cross-tenant access paths blocked and tested
- [ ] Module entitlement/license checks applied where required
- [ ] Sensitive actions use draft-first/approval when policy requires
- [ ] Audit logging is present for sensitive operations
```

## Failure classification

- `Critical`: cross-tenant leak possibility or missing authorization on write.
- `High`: read-path scope gap, missing entitlement gate, or bypassable policy.
- `Medium`: missing audit trail or weak rejection messaging.

Any `Critical` result is automatic `NO-GO`.

## Evidence requirements

Provide:

- code path(s) enforcing tenant filters and auth
- test path(s) proving blocked cross-tenant access
- artifact/log path for validation run

---
name: prisma-migration-discipline
description: Enforce safe Prisma schema and migration workflow for PayAid, including deploy order, rollback posture, and verification evidence. Use when changing schema, adding migrations, or validating migration readiness.
---

# Prisma Migration Discipline

## When to use

Use this skill for:

- Prisma schema changes
- new migration creation/review
- migration deploy validation
- pilot/release checks that touch DB structure

## Mandatory routing

1. Run **PayAid Product Strategist** for acceptance/risk framing.
2. Run **Platform Architect** if migration impacts 2+ modules or shared contracts.

## Migration checklist

```markdown
## Migration Discipline Card
- Change intent:
- Affected tables/models:
- Backward compatibility risk: low/medium/high

### Required checks
- [ ] Migration file created and named clearly
- [ ] Apply order documented (dev/staging/prod)
- [ ] Read/write path compatibility verified for rolling deploys
- [ ] Seed/backfill expectations defined (if needed)
- [ ] Verification SQL/tests identified
- [ ] Rollback or mitigation plan documented
- [ ] Evidence artifact saved
```

## Safety rules

- Prefer additive changes before destructive changes.
- Avoid dropping/renaming columns without compatibility strategy.
- Validate tenant-scoped queries remain correct after schema updates.
- Require verification evidence, not only "migration applied" logs.

## Evidence requirements

At minimum, include:

- migration path (`prisma/migrations/...`)
- related code path(s) using the changed model
- verification artifact path (`docs/evidence/...` or SQL verification output)

If verification is missing, status must be `UNVERIFIED`.

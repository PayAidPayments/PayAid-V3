# Logo `logotype` Mismatch DB Remediation Evidence

Date: 2026-04-25  
Environment: Production-linked datasource (`aws-1-ap-northeast-1.pooler.supabase.com:5432`)  
Operator: Cursor agent (automated command execution in repo root)

## Context

Logo save/generation flows failed with:

- `Invalid prisma.logo.create() invocation`
- `The column 'logotype' does not exist in the current database`

Root cause: target database was missing `Logo.logoType` backing schema for current Prisma model.

## Migration deploy execution

Commands run:

1. `npm run db:migrate:status`
2. `npm run db:migrate:deploy`
3. `npm run db:migrate:status`

Observed result:

- Pending before deploy:
  - `20260423195000_add_email_ops_models`
  - `20260423203000_add_email_campaign_sender_policy`
  - `20260425153000_logo_type_backfill`
- Deploy applied all pending migrations successfully.
- Final status: `Database schema is up to date!`

## Targeted schema verification

Verification queries executed through Prisma client:

```sql
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Logo' AND column_name = 'logoType';
```

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Logo' AND indexname = 'Logo_tenantId_logoType_idx';
```

Results:

- `Logo.logoType` exists
- Data type: `USER-DEFINED` with `udt_name = LogoType`
- Nullability: `NO`
- Default: `'VECTOR'::"LogoType"`
- Index exists: `Logo_tenantId_logoType_idx` on `("tenantId", "logoType")`

## Outcome

Database-level mismatch for logo type column/index is remediated and verified.

## Remaining validation (manual UI)

Post-deploy manual checks still required in authenticated app session:

1. Vector Editor save flow
2. AI logo generation flow

If either fails, capture diagnostics ID and API response payload for next triage pass.

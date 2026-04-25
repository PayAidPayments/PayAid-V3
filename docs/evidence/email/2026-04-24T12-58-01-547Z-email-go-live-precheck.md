# Email Go-Live Precheck

- Timestamp: 2026-04-24T12:58:01.547Z
- Workspace: D:\Cursor Projects\PayAid V3
- Timeout per command: 180000 ms
- Overall pass: no

## Gate verdicts

- DB migration reachability (`npm run db:migrate:status`): FAIL
- Runtime readiness (`npm run verify:email-prod-readiness`): PASS

## Readiness artifact

- Markdown: `D:\Cursor Projects\PayAid V3\docs\evidence\email\2026-04-24T12-58-36-344Z-email-prod-readiness.md`
- JSON: `D:\Cursor Projects\PayAid V3\docs\evidence\email\2026-04-24T12-58-36-344Z-email-prod-readiness.json`

## Raw logs

### db-migrate-status

- Command: `npm run db:migrate:status`
- Exit: 1
- Signal: none
- Timed out: no
- Duration ms: 27649

```text
> payaid-v3@0.1.0 db:migrate:status
> prisma migrate status

Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-ap-northeast-1.pooler.supabase.com:5432"

28 migrations found in prisma/migrations
Following migrations have not yet been applied:
20260423195000_add_email_ops_models
20260423203000_add_email_campaign_sender_policy

To apply migrations in development run prisma migrate dev.
To apply migrations in production run prisma migrate deploy.
```

### email-prod-readiness

- Command: `npm run verify:email-prod-readiness`
- Exit: 0
- Signal: none
- Timed out: no
- Duration ms: 8665

```text
> payaid-v3@0.1.0 verify:email-prod-readiness
> node scripts/verify-email-prod-readiness.mjs

{
  "overallReady": true,
  "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T12-58-36-344Z-email-prod-readiness.json",
  "mdPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T12-58-36-344Z-email-prod-readiness.md"
}
```


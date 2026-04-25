# Email Go-Live Precheck

- Timestamp: 2026-04-24T12:59:54.500Z
- Workspace: D:\Cursor Projects\PayAid V3
- Timeout per command: 180000 ms
- Overall pass: yes

## Gate verdicts

- DB migration reachability (`npm run db:migrate:status`): FAIL
- DB state equivalent evidence (`npm run capture:email-db-state`): PASS
- Effective migration gate: PASS
- Runtime readiness (`npm run verify:email-prod-readiness`): PASS

## Readiness artifact

- Markdown: `D:\Cursor Projects\PayAid V3\docs\evidence\email\2026-04-24T13-00-23-709Z-email-prod-readiness.md`
- JSON: `D:\Cursor Projects\PayAid V3\docs\evidence\email\2026-04-24T13-00-23-709Z-email-prod-readiness.json`

## DB state artifact

- Markdown: `D:\Cursor Projects\PayAid V3\docs\evidence\email\2026-04-24T13-00-21-487Z-email-db-state.md`

## Raw logs

### db-migrate-status

- Command: `npm run db:migrate:status`
- Exit: 1
- Signal: none
- Timed out: no
- Duration ms: 23068

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

### capture-email-db-state

- Command: `npm run capture:email-db-state`
- Exit: 0
- Signal: none
- Timed out: no
- Duration ms: 5463

```text
> payaid-v3@0.1.0 capture:email-db-state
> node scripts/capture-email-db-state.mjs

{
  "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T13-00-21-487Z-email-db-state.md",
  "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T13-00-21-487Z-email-db-state.json",
  "connected": true
}
```

### email-prod-readiness

- Command: `npm run verify:email-prod-readiness`
- Exit: 0
- Signal: none
- Timed out: no
- Duration ms: 2494

```text
> payaid-v3@0.1.0 verify:email-prod-readiness
> node scripts/verify-email-prod-readiness.mjs

{
  "overallReady": true,
  "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T13-00-23-709Z-email-prod-readiness.json",
  "mdPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T13-00-23-709Z-email-prod-readiness.md"
}
```


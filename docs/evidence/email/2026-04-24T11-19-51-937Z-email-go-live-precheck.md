# Email Go-Live Precheck

- Timestamp: 2026-04-24T11:19:51.937Z
- Workspace: D:\Cursor Projects\PayAid V3
- Timeout per command: 180000 ms
- Overall pass: no

## Gate verdicts

- DB migration reachability (`npm run db:migrate:status`): FAIL
- Runtime readiness (`npm run verify:email-prod-readiness`): FAIL

## Readiness artifact

- Markdown: `D:\Cursor Projects\PayAid V3\docs\evidence\email\2026-04-24T11-22-41-605Z-email-prod-readiness.md`
- JSON: `D:\Cursor Projects\PayAid V3\docs\evidence\email\2026-04-24T11-22-41-605Z-email-prod-readiness.json`

## Raw logs

### db-migrate-status

- Command: `npm run db:migrate:status`
- Exit: 1
- Signal: none
- Timed out: no
- Duration ms: 88219

```text
> payaid-v3@0.1.0 db:migrate:status
> prisma migrate status

Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-ap-northeast-1.pooler.supabase.com:5432"
```

```text
Error: P1001: Can't reach database server at `aws-1-ap-northeast-1.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-ap-northeast-1.pooler.supabase.com:5432`.
```

### email-prod-readiness

- Command: `npm run verify:email-prod-readiness`
- Exit: 1
- Signal: none
- Timed out: no
- Duration ms: 85923

```text
> payaid-v3@0.1.0 verify:email-prod-readiness
> node scripts/verify-email-prod-readiness.mjs

{
  "overallReady": false,
  "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T11-22-41-605Z-email-prod-readiness.json",
  "mdPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T11-22-41-605Z-email-prod-readiness.md"
}
```


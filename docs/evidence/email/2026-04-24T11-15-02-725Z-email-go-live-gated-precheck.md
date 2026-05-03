# Email Go-Live Gated Precheck

- Timestamp: 2026-04-24T11:15:02.725Z
- Workspace: D:\Cursor Projects\PayAid V3
- Timeout per command: 180000 ms
- Env preflight pass: no
- Heavy precheck executed: no
- Overall pass: no

## Gate behavior

- Heavy precheck skipped because env preflight failed.
- Fix env issues first, then rerun this command.

## Command logs

### env-preflight

- Command: `npm run check:email-precheck-env`
- Exit: 1
- Signal: none
- Timed out: no
- Duration ms: 1039

```text
> payaid-v3@0.1.0 check:email-precheck-env
> node scripts/check-email-precheck-env.mjs

[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔄 add secrets lifecycle management: https://dotenvx.com/ops
[dotenv@17.2.3] injecting env (0) from .env.local -- tip: 🗂️ backup and recover secrets: https://dotenvx.com/ops
{
  "timestamp": "2026-04-24T11:15:03.728Z",
  "nodeEnv": "development",
  "shellCwd": "D:\\Cursor Projects\\PayAid V3",
  "checks": {
    "DATABASE_URL": {
      "present": true,
      "preview": "aws-1-ap-northeast-1.pooler.supabase.com:5432"
    },
    "REDIS_URL": {
      "present": false,
      "preview": "[missing]"
    }
  },
  "readyForPrecheck": false,
  "outputPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T11-15-03-728Z-email-precheck-env-readiness.md"
}
```


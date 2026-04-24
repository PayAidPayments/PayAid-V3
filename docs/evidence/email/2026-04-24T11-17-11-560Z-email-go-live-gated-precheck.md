# Email Go-Live Gated Precheck

- Timestamp: 2026-04-24T11:17:11.560Z
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
- Duration ms: 12100

```text
> payaid-v3@0.1.0 check:email-precheck-env
> node scripts/check-email-precheck-env.mjs

{
  "timestamp": "2026-04-24T11:17:22.917Z",
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
    },
    "UPSTASH_REDIS_REST_URL": {
      "present": true,
      "preview": "beloved-gull-95753.upstash.io:6379"
    },
    "UPSTASH_REDIS_REST_TOKEN": {
      "present": true,
      "preview": "[set len=71]"
    }
  },
  "readyForPrecheck": false,
  "outputPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T11-17-22-917Z-email-precheck-env-readiness.md"
}
```


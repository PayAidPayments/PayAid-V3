# Email Go-Live Gated Precheck

- Timestamp: 2026-04-24T11:19:22.892Z
- Workspace: D:\Cursor Projects\PayAid V3
- Timeout per command: 180000 ms
- Env preflight pass: yes
- Heavy precheck executed: yes
- Overall pass: no

## Gate behavior

## Command logs

### env-preflight

- Command: `npm run check:email-precheck-env`
- Exit: 0
- Signal: none
- Timed out: no
- Duration ms: 27433

```text
> payaid-v3@0.1.0 check:email-precheck-env
> node scripts/check-email-precheck-env.mjs

{
  "timestamp": "2026-04-24T11:19:49.264Z",
  "nodeEnv": "development",
  "shellCwd": "D:\\Cursor Projects\\PayAid V3",
  "checks": {
    "DATABASE_URL": {
      "present": true,
      "preview": "aws-1-ap-northeast-1.pooler.supabase.com:5432"
    },
    "REDIS_URL": {
      "present": true,
      "preview": "beloved-gull-95753.upstash.io:6379"
    },
    "REDIS_URL_SOURCE": {
      "present": true,
      "preview": "derived_from_upstash_rest"
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
  "readyForPrecheck": true,
  "outputPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T11-19-49-264Z-email-precheck-env-readiness.md"
}
```

### go-live-precheck

- Command: `npm run verify:email-go-live-precheck`
- Exit: 1
- Signal: none
- Timed out: no
- Duration ms: 177373

```text
> payaid-v3@0.1.0 verify:email-go-live-precheck
> node scripts/run-email-go-live-precheck.mjs

{
  "outputFile": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T11-19-51-937Z-email-go-live-precheck.md",
  "migrateOk": false,
  "readinessOk": false,
  "overallOk": false,
  "readinessArtifact": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T11-22-41-605Z-email-prod-readiness.md"
}
```


# Email Go-Live Gated Precheck

- Timestamp: 2026-04-24T12:58:00.090Z
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
- Duration ms: 830

```text
> payaid-v3@0.1.0 check:email-precheck-env
> node scripts/check-email-precheck-env.mjs

{
  "timestamp": "2026-04-24T12:58:00.854Z",
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
  "outputPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T12-58-00-854Z-email-precheck-env-readiness.md"
}
```

### go-live-precheck

- Command: `npm run verify:email-go-live-precheck`
- Exit: 1
- Signal: none
- Timed out: no
- Duration ms: 37194

```text
> payaid-v3@0.1.0 verify:email-go-live-precheck
> node scripts/run-email-go-live-precheck.mjs

{
  "outputFile": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T12-58-01-547Z-email-go-live-precheck.md",
  "migrateOk": false,
  "readinessOk": true,
  "overallOk": false,
  "readinessArtifact": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T12-58-36-344Z-email-prod-readiness.md"
}
```


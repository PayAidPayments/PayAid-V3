# Email Go-Live Gated Precheck

- Timestamp: 2026-04-24T11:12:05.620Z
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
- Duration ms: 33913

```text
> payaid-v3@0.1.0 check:email-precheck-env
> node scripts/check-email-precheck-env.mjs

{
  "timestamp": "2026-04-24T11:12:39.485Z",
  "nodeEnv": "unknown",
  "shellCwd": "D:\\Cursor Projects\\PayAid V3",
  "checks": {
    "DATABASE_URL": {
      "present": false,
      "preview": "[missing]"
    },
    "REDIS_URL": {
      "present": false,
      "preview": "[missing]"
    }
  },
  "readyForPrecheck": false,
  "outputPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T11-12-39-485Z-email-precheck-env-readiness.md"
}
```


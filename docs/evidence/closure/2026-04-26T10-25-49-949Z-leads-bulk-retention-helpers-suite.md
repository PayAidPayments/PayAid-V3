# Leads Bulk Retention Helpers Suite

- Captured at: 2026-04-26T10:25:49.949Z
- Command: `npm run run:leads-bulk-retention-helpers-suite:evidence`
- Exit code: 0
- Overall OK: yes
- Effective OK: yes
- Warning only mode: no
- Step timeout (ms): 300000
- Timed out: no

## Summary JSON

```json
{
  "check": "leads-bulk-retention-helpers-suite",
  "overallOk": true,
  "smokeMaxMs": null,
  "smokeWithinBudget": true,
  "smokeLatencyViolation": false,
  "steps": [
    {
      "label": "leads-policy-mirror-regression-test",
      "ok": true,
      "exitCode": 0,
      "elapsedMs": 1232
    },
    {
      "label": "leads-policy-mirror-verifier-test",
      "ok": true,
      "exitCode": 0,
      "elapsedMs": 496
    },
    {
      "label": "leads-timeout-guardrails-regression-test",
      "ok": true,
      "exitCode": 0,
      "elapsedMs": 54292
    },
    {
      "label": "leads-quick-triage-next-action-timeout-guard-smoke",
      "ok": true,
      "exitCode": 0,
      "elapsedMs": 6663
    }
  ]
}
```

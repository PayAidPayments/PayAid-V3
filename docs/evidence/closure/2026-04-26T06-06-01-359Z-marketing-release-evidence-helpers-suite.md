# Marketing Release Evidence Helpers Suite

- Captured at: 2026-04-26T06:06:01.359Z
- Command: `npm run run:marketing-release-evidence-helpers-suite:evidence`
- Exit code: 1
- Overall OK: no
- Effective OK: yes
- Warning only mode: yes

## Summary JSON

```json
{
  "check": "marketing-release-evidence-helpers-suite",
  "overallOk": false,
  "steps": [
    {
      "label": "marketing-warning-flag-resolver-test",
      "ok": true,
      "exitCode": 0,
      "elapsedMs": 1169
    },
    {
      "label": "marketing-evidence-bundle-warn-smoke",
      "ok": false,
      "exitCode": 2147483651,
      "elapsedMs": 607
    }
  ]
}
```

## stderr

```text
# Failed step stderr
AssignProcessToJobObject: (50) The request is not supported.
```

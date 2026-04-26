# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T06:11:18.251Z
- Command: `npm run run:marketing-release-gate-evidence-bundle`
- Overall OK: no
- Effective OK: yes
- Warning only mode: yes
- Include helpers evidence: yes
- Helpers warning only: yes

## Step Results

- Matrix evidence: failed (exit 1)
- Verdict evidence: failed (exit 1)
- Helpers-suite evidence: failed (exit 1) [warning-only]

## Summary JSON

```json
{
  "check": "marketing-release-gate-evidence-bundle",
  "capturedAt": "2026-04-26T06:11:18.251Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": true,
  "includeEvidenceHelpers": true,
  "evidenceHelpersWarningOnly": true,
  "stepTimeoutDefaults": {
    "global": 1,
    "matrix": 1,
    "verdict": 1,
    "helpers": 1
  },
  "overallOk": false,
  "effectiveOk": true,
  "steps": [
    {
      "label": "marketing-gate-profile-matrix-evidence",
      "command": "npm run run:marketing-release-gate:profile:matrix:evidence",
      "ok": false,
      "overallOk": false,
      "warningOnly": false,
      "effectiveOk": false,
      "timedOut": true,
      "timeoutMs": 1,
      "exitCode": 1,
      "elapsedMs": 11,
      "summary": null
    },
    {
      "label": "marketing-gate-verdict-evidence",
      "command": "npm run run:marketing-release-gate-verdict-evidence",
      "ok": false,
      "overallOk": false,
      "warningOnly": false,
      "effectiveOk": false,
      "timedOut": true,
      "timeoutMs": 1,
      "exitCode": 1,
      "elapsedMs": 6,
      "summary": null
    },
    {
      "label": "marketing-evidence-helpers-suite-evidence",
      "command": "npm run run:marketing-release-evidence-helpers-suite:evidence",
      "ok": false,
      "overallOk": false,
      "warningOnly": true,
      "effectiveOk": true,
      "timedOut": true,
      "timeoutMs": 1,
      "exitCode": 1,
      "elapsedMs": 7,
      "summary": null
    }
  ]
}
```

## Matrix stderr

```text
Step "marketing-gate-profile-matrix-evidence" timed out after 1ms.
```

## Verdict stderr

```text
Step "marketing-gate-verdict-evidence" timed out after 1ms.
```

## Helpers-suite stderr

```text
Step "marketing-evidence-helpers-suite-evidence" timed out after 1ms.
```

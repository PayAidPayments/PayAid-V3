# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T08:04:12.465Z
- Command: `npm run run:marketing-release-gate-evidence-bundle`
- Overall OK: no
- Effective OK: no
- Warning only mode: no
- Include helpers evidence: yes
- Helpers warning only: no
- Include latency gate: no
- Latency gate warning only: no

## Step Results

- Matrix evidence: failed (exit 1)
- Verdict evidence: failed (exit 1)
- Helpers-suite evidence: failed (exit 1)
- Latency gate: not included

## Summary JSON

```json
{
  "check": "marketing-release-gate-evidence-bundle",
  "capturedAt": "2026-04-26T08:04:12.465Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": false,
  "includeEvidenceHelpers": true,
  "evidenceHelpersWarningOnly": false,
  "includeLatencyGate": false,
  "latencyGateWarningOnly": false,
  "stepTimeoutDefaults": {
    "global": 1500,
    "matrix": 1500,
    "verdict": 1500,
    "helpers": 1500,
    "latencyGate": 1500
  },
  "overallOk": false,
  "effectiveOk": false,
  "steps": [
    {
      "label": "marketing-gate-profile-matrix-evidence",
      "command": "npm run run:marketing-release-gate:profile:matrix:evidence",
      "ok": false,
      "overallOk": false,
      "warningOnly": false,
      "effectiveOk": false,
      "timedOut": true,
      "timeoutMs": 1500,
      "exitCode": 1,
      "elapsedMs": 1524,
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
      "timeoutMs": 1500,
      "exitCode": 1,
      "elapsedMs": 1529,
      "summary": null
    },
    {
      "label": "marketing-evidence-helpers-suite-evidence",
      "command": "npm run run:marketing-release-evidence-helpers-suite:evidence",
      "ok": false,
      "overallOk": false,
      "warningOnly": false,
      "effectiveOk": false,
      "timedOut": true,
      "timeoutMs": 1500,
      "exitCode": 1,
      "elapsedMs": 1559,
      "summary": null
    }
  ]
}
```

## Matrix stderr

```text
Step "marketing-gate-profile-matrix-evidence" timed out after 1500ms.
```

## Verdict stderr

```text
Step "marketing-gate-verdict-evidence" timed out after 1500ms.
```

## Helpers-suite stderr

```text
Step "marketing-evidence-helpers-suite-evidence" timed out after 1500ms.
```

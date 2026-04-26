# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T08:04:11.176Z
- Command: `npm run run:marketing-release-gate-evidence-bundle`
- Overall OK: no
- Effective OK: yes
- Warning only mode: yes
- Include helpers evidence: no
- Helpers warning only: no
- Include latency gate: no
- Latency gate warning only: yes

## Step Results

- Matrix evidence: failed (exit 1)
- Verdict evidence: failed (exit 1)
- Helpers-suite evidence: not included
- Latency gate: not included

## Summary JSON

```json
{
  "check": "marketing-release-gate-evidence-bundle",
  "capturedAt": "2026-04-26T08:04:11.176Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": true,
  "includeEvidenceHelpers": false,
  "evidenceHelpersWarningOnly": false,
  "includeLatencyGate": false,
  "latencyGateWarningOnly": true,
  "stepTimeoutDefaults": {
    "global": 1500,
    "matrix": 1500,
    "verdict": 1500,
    "helpers": 1500,
    "latencyGate": 1500
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
      "timeoutMs": 1500,
      "exitCode": 1,
      "elapsedMs": 1547,
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
      "elapsedMs": 1528,
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

# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T07:47:44.582Z
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
  "capturedAt": "2026-04-26T07:47:44.582Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": false,
  "includeEvidenceHelpers": true,
  "evidenceHelpersWarningOnly": false,
  "includeLatencyGate": false,
  "latencyGateWarningOnly": false,
  "stepTimeoutDefaults": {
    "global": 180000,
    "matrix": 180000,
    "verdict": 180000,
    "helpers": 180000,
    "latencyGate": 180000
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
      "timedOut": false,
      "timeoutMs": 180000,
      "exitCode": 1,
      "elapsedMs": 4017,
      "summary": {
        "ok": false,
        "overallOk": false,
        "warningOnly": false,
        "exitCode": 1,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T07-44-43-796Z-marketing-release-gate-profile-matrix.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T07-44-43-796Z-marketing-release-gate-profile-matrix.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-gate-profile-matrix.md"
      }
    },
    {
      "label": "marketing-gate-verdict-evidence",
      "command": "npm run run:marketing-release-gate-verdict-evidence",
      "ok": false,
      "overallOk": false,
      "warningOnly": false,
      "effectiveOk": false,
      "timedOut": false,
      "timeoutMs": 180000,
      "exitCode": 1,
      "elapsedMs": 692,
      "summary": {
        "ok": false,
        "overallOk": false,
        "warningOnly": false,
        "pipelineOk": false,
        "pipelineExitCode": 1,
        "verdictReason": "failed_required_step",
        "explainerOk": true,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T07-44-44-447Z-marketing-release-gate-verdict-evidence.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T07-44-44-447Z-marketing-release-gate-verdict-evidence.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-gate-verdict-evidence.md"
      }
    },
    {
      "label": "marketing-evidence-helpers-suite-evidence",
      "command": "npm run run:marketing-release-evidence-helpers-suite:evidence",
      "ok": false,
      "overallOk": false,
      "warningOnly": false,
      "effectiveOk": false,
      "timedOut": true,
      "timeoutMs": 180000,
      "exitCode": 1,
      "elapsedMs": 180077,
      "summary": null
    }
  ]
}
```

## Helpers-suite stderr

```text
Step "marketing-evidence-helpers-suite-evidence" timed out after 180000ms.
```

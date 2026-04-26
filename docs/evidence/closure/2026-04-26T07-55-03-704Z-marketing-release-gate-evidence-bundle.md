# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T07:55:03.704Z
- Command: `npm run run:marketing-release-gate-evidence-bundle`
- Overall OK: no
- Effective OK: yes
- Warning only mode: yes
- Include helpers evidence: yes
- Helpers warning only: yes
- Include latency gate: yes
- Latency gate warning only: yes

## Step Results

- Matrix evidence: failed (exit 1)
- Verdict evidence: failed (exit 1)
- Helpers-suite evidence: failed (exit 1) [warning-only]
- Latency gate: failed (exit 0) [warning-only]

## Summary JSON

```json
{
  "check": "marketing-release-gate-evidence-bundle",
  "capturedAt": "2026-04-26T07:55:03.704Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": true,
  "includeEvidenceHelpers": true,
  "evidenceHelpersWarningOnly": true,
  "includeLatencyGate": true,
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
      "elapsedMs": 1543,
      "summary": null
    },
    {
      "label": "marketing-gate-verdict-evidence",
      "command": "npm run run:marketing-release-gate-verdict-evidence",
      "ok": false,
      "overallOk": false,
      "warningOnly": false,
      "effectiveOk": false,
      "timedOut": false,
      "timeoutMs": 1500,
      "exitCode": 1,
      "elapsedMs": 1321,
      "summary": {
        "ok": false,
        "overallOk": false,
        "warningOnly": false,
        "pipelineOk": false,
        "pipelineExitCode": 1,
        "verdictReason": "failed_required_step",
        "explainerOk": true,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T07-55-01-177Z-marketing-release-gate-verdict-evidence.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T07-55-01-177Z-marketing-release-gate-verdict-evidence.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-gate-verdict-evidence.md"
      }
    },
    {
      "label": "marketing-evidence-helpers-suite-evidence",
      "command": "npm run run:marketing-release-evidence-helpers-suite:evidence",
      "ok": false,
      "overallOk": false,
      "warningOnly": true,
      "effectiveOk": true,
      "timedOut": true,
      "timeoutMs": 1500,
      "exitCode": 1,
      "elapsedMs": 1517,
      "summary": null
    },
    {
      "label": "marketing-evidence-latency-gate",
      "command": "npm run run:marketing-release-evidence-latency-gate",
      "ok": true,
      "overallOk": false,
      "warningOnly": true,
      "effectiveOk": true,
      "timedOut": false,
      "timeoutMs": 1500,
      "exitCode": 0,
      "elapsedMs": 904,
      "summary": {
        "check": "marketing-release-evidence-latency-gate",
        "warningOnly": true,
        "thresholdP95Ms": 600000,
        "p95Ms": 686294,
        "thresholdBreached": true,
        "overallOk": false,
        "effectiveOk": true,
        "rollupCommandOk": true,
        "rollup": {
          "ok": true,
          "sampleCount": 20,
          "sampleWindow": 20,
          "p50Ms": 431230,
          "p95Ms": 686294,
          "latestMs": 715264,
          "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T07-55-03-670Z-marketing-release-evidence-latency-rollup.json",
          "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T07-55-03-670Z-marketing-release-evidence-latency-rollup.md",
          "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-evidence-latency-rollup.md"
        }
      }
    }
  ]
}
```

## Matrix stderr

```text
Step "marketing-gate-profile-matrix-evidence" timed out after 1500ms.
```

## Helpers-suite stderr

```text
Step "marketing-evidence-helpers-suite-evidence" timed out after 1500ms.
```

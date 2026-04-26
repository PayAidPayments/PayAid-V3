# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T10:47:38.444Z
- Command: `npm run run:marketing-release-gate-evidence-bundle`
- Overall OK: no
- Effective OK: yes
- Warning only mode: yes
- Include helpers evidence: yes
- Helpers warning only: yes
- Include latency gate: yes
- Latency gate warning only: yes

## Step Results

- Matrix evidence: failed (exit 0)
- Verdict evidence: failed (exit 0)
- Helpers-suite evidence: failed (exit 1) [warning-only]
- Latency gate: failed (exit 0) [warning-only]

## Summary JSON

```json
{
  "check": "marketing-release-gate-evidence-bundle",
  "capturedAt": "2026-04-26T10:47:38.444Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": true,
  "includeEvidenceHelpers": true,
  "evidenceHelpersWarningOnly": true,
  "includeLatencyGate": true,
  "latencyGateWarningOnly": true,
  "stepTimeoutDefaults": {
    "global": 180000,
    "matrix": 180000,
    "verdict": 180000,
    "helpers": 180000,
    "latencyGate": 180000
  },
  "overallOk": false,
  "effectiveOk": true,
  "steps": [
    {
      "label": "marketing-gate-profile-matrix-evidence",
      "command": "npm run run:marketing-release-gate:profile:matrix:evidence",
      "ok": true,
      "overallOk": false,
      "warningOnly": false,
      "effectiveOk": false,
      "timedOut": false,
      "timeoutMs": 180000,
      "exitCode": 0,
      "elapsedMs": 14802,
      "summary": {
        "ok": true,
        "overallOk": false,
        "warningOnly": true,
        "exitCode": 1,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T10-44-25-450Z-marketing-release-gate-profile-matrix.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T10-44-25-450Z-marketing-release-gate-profile-matrix.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-gate-profile-matrix.md"
      }
    },
    {
      "label": "marketing-gate-verdict-evidence",
      "command": "npm run run:marketing-release-gate-verdict-evidence",
      "ok": true,
      "overallOk": false,
      "warningOnly": false,
      "effectiveOk": false,
      "timedOut": false,
      "timeoutMs": 180000,
      "exitCode": 0,
      "elapsedMs": 5807,
      "summary": {
        "ok": true,
        "overallOk": false,
        "warningOnly": true,
        "pipelineOk": false,
        "pipelineExitCode": 1,
        "verdictReason": "failed_required_step",
        "explainerOk": true,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T10-44-28-837Z-marketing-release-gate-verdict-evidence.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T10-44-28-837Z-marketing-release-gate-verdict-evidence.md",
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
      "timeoutMs": 180000,
      "exitCode": 1,
      "elapsedMs": 180032,
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
      "timeoutMs": 180000,
      "exitCode": 0,
      "elapsedMs": 6421,
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
          "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T10-47-38-418Z-marketing-release-evidence-latency-rollup.json",
          "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T10-47-38-418Z-marketing-release-evidence-latency-rollup.md",
          "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-evidence-latency-rollup.md"
        }
      }
    }
  ]
}
```

## Helpers-suite stderr

```text
Step "marketing-evidence-helpers-suite-evidence" timed out after 180000ms.
```

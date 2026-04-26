# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T06:48:08.712Z
- Command: `npm run run:marketing-release-gate-evidence-bundle`
- Overall OK: no
- Effective OK: no
- Warning only mode: no
- Include helpers evidence: yes
- Helpers warning only: yes
- Include latency gate: yes
- Latency gate warning only: yes

## Step Results

- Matrix evidence: failed (exit 1)
- Verdict evidence: failed (exit 1)
- Helpers-suite evidence: failed (exit 1) [warning-only]
- Latency gate: ok (exit 0) [warning-only]

## Summary JSON

```json
{
  "check": "marketing-release-gate-evidence-bundle",
  "capturedAt": "2026-04-26T06:48:08.712Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": false,
  "includeEvidenceHelpers": true,
  "evidenceHelpersWarningOnly": true,
  "includeLatencyGate": true,
  "latencyGateWarningOnly": true,
  "stepTimeoutDefaults": {
    "global": 90000,
    "matrix": 90000,
    "verdict": 90000,
    "helpers": 90000,
    "latencyGate": 90000
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
      "timeoutMs": 90000,
      "exitCode": 1,
      "elapsedMs": 33346,
      "summary": {
        "ok": false,
        "overallOk": false,
        "warningOnly": false,
        "exitCode": 1,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-46-32-526Z-marketing-release-gate-profile-matrix.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-46-32-526Z-marketing-release-gate-profile-matrix.md",
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
      "timeoutMs": 90000,
      "exitCode": 1,
      "elapsedMs": 1931,
      "summary": {
        "ok": false,
        "overallOk": false,
        "warningOnly": false,
        "pipelineOk": false,
        "pipelineExitCode": 1,
        "verdictReason": "failed_required_step",
        "explainerOk": true,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-46-34-465Z-marketing-release-gate-verdict-evidence.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-46-34-465Z-marketing-release-gate-verdict-evidence.md",
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
      "timeoutMs": 90000,
      "exitCode": 1,
      "elapsedMs": 90110,
      "summary": null
    },
    {
      "label": "marketing-evidence-latency-gate",
      "command": "npm run run:marketing-release-evidence-latency-gate",
      "ok": true,
      "overallOk": true,
      "warningOnly": true,
      "effectiveOk": true,
      "timedOut": false,
      "timeoutMs": 90000,
      "exitCode": 0,
      "elapsedMs": 4096,
      "summary": {
        "check": "marketing-release-evidence-latency-gate",
        "warningOnly": true,
        "thresholdP95Ms": 9999999,
        "p95Ms": 686294,
        "thresholdBreached": false,
        "overallOk": true,
        "effectiveOk": true,
        "rollupCommandOk": true,
        "rollup": {
          "ok": true,
          "sampleCount": 20,
          "sampleWindow": 20,
          "p50Ms": 431230,
          "p95Ms": 686294,
          "latestMs": 715264,
          "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-48-08-665Z-marketing-release-evidence-latency-rollup.json",
          "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-48-08-665Z-marketing-release-evidence-latency-rollup.md",
          "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-evidence-latency-rollup.md"
        }
      }
    }
  ]
}
```

## Helpers-suite stderr

```text
Step "marketing-evidence-helpers-suite-evidence" timed out after 90000ms.
```

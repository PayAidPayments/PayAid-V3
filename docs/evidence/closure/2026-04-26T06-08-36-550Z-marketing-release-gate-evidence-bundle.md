# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T06:08:36.550Z
- Command: `npm run run:marketing-release-gate-evidence-bundle`
- Overall OK: no
- Effective OK: yes
- Warning only mode: yes
- Include helpers evidence: yes
- Helpers warning only: yes

## Step Results

- Matrix evidence: failed (exit 0)
- Verdict evidence: failed (exit 0)
- Helpers-suite evidence: ok (exit 0) [warning-only]

## Summary JSON

```json
{
  "check": "marketing-release-gate-evidence-bundle",
  "capturedAt": "2026-04-26T06:08:36.550Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": true,
  "includeEvidenceHelpers": true,
  "evidenceHelpersWarningOnly": true,
  "stepTimeoutDefaults": {
    "global": 300000,
    "matrix": 300000,
    "verdict": 300000,
    "helpers": 300000
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
      "timeoutMs": 300000,
      "exitCode": 0,
      "elapsedMs": 7459,
      "summary": {
        "ok": true,
        "overallOk": false,
        "warningOnly": true,
        "exitCode": 1,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-08-26-085Z-marketing-release-gate-profile-matrix.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-08-26-085Z-marketing-release-gate-profile-matrix.md",
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
      "timeoutMs": 300000,
      "exitCode": 0,
      "elapsedMs": 5470,
      "summary": {
        "ok": true,
        "overallOk": false,
        "warningOnly": true,
        "pipelineOk": false,
        "pipelineExitCode": 1,
        "verdictReason": "failed_required_step",
        "explainerOk": true,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-08-32-699Z-marketing-release-gate-verdict-evidence.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-08-32-699Z-marketing-release-gate-verdict-evidence.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-gate-verdict-evidence.md"
      }
    },
    {
      "label": "marketing-evidence-helpers-suite-evidence",
      "command": "npm run run:marketing-release-evidence-helpers-suite:evidence",
      "ok": true,
      "overallOk": true,
      "warningOnly": true,
      "effectiveOk": true,
      "timedOut": false,
      "timeoutMs": 300000,
      "exitCode": 0,
      "elapsedMs": 3323,
      "summary": {
        "ok": true,
        "overallOk": true,
        "warningOnly": true,
        "timedOut": false,
        "stepTimeoutMs": 300000,
        "exitCode": 0,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-08-36-160Z-marketing-release-evidence-helpers-suite.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-08-36-160Z-marketing-release-evidence-helpers-suite.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-evidence-helpers-suite.md"
      }
    }
  ]
}
```

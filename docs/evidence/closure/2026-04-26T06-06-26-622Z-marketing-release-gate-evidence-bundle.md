# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T06:06:26.622Z
- Command: `npm run run:marketing-release-gate-evidence-bundle`
- Overall OK: no
- Effective OK: no
- Warning only mode: no
- Include helpers evidence: yes
- Helpers warning only: yes

## Step Results

- Matrix evidence: failed (exit 1)
- Verdict evidence: failed (exit 1)
- Helpers-suite evidence: ok (exit 0) [warning-only]

## Summary JSON

```json
{
  "check": "marketing-release-gate-evidence-bundle",
  "capturedAt": "2026-04-26T06:06:26.622Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": false,
  "includeEvidenceHelpers": true,
  "evidenceHelpersWarningOnly": true,
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
      "exitCode": 1,
      "elapsedMs": 3667,
      "summary": {
        "ok": false,
        "overallOk": false,
        "warningOnly": false,
        "exitCode": 1,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-03-22-507Z-marketing-release-gate-profile-matrix.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-03-22-507Z-marketing-release-gate-profile-matrix.md",
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
      "exitCode": 1,
      "elapsedMs": 604,
      "summary": {
        "ok": false,
        "overallOk": false,
        "warningOnly": false,
        "pipelineOk": false,
        "pipelineExitCode": 1,
        "verdictReason": "failed_required_step",
        "explainerOk": true,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-03-23-050Z-marketing-release-gate-verdict-evidence.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-03-23-050Z-marketing-release-gate-verdict-evidence.md",
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
      "exitCode": 0,
      "elapsedMs": 183409,
      "summary": {
        "ok": true,
        "overallOk": true,
        "warningOnly": false,
        "exitCode": 0,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-06-25-906Z-marketing-release-evidence-helpers-suite.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-06-25-906Z-marketing-release-evidence-helpers-suite.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-evidence-helpers-suite.md"
      }
    }
  ]
}
```

# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-26T06:06:03.092Z
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
  "capturedAt": "2026-04-26T06:06:03.092Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "warningOnly": true,
  "includeEvidenceHelpers": true,
  "evidenceHelpersWarningOnly": true,
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
      "exitCode": 0,
      "elapsedMs": 18538,
      "summary": {
        "ok": true,
        "overallOk": false,
        "warningOnly": true,
        "exitCode": 1,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-05-35-609Z-marketing-release-gate-profile-matrix.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-05-35-609Z-marketing-release-gate-profile-matrix.md",
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
      "exitCode": 0,
      "elapsedMs": 7621,
      "summary": {
        "ok": true,
        "overallOk": false,
        "warningOnly": true,
        "pipelineOk": false,
        "pipelineExitCode": 1,
        "verdictReason": "failed_required_step",
        "explainerOk": true,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-05-43-036Z-marketing-release-gate-verdict-evidence.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-05-43-036Z-marketing-release-gate-verdict-evidence.md",
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
      "elapsedMs": 19682,
      "summary": {
        "ok": true,
        "overallOk": true,
        "warningOnly": true,
        "exitCode": 0,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-06-02-754Z-marketing-release-evidence-helpers-suite.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T06-06-02-754Z-marketing-release-evidence-helpers-suite.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-evidence-helpers-suite.md"
      }
    }
  ]
}
```

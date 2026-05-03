# Marketing Release Gate Evidence Bundle

- Captured at: 2026-04-25T16:20:17.335Z
- Command: `npm run run:marketing-release-gate-evidence-bundle`
- Overall OK: no

## Step Results

- Matrix evidence: failed (exit 1)
- Verdict evidence: failed (exit 1)

## Summary JSON

```json
{
  "check": "marketing-release-gate-evidence-bundle",
  "capturedAt": "2026-04-25T16:20:17.335Z",
  "command": "npm run run:marketing-release-gate-evidence-bundle",
  "overallOk": false,
  "steps": [
    {
      "label": "marketing-gate-profile-matrix-evidence",
      "command": "npm run run:marketing-release-gate:profile:matrix:evidence",
      "ok": false,
      "exitCode": 1,
      "elapsedMs": 15052,
      "summary": {
        "ok": false,
        "exitCode": 1,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-25T16-20-12-128Z-marketing-release-gate-profile-matrix.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-25T16-20-12-128Z-marketing-release-gate-profile-matrix.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-gate-profile-matrix.md"
      }
    },
    {
      "label": "marketing-gate-verdict-evidence",
      "command": "npm run run:marketing-release-gate-verdict-evidence",
      "ok": false,
      "exitCode": 1,
      "elapsedMs": 5037,
      "summary": {
        "ok": false,
        "pipelineOk": false,
        "pipelineExitCode": 1,
        "verdictReason": "failed_required_step",
        "explainerOk": true,
        "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-25T16-20-17-101Z-marketing-release-gate-verdict-evidence.json",
        "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-25T16-20-17-101Z-marketing-release-gate-verdict-evidence.md",
        "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-marketing-release-gate-verdict-evidence.md"
      }
    }
  ]
}
```

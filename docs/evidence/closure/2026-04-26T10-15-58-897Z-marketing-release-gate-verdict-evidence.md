# Marketing Release Gate Verdict Evidence

- Captured at: 2026-04-26T10:15:58.897Z
- Command: `npm run run:marketing-release-gate-verdict-evidence`
- Pipeline exit code: 1
- Pipeline overall OK: no
- Verdict explainer OK: yes
- Effective OK: yes
- Warning only mode: yes

## Pipeline Summary JSON

```json
{
  "check": "marketing-release-gate-pipeline",
  "overallOk": false,
  "verdictReason": "failed_required_step",
  "stepTimeoutDefaults": {
    "global": 300000,
    "socialSmokeEvidence": 300000,
    "socialSmokeHandoffSnippet": 300000,
    "marketingClosurePackStrict": 300000,
    "markerHelpersSuite": 300000,
    "markerGateVerifier": 300000,
    "marketingGateProfileMatrixEvidence": 300000
  },
  "includeMarkerHelpers": false,
  "markerHelpersWarningOnly": false,
  "includeMarkerVerifier": false,
  "markerVerifierWarningOnly": false,
  "includeMatrixEvidence": false,
  "matrixEvidenceWarningOnly": false,
  "skipOptionalAfterFailure": false,
  "steps": [
    {
      "label": "social-smoke-evidence",
      "ok": false,
      "effectiveOk": false,
      "warningOnly": false,
      "skipped": false,
      "skipReason": null,
      "exitCode": 1,
      "elapsedMs": 1764,
      "timeoutMs": 300000,
      "timedOut": false,
      "command": "c:\\Users\\phani\\AppData\\Local\\Programs\\cursor\\resources\\app\\resources\\helpers\\node.exe scripts/run-social-oauth-smoke-evidence.mjs"
    },
    {
      "label": "social-smoke-handoff-snippet",
      "ok": true,
      "effectiveOk": true,
      "warningOnly": false,
      "skipped": false,
      "skipReason": null,
      "exitCode": 0,
      "elapsedMs": 840,
      "timeoutMs": 300000,
      "timedOut": false,
      "command": "c:\\Users\\phani\\AppData\\Local\\Programs\\cursor\\resources\\app\\resources\\helpers\\node.exe scripts/generate-social-oauth-smoke-handoff-snippet.mjs"
    },
    {
      "label": "marketing-closure-pack-strict",
      "ok": false,
      "effectiveOk": false,
      "warningOnly": false,
      "skipped": false,
      "skipReason": null,
      "exitCode": 1,
      "elapsedMs": 1145,
      "timeoutMs": 300000,
      "timedOut": false,
      "command": "c:\\Users\\phani\\AppData\\Local\\Programs\\cursor\\resources\\app\\resources\\helpers\\node.exe scripts/run-marketing-release-closure-pack.mjs"
    }
  ]
}
```

## Verdict Explainer JSON

```json
{
  "ok": true,
  "check": "marketing-release-gate-verdict-explainer",
  "overallOk": false,
  "verdictReason": "failed_required_step",
  "summary": "Required release-gate stage failed; release should remain blocked.",
  "severity": "blocking",
  "failedStep": {
    "label": "social-smoke-evidence",
    "timedOut": false,
    "skipReason": null
  },
  "nextSteps": [
    "Inspect failed step stdout/stderr and resolve root cause.",
    "Re-run gate pipeline after fix."
  ]
}
```

## Pipeline stderr

```text
# Failed step stdout
{
  "ok": false,
  "exitCode": 1,
  "jsonPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T10-15-55-230Z-social-oauth-smoke.json",
  "markdownPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\2026-04-26T10-15-55-230Z-social-oauth-smoke.md",
  "latestIndexPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-social-oauth-smoke.md",
  "handoffSnippetPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure\\latest-social-oauth-smoke-handoff-snippet.md",
  "handoffGeneratorOk": true
}
```

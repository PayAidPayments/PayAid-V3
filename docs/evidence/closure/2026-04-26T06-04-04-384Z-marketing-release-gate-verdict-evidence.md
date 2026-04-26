# Marketing Release Gate Verdict Evidence

- Captured at: 2026-04-26T06:04:04.384Z
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
    "global": 1,
    "socialSmokeEvidence": 1,
    "socialSmokeHandoffSnippet": 1,
    "marketingClosurePackStrict": 1,
    "markerHelpersSuite": 1,
    "markerGateVerifier": 1,
    "marketingGateProfileMatrixEvidence": 1
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
      "elapsedMs": 11,
      "timeoutMs": 1,
      "timedOut": true,
      "command": "c:\\Users\\phani\\AppData\\Local\\Programs\\cursor\\resources\\app\\resources\\helpers\\node.exe scripts/run-social-oauth-smoke-evidence.mjs"
    },
    {
      "label": "social-smoke-handoff-snippet",
      "ok": false,
      "effectiveOk": false,
      "warningOnly": false,
      "skipped": false,
      "skipReason": null,
      "exitCode": 1,
      "elapsedMs": 9,
      "timeoutMs": 1,
      "timedOut": true,
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
      "elapsedMs": 10,
      "timeoutMs": 1,
      "timedOut": true,
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
    "timedOut": true,
    "skipReason": null
  },
  "nextSteps": [
    "Increase step timeout and retry: set step-specific timeout for \"social-smoke-evidence\".",
    "Re-run gate pipeline after fix."
  ]
}
```

## Pipeline stderr

```text
# Failed step stderr
Step "social-smoke-evidence" timed out after 1ms.
```

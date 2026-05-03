# Marketing Release Gate Verdict Evidence

- Captured at: 2026-04-25T16:21:10.108Z
- Command: `npm run run:marketing-release-gate-verdict-evidence`
- Pipeline exit code: 1
- Pipeline overall OK: no
- Verdict explainer OK: yes

## Pipeline Summary JSON

```json
{
  "check": "marketing-release-gate-pipeline",
  "overallOk": false,
  "verdictReason": "failed_required_step",
  "stepTimeoutDefaults": {
    "global": 60000,
    "socialSmokeEvidence": 1,
    "socialSmokeHandoffSnippet": 60000,
    "marketingClosurePackStrict": 60000,
    "markerHelpersSuite": 60000,
    "markerGateVerifier": 60000,
    "marketingGateProfileMatrixEvidence": 60000
  },
  "includeMarkerHelpers": true,
  "markerHelpersWarningOnly": false,
  "includeMarkerVerifier": true,
  "markerVerifierWarningOnly": true,
  "includeMatrixEvidence": true,
  "matrixEvidenceWarningOnly": false,
  "skipOptionalAfterFailure": true,
  "steps": [
    {
      "label": "social-smoke-evidence",
      "ok": false,
      "effectiveOk": false,
      "warningOnly": false,
      "skipped": false,
      "skipReason": null,
      "exitCode": 1,
      "elapsedMs": 9,
      "timeoutMs": 1,
      "timedOut": true,
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
      "elapsedMs": 327,
      "timeoutMs": 60000,
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
      "elapsedMs": 145,
      "timeoutMs": 60000,
      "timedOut": false,
      "command": "c:\\Users\\phani\\AppData\\Local\\Programs\\cursor\\resources\\app\\resources\\helpers\\node.exe scripts/run-marketing-release-closure-pack.mjs"
    },
    {
      "label": "marker-helpers-suite",
      "ok": null,
      "effectiveOk": true,
      "warningOnly": false,
      "skipped": true,
      "skipReason": "skipped_optional_after_prior_failure",
      "exitCode": null,
      "elapsedMs": 0,
      "timeoutMs": 60000,
      "timedOut": false,
      "command": "c:\\Users\\phani\\AppData\\Local\\Programs\\cursor\\resources\\app\\resources\\helpers\\node.exe scripts/run-marker-helpers-suite.mjs"
    },
    {
      "label": "marker-gate-verifier",
      "ok": null,
      "effectiveOk": true,
      "warningOnly": true,
      "skipped": true,
      "skipReason": "skipped_optional_after_prior_failure",
      "exitCode": null,
      "elapsedMs": 0,
      "timeoutMs": 60000,
      "timedOut": false,
      "command": "c:\\Users\\phani\\AppData\\Local\\Programs\\cursor\\resources\\app\\resources\\helpers\\node.exe scripts/verify-marketing-release-gate-marker.mjs"
    },
    {
      "label": "marketing-gate-profile-matrix-evidence",
      "ok": null,
      "effectiveOk": true,
      "warningOnly": false,
      "skipped": true,
      "skipReason": "skipped_optional_after_prior_failure",
      "exitCode": null,
      "elapsedMs": 0,
      "timeoutMs": 60000,
      "timedOut": false,
      "command": "c:\\Users\\phani\\AppData\\Local\\Programs\\cursor\\resources\\app\\resources\\helpers\\node.exe scripts/run-marketing-release-gate-profile-matrix-evidence.mjs"
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

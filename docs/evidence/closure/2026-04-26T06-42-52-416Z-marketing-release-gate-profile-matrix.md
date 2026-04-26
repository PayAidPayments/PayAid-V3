# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-26T06:42:52.416Z
- Command: `npm run run:marketing-release-gate:profile:matrix`
- Exit code: 1
- Overall OK: no
- Effective OK: no
- Warning only mode: no

## Summary JSON

```json
{
  "check": "marketing-release-gate-profile-matrix",
  "overallOk": false,
  "profiles": [
    "baseline",
    "hardened",
    "audit"
  ],
  "results": [
    {
      "profile": "baseline",
      "ok": false,
      "exitCode": 1,
      "elapsedMs": 15231,
      "pipelineOverallOk": false,
      "includeMarkerHelpers": false,
      "includeMarkerVerifier": false,
      "markerHelpersWarningOnly": false,
      "markerVerifierWarningOnly": false
    },
    {
      "profile": "hardened",
      "ok": false,
      "exitCode": 1,
      "elapsedMs": 10788,
      "pipelineOverallOk": false,
      "includeMarkerHelpers": true,
      "includeMarkerVerifier": true,
      "markerHelpersWarningOnly": false,
      "markerVerifierWarningOnly": false
    },
    {
      "profile": "audit",
      "ok": false,
      "exitCode": 1,
      "elapsedMs": 12370,
      "pipelineOverallOk": false,
      "includeMarkerHelpers": true,
      "includeMarkerVerifier": true,
      "markerHelpersWarningOnly": true,
      "markerVerifierWarningOnly": true
    }
  ]
}
```

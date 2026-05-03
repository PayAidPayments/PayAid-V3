# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T15:43:34.962Z
- Command: `npm run run:marketing-release-gate:profile:matrix`
- Exit code: 1
- Overall OK: no

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
      "elapsedMs": 57022,
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
      "elapsedMs": 18688,
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
      "elapsedMs": 58072,
      "pipelineOverallOk": false,
      "includeMarkerHelpers": true,
      "includeMarkerVerifier": true,
      "markerHelpersWarningOnly": true,
      "markerVerifierWarningOnly": true
    }
  ]
}
```

# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T15:42:57.682Z
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
      "elapsedMs": 2202,
      "pipelineOverallOk": null,
      "includeMarkerHelpers": null,
      "includeMarkerVerifier": null,
      "markerHelpersWarningOnly": null,
      "markerVerifierWarningOnly": null
    },
    {
      "profile": "hardened",
      "ok": false,
      "exitCode": 1,
      "elapsedMs": 23285,
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
      "elapsedMs": 34075,
      "pipelineOverallOk": false,
      "includeMarkerHelpers": true,
      "includeMarkerVerifier": true,
      "markerHelpersWarningOnly": true,
      "markerVerifierWarningOnly": true
    }
  ]
}
```

# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T15:47:00.358Z
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
      "elapsedMs": 64804,
      "pipelineOverallOk": false,
      "includeMarkerHelpers": false,
      "includeMarkerVerifier": false,
      "markerHelpersWarningOnly": false,
      "markerVerifierWarningOnly": false
    },
    {
      "profile": "hardened",
      "ok": false,
      "exitCode": 2147483651,
      "elapsedMs": 10115,
      "pipelineOverallOk": null,
      "includeMarkerHelpers": null,
      "includeMarkerVerifier": null,
      "markerHelpersWarningOnly": null,
      "markerVerifierWarningOnly": null
    },
    {
      "profile": "audit",
      "ok": false,
      "exitCode": 2147483651,
      "elapsedMs": 17509,
      "pipelineOverallOk": null,
      "includeMarkerHelpers": null,
      "includeMarkerVerifier": null,
      "markerHelpersWarningOnly": null,
      "markerVerifierWarningOnly": null
    }
  ]
}
```

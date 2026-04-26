# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-26T10:19:29.429Z
- Command: `npm run run:marketing-release-gate:profile:matrix`
- Exit code: 1
- Overall OK: no
- Effective OK: yes
- Warning only mode: yes

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
      "elapsedMs": 617,
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
      "elapsedMs": 2070,
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
      "elapsedMs": 1154,
      "pipelineOverallOk": false,
      "includeMarkerHelpers": true,
      "includeMarkerVerifier": true,
      "markerHelpersWarningOnly": true,
      "markerVerifierWarningOnly": true
    }
  ]
}
```

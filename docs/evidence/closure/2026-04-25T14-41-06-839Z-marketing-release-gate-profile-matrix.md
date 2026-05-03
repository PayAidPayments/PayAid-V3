# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T14:41:06.839Z
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
      "exitCode": 134,
      "elapsedMs": 8214,
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
      "elapsedMs": 1072,
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
      "elapsedMs": 3152,
      "pipelineOverallOk": null,
      "includeMarkerHelpers": null,
      "includeMarkerVerifier": null,
      "markerHelpersWarningOnly": null,
      "markerVerifierWarningOnly": null
    }
  ]
}
```

## stderr

```text
# Failed profile stderr
<--- Last few GCs --->


<--- JS stacktrace --->

FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory
----- Native stack trace -----

 1: 00007FF6EDB418E7 
 2: 00007FF6EDAA212B 
 3: 00007FF6EE6AAE51 
 4: 00007FF6EE697916 
 5: 00007FF6EE4F4060 
 6: 00007FF6EE4ABCBD 
 7: 00007FF6EE4FD2A3 
 8: 00007FF6EE4ED12D 
 9: 00007FF6EE4E8CE5 
10: 00007FF6EDE7273D
```

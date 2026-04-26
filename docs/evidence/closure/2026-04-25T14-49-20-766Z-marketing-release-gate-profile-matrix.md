# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T14:49:20.766Z
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
      "exitCode": 2147483651,
      "elapsedMs": 7233,
      "pipelineOverallOk": null,
      "includeMarkerHelpers": null,
      "includeMarkerVerifier": null,
      "markerHelpersWarningOnly": null,
      "markerVerifierWarningOnly": null
    },
    {
      "profile": "hardened",
      "ok": false,
      "exitCode": 134,
      "elapsedMs": 74317,
      "pipelineOverallOk": null,
      "includeMarkerHelpers": null,
      "includeMarkerVerifier": null,
      "markerHelpersWarningOnly": null,
      "markerVerifierWarningOnly": null
    },
    {
      "profile": "audit",
      "ok": false,
      "exitCode": 134,
      "elapsedMs": 37681,
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
#
# Fatal process out of memory: Re-embedded builtins: set permissions
#
----- Native stack trace -----

 1: 00007FF6EDB418E7 
 2: 00007FF6EDA120FF 
 3: 00007FF6EED11016 
 4: 00007FF6EE6AAEA3 
 5: 00007FF6EE697916 
 6: 00007FF6EE540E5A 
 7: 00007FF6EE567F6A 
 8: 00007FF6EE565F4F 
 9: 00007FF6EE198FF3 
10: 00007FF6EE6A0A41 
11: 00007FF6EDB8098D 
12: 00007FF6EDA4411B 
13: 00007FF6EDAECF99 
14: 00007FF6EDAEBCAE 
15: 00007FF6ED84B01C 
16: 00007FF6EF405E1C 
17: 00007FFBB2E8E8D7 BaseThreadInitThunk+23
18: 00007FFBB428C3FC
```

# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T14:38:41.686Z
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
      "elapsedMs": 11645,
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
      "elapsedMs": 24098,
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
      "elapsedMs": 250688,
      "pipelineOverallOk": false,
      "includeMarkerHelpers": true,
      "includeMarkerVerifier": true,
      "markerHelpersWarningOnly": true,
      "markerVerifierWarningOnly": true
    }
  ]
}
```

## stderr

```text
# Failed profile stderr
<--- Last few GCs --->


<--- JS stacktrace --->



#
# Fatal JavaScript out of memory: MemoryChunk allocation failed during deserialization.
#
----- Native stack trace -----

 1: 00007FF6EDB418E7 
 2: 00007FF6EDA120FF 
 3: 00007FF6EED11016 
 4: 00007FF6EE6AAEA3 
 5: 00007FF6EE697916 
 6: 00007FF6EE4F4060 
 7: 00007FF6EE4BB081 
 8: 00007FF6EE4BB6A0 
 9: 00007FF6EE4BB3A6 
10: 00007FF6EE4A0FEC 
11: 00007FF6EE4E1B96 
12: 00007FF6EE4E1820 
13: 00007FF6EE4E0F08 
14: 00007FF6EE4E0681 
15: 00007FF6EE506C04 
16: 00007FF6EE50754A 
17: 00007FF6EE1B3BFF 
18: 00007FF6EE1B5472 
19: 00007FF6EE1B0F65 
20: 00007FF6EE1B5B0F 
21: 00007FF6EE4FA068 
22: 00007FF6EE191110 
23: 00007FF6EE5663D5 
24: 00007FF6EE198FF3 
25: 00007FF6EE6A0A41 
26: 00007FF6EDB8098D 
27: 00007FF6EDA4411B 
28: 00007FF6EDAECF99 
29: 00007FF6EDAEBCAE 
30: 00007FF6ED84B01C 
31: 00007FF6EF405E1C 
32: 00007FFBB2E8E8D7 BaseThreadInitThunk+23
33: 00007FFBB428C3FC RtlUserThreadStart+44
```

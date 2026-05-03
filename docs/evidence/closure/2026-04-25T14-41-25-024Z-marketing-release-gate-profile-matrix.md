# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T14:41:25.024Z
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
      "elapsedMs": 15267,
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
      "elapsedMs": 13162,
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
      "elapsedMs": 5141,
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
#  C:\WINDOWS\system32\cmd.exe [71244]: class std::shared_ptr<class node::InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const class std::vector<class std::basic_string<char,struct std::char_traits<char>,class std::allocator<char> >,class std::allocator<class std::basic_string<char,struct std::char_traits<char>,class std::allocator<char> > > > &,enum node::ProcessInitializationFlags::Flags) at c:\ws\src\node.cc:1266
  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)

----- Native stack trace -----

 1: 00007FF6EDB418E7 
 2: 00007FF6EDA9F801 
 3: 00007FF6EDAEAB91 
 4: 00007FF6EDAECB2B 
 5: 00007FF6EDAEBCAE 
 6: 00007FF6ED84B01C 
 7: 00007FF6EF405E1C 
 8: 00007FFBB2E8E8D7 BaseThreadInitThunk+23
 9: 00007FFBB428C3FC RtlUserThreadStart+44
```

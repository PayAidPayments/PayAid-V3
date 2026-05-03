# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T15:35:11.988Z
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
      "elapsedMs": 3394,
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
      "elapsedMs": 14315,
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
      "elapsedMs": 3345,
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
#  C:\WINDOWS\system32\cmd.exe [63820]: class std::shared_ptr<class node::InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const class std::vector<class std::basic_string<char,struct std::char_traits<char>,class std::allocator<char> >,class std::allocator<class std::basic_string<char,struct std::char_traits<char>,class std::allocator<char> > > > &,enum node::ProcessInitializationFlags::Flags) at c:\ws\src\node.cc:1266
  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)

----- Native stack trace -----

 1: 00007FF64EA318E7 node::SetCppgcReference+18263
 2: 00007FF64E98F801 v8::base::CPU::num_virtual_address_bits+92545
 3: 00007FF64E9DAB91 node::InitializeOncePerProcess+2881
 4: 00007FF64E9DCB2B node::Start+3739
 5: 00007FF64E9DBCAE node::Start+30
 6: 00007FF64E73B01C AES_cbc_encrypt+151564
 7: 00007FF6502F5E1C inflateValidate+40748
 8: 00007FF9F591E8D7 BaseThreadInitThunk+23
 9: 00007FF9F6BAC3FC RtlUserThreadStart+44
```

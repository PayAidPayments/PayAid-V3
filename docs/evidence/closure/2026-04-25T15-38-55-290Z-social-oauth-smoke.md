# Social OAuth Smoke Evidence

- Captured at: 2026-04-25T15:38:55.290Z
- Command: `npm run run:social-oauth-smoke-pipeline`
- Exit code: 2147483651
- Overall OK: no

## Summary JSON

```json
{
  "parseError": "Pipeline output was not valid JSON",
  "stdout": ""
}
```

## stderr

```text
#
# Fatal process out of memory: Re-embedded builtins: set permissions
#
----- Native stack trace -----

 1: 00007FF64EA318E7 node::SetCppgcReference+18263
 2: 00007FF64E9020FF node::TriggerNodeReport+71583
 3: 00007FF64FC01016 v8::base::FatalOOM+54
 4: 00007FF64F59AEA3 v8::Isolate::ReportExternalAllocationLimitReached+147
 5: 00007FF64F587916 v8::Function::Experimental_IsNopFunction+3302
 6: 00007FF64F430E5A v8::CppHeap::wrapper_descriptor+55594
 7: 00007FF64F457F6A v8::base::CPU::has_sse41+82026
 8: 00007FF64F455F4F v8::base::CPU::has_sse41+73807
 9: 00007FF64F088FF3 v8::base::AddressSpaceReservation::AddressSpaceReservation+12051
10: 00007FF64F590A41 v8::Isolate::Initialize+433
11: 00007FF64EA7098D node::NewContext+397
12: 00007FF64E93411B v8_inspector::protocol::Binary::operator=+128891
13: 00007FF64E9DCF99 node::Start+4873
14: 00007FF64E9DBCAE node::Start+30
15: 00007FF64E73B01C AES_cbc_encrypt+151564
16: 00007FF6502F5E1C inflateValidate+40748
17: 00007FF9F591E8D7 BaseThreadInitThunk+23
18: 00007FF9F6BAC3FC RtlUserThreadStart+44
```

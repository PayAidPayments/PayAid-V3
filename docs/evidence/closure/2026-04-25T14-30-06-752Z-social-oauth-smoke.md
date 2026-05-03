# Social OAuth Smoke Evidence

- Captured at: 2026-04-25T14:30:06.752Z
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

 1: 00007FF6EDB418E7 node::SetCppgcReference+18263
 2: 00007FF6EDA120FF node::TriggerNodeReport+71583
 3: 00007FF6EED11016 v8::base::FatalOOM+54
 4: 00007FF6EE6AAEA3 v8::Isolate::ReportExternalAllocationLimitReached+147
 5: 00007FF6EE697916 v8::Function::Experimental_IsNopFunction+3302
 6: 00007FF6EE540E5A v8::CppHeap::wrapper_descriptor+55594
 7: 00007FF6EE567F6A v8::base::CPU::has_sse41+82026
 8: 00007FF6EE565F4F v8::base::CPU::has_sse41+73807
 9: 00007FF6EE198FF3 v8::base::AddressSpaceReservation::AddressSpaceReservation+12051
10: 00007FF6EE6A0A41 v8::Isolate::Initialize+433
11: 00007FF6EDB8098D node::NewContext+397
12: 00007FF6EDA4411B v8_inspector::protocol::Binary::operator=+128891
13: 00007FF6EDAECF99 node::Start+4873
14: 00007FF6EDAEBCAE node::Start+30
15: 00007FF6ED84B01C AES_cbc_encrypt+151564
16: 00007FF6EF405E1C inflateValidate+40748
17: 00007FFBB2E8E8D7 BaseThreadInitThunk+23
18: 00007FFBB428C3FC RtlUserThreadStart+44
```

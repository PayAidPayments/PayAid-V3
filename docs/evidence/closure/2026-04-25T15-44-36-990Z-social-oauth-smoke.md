# Social OAuth Smoke Evidence

- Captured at: 2026-04-25T15:44:36.990Z
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
# Fatal JavaScript out of memory: MemoryChunk allocation failed during deserialization.
#
----- Native stack trace -----

 1: 00007FF64EA318E7 node::SetCppgcReference+18263
 2: 00007FF64E9020FF node::TriggerNodeReport+71583
 3: 00007FF64FC01016 v8::base::FatalOOM+54
 4: 00007FF64F59AEA3 v8::Isolate::ReportExternalAllocationLimitReached+147
 5: 00007FF64F587916 v8::Function::Experimental_IsNopFunction+3302
 6: 00007FF64F3E4060 v8::internal::StrongRootAllocatorBase::StrongRootAllocatorBase+33904
 7: 00007FF64F3AB081 v8::CpuProfileNode::GetScriptResourceNameStr+3121
 8: 00007FF64F3AB6A0 v8::CpuProfileNode::GetScriptResourceNameStr+4688
 9: 00007FF64F3AB50A v8::CpuProfileNode::GetScriptResourceNameStr+4282
10: 00007FF64F38A49F v8::PrimitiveArray::Length+59039
11: 00007FF64F09A7B9 v8::base::AddressSpaceReservation::AddressSpaceReservation+83673
12: 00007FF64F09A97F v8::base::AddressSpaceReservation::AddressSpaceReservation+84127
13: 00007FF64F38DBD6 v8::PrimitiveArray::Length+73174
14: 00007FF64F38E4D6 v8::PrimitiveArray::Length+75478
15: 00007FF64F455F6D v8::base::CPU::has_sse41+73837
16: 00007FF64F088FF3 v8::base::AddressSpaceReservation::AddressSpaceReservation+12051
17: 00007FF64F590A41 v8::Isolate::Initialize+433
18: 00007FF64EA7098D node::NewContext+397
19: 00007FF64E93411B v8_inspector::protocol::Binary::operator=+128891
20: 00007FF64E9DCF99 node::Start+4873
21: 00007FF64E9DBCAE node::Start+30
22: 00007FF64E73B01C AES_cbc_encrypt+151564
23: 00007FF6502F5E1C inflateValidate+40748
24: 00007FF9F591E8D7 BaseThreadInitThunk+23
25: 00007FF9F6BAC3FC RtlUserThreadStart+44
```

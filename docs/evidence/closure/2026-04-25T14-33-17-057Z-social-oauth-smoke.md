# Social OAuth Smoke Evidence

- Captured at: 2026-04-25T14:33:17.057Z
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

 1: 00007FF6EDB418E7 node::SetCppgcReference+18263
 2: 00007FF6EDA120FF node::TriggerNodeReport+71583
 3: 00007FF6EED11016 v8::base::FatalOOM+54
 4: 00007FF6EE6AAEA3 v8::Isolate::ReportExternalAllocationLimitReached+147
 5: 00007FF6EE697916 v8::Function::Experimental_IsNopFunction+3302
 6: 00007FF6EE4F4060 v8::internal::StrongRootAllocatorBase::StrongRootAllocatorBase+33904
 7: 00007FF6EE4BB081 v8::CpuProfileNode::GetScriptResourceNameStr+3121
 8: 00007FF6EE4BB6A0 v8::CpuProfileNode::GetScriptResourceNameStr+4688
 9: 00007FF6EE4BB50A v8::CpuProfileNode::GetScriptResourceNameStr+4282
10: 00007FF6EE49A49F v8::PrimitiveArray::Length+59039
11: 00007FF6EE1AA7B9 v8::base::AddressSpaceReservation::AddressSpaceReservation+83673
12: 00007FF6EE1AA97F v8::base::AddressSpaceReservation::AddressSpaceReservation+84127
13: 00007FF6EE49DBD6 v8::PrimitiveArray::Length+73174
14: 00007FF6EE49E4D6 v8::PrimitiveArray::Length+75478
15: 00007FF6EE565F6D v8::base::CPU::has_sse41+73837
16: 00007FF6EE198FF3 v8::base::AddressSpaceReservation::AddressSpaceReservation+12051
17: 00007FF6EE6A0A41 v8::Isolate::Initialize+433
18: 00007FF6EDB8098D node::NewContext+397
19: 00007FF6EDA4411B v8_inspector::protocol::Binary::operator=+128891
20: 00007FF6EDAECF99 node::Start+4873
21: 00007FF6EDAEBCAE node::Start+30
22: 00007FF6ED84B01C AES_cbc_encrypt+151564
23: 00007FF6EF405E1C inflateValidate+40748
24: 00007FFBB2E8E8D7 BaseThreadInitThunk+23
25: 00007FFBB428C3FC RtlUserThreadStart+44
```

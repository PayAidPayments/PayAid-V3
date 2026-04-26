# Social OAuth Smoke Evidence

- Captured at: 2026-04-25T15:42:41.648Z
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
<--- Last few GCs --->


<--- JS stacktrace --->



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
 9: 00007FF64F3AB3A6 v8::CpuProfileNode::GetScriptResourceNameStr+3926
10: 00007FF64F390FEC v8::PrimitiveArray::Length+86508
11: 00007FF64F3D1B96 v8::CpuProfileNode::GetScriptResourceNameStr+161606
12: 00007FF64F3D1820 v8::CpuProfileNode::GetScriptResourceNameStr+160720
13: 00007FF64F3D0F08 v8::CpuProfileNode::GetScriptResourceNameStr+158392
14: 00007FF64F3D0681 v8::CpuProfileNode::GetScriptResourceNameStr+156209
15: 00007FF64F0A3B82 v8::base::AddressSpaceReservation::AddressSpaceReservation+121506
16: 00007FF64F0A5472 v8::base::AddressSpaceReservation::AddressSpaceReservation+127890
17: 00007FF64F0A0039 v8::base::AddressSpaceReservation::AddressSpaceReservation+106329
18: 00007FF64F0A4D4C v8::base::AddressSpaceReservation::AddressSpaceReservation+126060
19: 00007FF64F0A5582 v8::base::AddressSpaceReservation::AddressSpaceReservation+128162
20: 00007FF64F0A0039 v8::base::AddressSpaceReservation::AddressSpaceReservation+106329
21: 00007FF64F0A4D4C v8::base::AddressSpaceReservation::AddressSpaceReservation+126060
22: 00007FF64F0A5582 v8::base::AddressSpaceReservation::AddressSpaceReservation+128162
23: 00007FF64F0A0039 v8::base::AddressSpaceReservation::AddressSpaceReservation+106329
24: 00007FF64F0A4D4C v8::base::AddressSpaceReservation::AddressSpaceReservation+126060
25: 00007FF64F0A5582 v8::base::AddressSpaceReservation::AddressSpaceReservation+128162
26: 00007FF64F0A0039 v8::base::AddressSpaceReservation::AddressSpaceReservation+106329
27: 00007FF64F0A4D4C v8::base::AddressSpaceReservation::AddressSpaceReservation+126060
28: 00007FF64F0A5582 v8::base::AddressSpaceReservation::AddressSpaceReservation+128162
29: 00007FF64F0A0039 v8::base::AddressSpaceReservation::AddressSpaceReservation+106329
30: 00007FF64F0A4D4C v8::base::AddressSpaceReservation::AddressSpaceReservation+126060
31: 00007FF64F0A5582 v8::base::AddressSpaceReservation::AddressSpaceReservation+128162
32: 00007FF64F0A0039 v8::base::AddressSpaceReservation::AddressSpaceReservation+106329
33: 00007FF64F0A4D4C v8::base::AddressSpaceReservation::AddressSpaceReservation+126060
34: 00007FF64F0A5582 v8::base::AddressSpaceReservation::AddressSpaceReservation+128162
35: 00007FF64F0A0039 v8::base::AddressSpaceReservation::AddressSpaceReservation+106329
36: 00007FF64F0A4D4C v8::base::AddressSpaceReservation::AddressSpaceReservation+126060
37: 00007FF64F0A5582 v8::base::AddressSpaceReservation::AddressSpaceReservation+128162
38: 00007FF64F0A0F65 v8::base::AddressSpaceReservation::AddressSpaceReservation+110213
39: 00007FF64F0A5B0F v8::base::AddressSpaceReservation::AddressSpaceReservation+129583
40: 00007FF64F3EA068 v8::internal::StrongRootAllocatorBase::StrongRootAllocatorBase+58488
41: 00007FF64F081110 v8::internal::Version::GetString+93328
42: 00007FF64F4563D5 v8::base::CPU::has_sse41+74965
43: 00007FF64F088FF3 v8::base::AddressSpaceReservation::AddressSpaceReservation+12051
44: 00007FF64F590A41 v8::Isolate::Initialize+433
45: 00007FF64EA7098D node::NewContext+397
46: 00007FF64E93411B v8_inspector::protocol::Binary::operator=+128891
47: 00007FF64E9DCF99 node::Start+4873
48: 00007FF64E9DBCAE node::Start+30
49: 00007FF64E73B01C AES_cbc_encrypt+151564
50: 00007FF6502F5E1C inflateValidate+40748
51: 00007FF9F591E8D7 BaseThreadInitThunk+23
52: 00007FF9F6BAC3FC RtlUserThreadStart+44
```

# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T15:36:37.422Z
- Command: `npm run run:marketing-release-gate:profile:matrix`
- Exit code: 2147483651
- Overall OK: no

## Summary JSON

```json
{
  "parseError": "Matrix output was not valid JSON",
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
 9: 00007FF64F3AB122 v8::CpuProfileNode::GetScriptResourceNameStr+3282
10: 00007FF64F3D3B9B v8::CpuProfileNode::GetScriptResourceNameStr+169803
11: 00007FF64F3D3E05 v8::CpuProfileNode::GetScriptResourceNameStr+170421
12: 00007FF64F3D3F56 v8::CpuProfileNode::GetScriptResourceNameStr+170758
13: 00007FF64F3F6422 v8::Isolate::GetHeapProfiler+5794
14: 00007FF64F0A3B46 v8::base::AddressSpaceReservation::AddressSpaceReservation+121446
15: 00007FF64F0A5472 v8::base::AddressSpaceReservation::AddressSpaceReservation+127890
16: 00007FF64F0A0F65 v8::base::AddressSpaceReservation::AddressSpaceReservation+110213
17: 00007FF64F0A5B0F v8::base::AddressSpaceReservation::AddressSpaceReservation+129583
18: 00007FF64F3EA068 v8::internal::StrongRootAllocatorBase::StrongRootAllocatorBase+58488
19: 00007FF64F081110 v8::internal::Version::GetString+93328
20: 00007FF64F4563D5 v8::base::CPU::has_sse41+74965
21: 00007FF64F088FF3 v8::base::AddressSpaceReservation::AddressSpaceReservation+12051
22: 00007FF64F590A41 v8::Isolate::Initialize+433
23: 00007FF64EA7098D node::NewContext+397
24: 00007FF64E93411B v8_inspector::protocol::Binary::operator=+128891
25: 00007FF64E9DCF99 node::Start+4873
26: 00007FF64E9DBCAE node::Start+30
27: 00007FF64E73B01C AES_cbc_encrypt+151564
28: 00007FF6502F5E1C inflateValidate+40748
29: 00007FF9F591E8D7 BaseThreadInitThunk+23
30: 00007FF9F6BAC3FC RtlUserThreadStart+44
```

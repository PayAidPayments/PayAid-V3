# Social OAuth Smoke Evidence

- Captured at: 2026-04-25T14:32:39.969Z
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
# Fatal process out of memory: Oilpan: GCInfoTable resize.
#
----- Native stack trace -----

 1: 00007FF6EDB418E7 node::SetCppgcReference+18263
 2: 00007FF6EDA120FF node::TriggerNodeReport+71583
 3: 00007FF6EED11016 v8::base::FatalOOM+54
 4: 00007FF6EE697721 v8::Function::Experimental_IsNopFunction+2801
 5: 00007FF6EE5324CA v8::CppHeap::EnableDetachedGarbageCollectionsForTesting+2378
 6: 00007FF6EDE7979E cppgc::internal::WeakPersistentPolicy::GetPersistentRegion+78
 7: 00007FF6EDE88309 cppgc::internal::GCInfoTable::Resize+505
 8: 00007FF6EDE87E78 cppgc::internal::GCInfoTable::GCInfoTable+136
 9: 00007FF6EDE88006 cppgc::internal::GlobalGCInfoTable::Initialize+150
10: 00007FF6EDE7987A cppgc::InitializeProcess+74
11: 00007FF6EDAEAA5D node::InitializeOncePerProcess+2573
12: 00007FF6EDAECB2B node::Start+3739
13: 00007FF6EDAEBCAE node::Start+30
14: 00007FF6ED84B01C AES_cbc_encrypt+151564
15: 00007FF6EF405E1C inflateValidate+40748
16: 00007FFBB2E8E8D7 BaseThreadInitThunk+23
17: 00007FFBB428C3FC RtlUserThreadStart+44
```

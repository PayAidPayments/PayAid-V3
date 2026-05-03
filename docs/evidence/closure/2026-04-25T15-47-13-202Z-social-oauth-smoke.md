# Social OAuth Smoke Evidence

- Captured at: 2026-04-25T15:47:13.202Z
- Command: `npm run run:social-oauth-smoke-pipeline`
- Exit code: 134
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
#  C:\WINDOWS\system32\cmd.exe [63208]: class std::unique_ptr<void *,struct std::default_delete<void *> > __cdecl node::WorkerThreadsTaskRunner::DelayedTaskScheduler::Start(void) at c:\ws\src\node_platform.cc:104
  #  Assertion failed: (0) == (uv_thread_create(t.get(), start_thread, this))

----- Native stack trace -----

 1: 00007FF64EA318E7 node::SetCppgcReference+18263
 2: 00007FF64E98F801 v8::base::CPU::num_virtual_address_bits+92545
 3: 00007FF64E903656 node::TriggerNodeReport+77046
 4: 00007FF64E902FDC node::TriggerNodeReport+75388
 5: 00007FF64E9D834E node_api_get_module_file_name+9614
 6: 00007FF64E9DAA07 node::InitializeOncePerProcess+2487
 7: 00007FF64E9DCB2B node::Start+3739
 8: 00007FF64E9DBCAE node::Start+30
 9: 00007FF64E73B01C AES_cbc_encrypt+151564
10: 00007FF6502F5E1C inflateValidate+40748
11: 00007FF9F591E8D7 BaseThreadInitThunk+23
12: 00007FF9F6BAC3FC RtlUserThreadStart+44
```

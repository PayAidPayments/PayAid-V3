# Marketing Release Gate Profile Matrix Evidence

- Captured at: 2026-04-25T14:33:43.570Z
- Command: `npm run run:marketing-release-gate:profile:matrix`
- Exit code: 134
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
#  C:\WINDOWS\system32\cmd.exe [60404]: class std::shared_ptr<class node::InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const class std::vector<class std::basic_string<char,struct std::char_traits<char>,class std::allocator<char> >,class std::allocator<class std::basic_string<char,struct std::char_traits<char>,class std::allocator<char> > > > &,enum node::ProcessInitializationFlags::Flags) at c:\ws\src\node.cc:1266
  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)

----- Native stack trace -----

 1: 00007FF6EDB418E7 node::SetCppgcReference+18263
 2: 00007FF6EDA9F801 v8::base::CPU::num_virtual_address_bits+92545
 3: 00007FF6EDAEAB91 node::InitializeOncePerProcess+2881
 4: 00007FF6EDAECB2B node::Start+3739
 5: 00007FF6EDAEBCAE node::Start+30
 6: 00007FF6ED84B01C AES_cbc_encrypt+151564
 7: 00007FF6EF405E1C inflateValidate+40748
 8: 00007FFBB2E8E8D7 BaseThreadInitThunk+23
 9: 00007FFBB428C3FC RtlUserThreadStart+44
```

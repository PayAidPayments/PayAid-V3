# Social OAuth Smoke Evidence

- Captured at: 2026-04-25T14:43:22.300Z
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

 1: 00007FF6EDB418E7 
 2: 00007FF6EDA120FF 
 3: 00007FF6EED11016 
 4: 00007FF6EE6AAEA3 
 5: 00007FF6EE697916 
 6: 00007FF6EE4F4060 
 7: 00007FF6EE4BB081 
 8: 00007FF6EE4BB6A0 
 9: 00007FF6EE4BB3A6 
10: 00007FF6EE4AAE8B 
11: 00007FF6EE4AA4BA 
12: 00007FF6EE501EA0 
13: 00007FF6EE565F83 
14: 00007FF6EE198FF3 
15: 00007FF6EE6A0A41 
16: 00007FF6EDB8098D 
17: 00007FF6EDA4411B 
18: 00007FF6EDAECF99 
19: 00007FF6EDAEBCAE 
20: 00007FF6ED84B01C 
21: 00007FF6EF405E1C 
22: 00007FFBB2E8E8D7 BaseThreadInitThunk+23
23: 00007FFBB428C3FC RtlUserThreadStart+44
```

# CRM Auth Baseline Run

- Timestamp: 2026-04-18T14:16:16.086Z
- BASE_URL: https://payaid-v3.vercel.app
- Login email: admin@demo.com
- Status: pass
- Reason: none
- Tenant ID: cmjptk2mw0000aocw31u48n64
- Sample count: 15
- Warmup rounds (CRM_AUTH_WARMUP_ROUNDS): 3
- Request timeout ms: 120000

## Raw JSON

```json
{
  "timestamp": "2026-04-18T14:16:16.086Z",
  "baseUrl": "https://payaid-v3.vercel.app",
  "email": "admin@demo.com",
  "status": "pass",
  "reason": "",
  "tenantId": "cmjptk2mw0000aocw31u48n64",
  "sampleCount": 15,
  "warmupRounds": 3,
  "requestTimeoutMs": 120000,
  "healthAttempts": [
    {
      "attempt": 1,
      "ok": true,
      "status": 200
    }
  ],
  "loginAttempts": [
    {
      "attempt": 1,
      "ok": true,
      "tenantId": "cmjptk2mw0000aocw31u48n64"
    }
  ],
  "sampler": {
    "contacts": {
      "ok": true,
      "firstStatus": 200,
      "p50_ms": 2171,
      "p95_ms": 3218,
      "p99_ms": 3218,
      "min_ms": 2105,
      "max_ms": 3218,
      "attempts": [
        {
          "attempt": 1,
          "firstStatus": 200,
          "failed": false,
          "error": "",
          "collected": 15
        }
      ]
    },
    "deals": {
      "ok": true,
      "firstStatus": 200,
      "p50_ms": 1019,
      "p95_ms": 2523,
      "p99_ms": 2523,
      "min_ms": 1002,
      "max_ms": 2523,
      "attempts": [
        {
          "attempt": 1,
          "firstStatus": 200,
          "failed": false,
          "error": "",
          "collected": 15
        }
      ]
    },
    "tasks": {
      "ok": true,
      "firstStatus": 200,
      "p50_ms": 1767,
      "p95_ms": 3787,
      "p99_ms": 3787,
      "min_ms": 1754,
      "max_ms": 3787,
      "attempts": [
        {
          "attempt": 1,
          "firstStatus": 200,
          "failed": false,
          "error": "",
          "collected": 15
        }
      ]
    },
    "tasksRouteUsed": "https://payaid-v3.vercel.app/api/tasks?tenantId=cmjptk2mw0000aocw31u48n64&limit=50&stats=false",
    "tasksFallbackAttempt": null,
    "routes": {
      "contacts": "https://payaid-v3.vercel.app/api/contacts?tenantId=cmjptk2mw0000aocw31u48n64&limit=50",
      "deals": "https://payaid-v3.vercel.app/api/deals?tenantId=cmjptk2mw0000aocw31u48n64&limit=50&stats=false",
      "tasks": "https://payaid-v3.vercel.app/api/tasks?tenantId=cmjptk2mw0000aocw31u48n64&limit=50&stats=false",
      "tasksFallback": "https://payaid-v3.vercel.app/api/crm/tasks?tenantId=cmjptk2mw0000aocw31u48n64&limit=50&stats=false"
    }
  }
}
```

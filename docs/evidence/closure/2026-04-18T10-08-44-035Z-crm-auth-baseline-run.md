# CRM Auth Baseline Run

- Timestamp: 2026-04-18T10:08:44.035Z
- BASE_URL: http://127.0.0.1:3000
- Login email: admin@demo.com
- Status: pass
- Reason: none
- Tenant ID: cmjptk2mw0000aocw31u48n64
- Sample count: 15
- Warmup rounds (CRM_AUTH_WARMUP_ROUNDS): 3
- Request timeout ms: 90000

## Raw JSON

```json
{
  "timestamp": "2026-04-18T10:08:44.035Z",
  "baseUrl": "http://127.0.0.1:3000",
  "email": "admin@demo.com",
  "status": "pass",
  "reason": "",
  "tenantId": "cmjptk2mw0000aocw31u48n64",
  "sampleCount": 15,
  "warmupRounds": 3,
  "requestTimeoutMs": 90000,
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
      "ok": false,
      "status": 504,
      "reason": "Login request timed out. The server may be experiencing high load or a cold start. Please try again in a moment."
    },
    {
      "attempt": 2,
      "ok": true,
      "tenantId": "cmjptk2mw0000aocw31u48n64"
    }
  ],
  "sampler": {
    "contacts": {
      "ok": true,
      "firstStatus": 200,
      "p50_ms": 613,
      "p95_ms": 636,
      "p99_ms": 636,
      "min_ms": 606,
      "max_ms": 636,
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
      "p50_ms": 611,
      "p95_ms": 725,
      "p99_ms": 725,
      "min_ms": 599,
      "max_ms": 725,
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
      "p50_ms": 1268,
      "p95_ms": 1421,
      "p99_ms": 1421,
      "min_ms": 1214,
      "max_ms": 1421,
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
    "tasksRouteUsed": "http://127.0.0.1:3000/api/tasks?tenantId=cmjptk2mw0000aocw31u48n64&limit=50&stats=false",
    "tasksFallbackAttempt": null,
    "routes": {
      "contacts": "http://127.0.0.1:3000/api/contacts?tenantId=cmjptk2mw0000aocw31u48n64&limit=50",
      "deals": "http://127.0.0.1:3000/api/deals?tenantId=cmjptk2mw0000aocw31u48n64&limit=50&stats=false",
      "tasks": "http://127.0.0.1:3000/api/tasks?tenantId=cmjptk2mw0000aocw31u48n64&limit=50&stats=false",
      "tasksFallback": "http://127.0.0.1:3000/api/crm/tasks?tenantId=cmjptk2mw0000aocw31u48n64&limit=50&stats=false"
    }
  }
}
```

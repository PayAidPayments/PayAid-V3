# CRM Auth Baseline Run

- Timestamp: 2026-04-15T14:45:06.557Z
- BASE_URL: https://payaid-v3.vercel.app
- Login email: crm.baseline.20260415170724@payaid.local
- Status: blocked
- Reason: Inline auth sampler failed for one or more endpoints
- Tenant ID: cmnzz7e2g0001mhvlhclm4jno
- Sample count: 1
- Request timeout ms: 20000

## Raw JSON

```json
{
  "timestamp": "2026-04-15T14:45:06.557Z",
  "baseUrl": "https://payaid-v3.vercel.app",
  "email": "crm.baseline.20260415170724@payaid.local",
  "status": "blocked",
  "reason": "Inline auth sampler failed for one or more endpoints",
  "tenantId": "cmnzz7e2g0001mhvlhclm4jno",
  "sampleCount": 1,
  "requestTimeoutMs": 20000,
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
      "tenantId": "cmnzz7e2g0001mhvlhclm4jno"
    }
  ],
  "sampler": {
    "contacts": {
      "ok": true,
      "firstStatus": 200,
      "p50_ms": 6228,
      "p95_ms": 6228,
      "p99_ms": 6228,
      "min_ms": 6228,
      "max_ms": 6228,
      "attempts": [
        {
          "attempt": 1,
          "firstStatus": 200,
          "failed": false,
          "error": "",
          "collected": 1
        }
      ]
    },
    "deals": {
      "ok": true,
      "firstStatus": 200,
      "p50_ms": 6207,
      "p95_ms": 6207,
      "p99_ms": 6207,
      "min_ms": 6207,
      "max_ms": 6207,
      "attempts": [
        {
          "attempt": 1,
          "firstStatus": 200,
          "failed": false,
          "error": "",
          "collected": 1
        }
      ]
    },
    "tasks": {
      "ok": false,
      "firstStatus": 0,
      "attempts": [
        {
          "attempt": 1,
          "firstStatus": 500,
          "failed": true,
          "error": "HTTP 500",
          "collected": 0
        }
      ]
    },
    "tasksRouteUsed": "https://payaid-v3.vercel.app/api/crm/tasks?tenantId=cmnzz7e2g0001mhvlhclm4jno&limit=50&stats=false",
    "tasksFallbackAttempt": {
      "ok": false,
      "firstStatus": 0,
      "attempts": [
        {
          "attempt": 1,
          "firstStatus": 500,
          "failed": true,
          "error": "HTTP 500",
          "collected": 0
        }
      ]
    },
    "routes": {
      "contacts": "https://payaid-v3.vercel.app/api/contacts?tenantId=cmnzz7e2g0001mhvlhclm4jno&limit=50",
      "deals": "https://payaid-v3.vercel.app/api/deals?tenantId=cmnzz7e2g0001mhvlhclm4jno&limit=50",
      "tasks": "https://payaid-v3.vercel.app/api/tasks?tenantId=cmnzz7e2g0001mhvlhclm4jno&limit=50&stats=false",
      "tasksFallback": "https://payaid-v3.vercel.app/api/crm/tasks?tenantId=cmnzz7e2g0001mhvlhclm4jno&limit=50&stats=false"
    }
  }
}
```

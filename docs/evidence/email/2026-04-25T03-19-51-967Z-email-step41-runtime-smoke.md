# Email Step 4.1 Runtime Smoke

- Timestamp: 2026-04-25T03:19:51.967Z
- BASE_URL: https://payaid-v3.vercel.app
- TENANT_ID: cmjptk2mw0000aocw31u48n64
- EMAIL_CAMPAIGN_ID: cmoczj4oi0001kax6e3a13lvz
- EMAIL_RETRY_JOB_ID: [not set]
- AUTH_TOKEN present: yes

## Endpoint checks

- progress: FAIL (GET 500 in 1891ms)
- failed-jobs: PASS (GET 200 in 1492ms)
- retry-history: PASS (GET 200 in 1767ms)

## Raw responses

### progress

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/progress?tenantId=cmjptk2mw0000aocw31u48n64
- Method: GET
- Status: 500
- Duration ms: 1891

```text
{"success":false,"error":"Failed to fetch campaign progress"}
```

### failed-jobs

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/failed-jobs?tenantId=cmjptk2mw0000aocw31u48n64&limit=20
- Method: GET
- Status: 200
- Duration ms: 1492

```text
{"success":true,"data":{"jobs":[],"pagination":{"page":1,"pageSize":25,"total":0,"totalPages":0}}}
```

### retry-history

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/retry-history?tenantId=cmjptk2mw0000aocw31u48n64&limit=20
- Method: GET
- Status: 200
- Duration ms: 1767

```text
{"success":true,"data":{"items":[]}}
```


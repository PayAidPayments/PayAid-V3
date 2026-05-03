# Email Step 4.1 Runtime Smoke

- Timestamp: 2026-04-25T05:03:53.753Z
- BASE_URL: https://payaid-v3.vercel.app
- TENANT_ID: cmjptk2mw0000aocw31u48n64
- EMAIL_CAMPAIGN_ID: cmoczj4oi0001kax6e3a13lvz
- EMAIL_RETRY_JOB_ID: [not set]
- AUTH_TOKEN present: yes

## Endpoint checks

- progress: PASS (GET 200 in 3144ms)
- failed-jobs: PASS (GET 200 in 2069ms)
- retry-history: PASS (GET 200 in 1778ms)

## Raw responses

### progress

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/progress?tenantId=cmjptk2mw0000aocw31u48n64
- Method: GET
- Status: 200
- Duration ms: 3144

```text
{"success":true,"data":{"campaign":{"id":"cmoczj4oi0001kax6e3a13lvz","name":"Test","status":"scheduled","recipientCount":191,"sent":0,"delivered":0,"bounced":0,"scheduledFor":"2026-04-25T02:00:00.000Z","sentAt":null,"createdAt":"2026-04-24T14:07:39.379Z","updatedAt":"2026-04-24T14:07:39.379Z"},"queue":{"total":0,"pending":0,"processing":0,"sent":0,"failed":0,"deadLetter":0,"completed":0,"completionPercent":0,"isComplete":false,"topFailureReasons":[]}}}
```

### failed-jobs

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/failed-jobs?tenantId=cmjptk2mw0000aocw31u48n64&limit=20
- Method: GET
- Status: 200
- Duration ms: 2069

```text
{"success":true,"data":{"jobs":[],"pagination":{"page":1,"pageSize":25,"total":0,"totalPages":0}}}
```

### retry-history

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/retry-history?tenantId=cmjptk2mw0000aocw31u48n64&limit=20
- Method: GET
- Status: 200
- Duration ms: 1778

```text
{"success":true,"data":{"items":[]}}
```


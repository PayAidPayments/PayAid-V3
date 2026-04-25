# Step 4.1 Routes Live Check

- Timestamp: 2026-04-25T03:55:20.105Z
- BASE_URL: https://payaid-v3.vercel.app
- TENANT_ID: cmjptk2mw0000aocw31u48n64
- EMAIL_CAMPAIGN_ID: cmoczj4oi0001kax6e3a13lvz
- All routes non-404: yes

## Route results

- progress: status=200 ok=yes (4975ms)
- failed-jobs: status=200 ok=yes (2656ms)
- retry-history: status=200 ok=yes (2084ms)

## Body previews

### progress

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/progress?tenantId=cmjptk2mw0000aocw31u48n64
- Status: 200

```text
{"success":true,"data":{"campaign":{"id":"cmoczj4oi0001kax6e3a13lvz","name":"Test","status":"scheduled","recipientCount":191,"sent":0,"delivered":0,"bounced":0,"scheduledFor":"2026-04-25T02:00:00.000Z","sentAt":null,"createdAt":"2026-04-24T14:07:39.379Z","updatedAt":"2026-04-24T14:07:39.379Z"},"queue":{"total":0,"pending":0,"processing":0,"sent":0,"failed":0,"deadLetter":0,"completed":0,"completio
```

### failed-jobs

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/failed-jobs?tenantId=cmjptk2mw0000aocw31u48n64
- Status: 200

```text
{"success":true,"data":{"jobs":[],"pagination":{"page":1,"pageSize":25,"total":0,"totalPages":0}}}
```

### retry-history

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/retry-history?tenantId=cmjptk2mw0000aocw31u48n64
- Status: 200

```text
{"success":true,"data":{"items":[]}}
```


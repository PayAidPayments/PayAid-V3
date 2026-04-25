# Step 4.1 Routes Live Check

- Timestamp: 2026-04-25T03:39:51.586Z
- BASE_URL: https://payaid-v3.vercel.app
- TENANT_ID: cmjptk2mw0000aocw31u48n64
- EMAIL_CAMPAIGN_ID: cmoczj4oi0001kax6e3a13lvz
- All routes non-404: yes

## Route results

- progress: status=500 ok=no (2595ms)
- failed-jobs: status=200 ok=yes (1226ms)
- retry-history: status=200 ok=yes (1757ms)

## Body previews

### progress

- URL: https://payaid-v3.vercel.app/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/progress?tenantId=cmjptk2mw0000aocw31u48n64
- Status: 500

```text
{"success":false,"error":"Failed to fetch campaign progress"}
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


# Email Step 4.1 Runtime Smoke

- Timestamp: 2026-04-24T14:09:38.429Z
- BASE_URL: http://localhost:3000
- TENANT_ID: cmo9lebrp0001qjwe54slsy4d
- EMAIL_CAMPAIGN_ID: cmoczj4oi0001kax6e3a13lvz
- EMAIL_RETRY_JOB_ID: [not set]
- AUTH_TOKEN present: yes

## Endpoint checks

- progress: FAIL (GET ERR in 20034ms)
- failed-jobs: FAIL (GET ERR in 20006ms)
- retry-history: FAIL (GET ERR in 20014ms)

## Raw responses

### progress

- URL: http://localhost:3000/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/progress?tenantId=cmo9lebrp0001qjwe54slsy4d
- Method: GET
- Status: ERR
- Duration ms: 20034

```text
The operation was aborted due to timeout
```

### failed-jobs

- URL: http://localhost:3000/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/failed-jobs?tenantId=cmo9lebrp0001qjwe54slsy4d&limit=20
- Method: GET
- Status: ERR
- Duration ms: 20006

```text
The operation was aborted due to timeout
```

### retry-history

- URL: http://localhost:3000/api/marketing/email-campaigns/cmoczj4oi0001kax6e3a13lvz/retry-history?tenantId=cmo9lebrp0001qjwe54slsy4d&limit=20
- Method: GET
- Status: ERR
- Duration ms: 20014

```text
The operation was aborted due to timeout
```


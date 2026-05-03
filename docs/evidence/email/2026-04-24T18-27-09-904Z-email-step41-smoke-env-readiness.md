# Email Step 4.1 Smoke Env Readiness

- Timestamp: 2026-04-24T18:27:09.904Z
- Ready: no

## Checks

- baseUrl: present (source=BASE_URL, preview=http://localhost:3000)
- tenantId: present (source=TENANT_ID, preview=cmjptk2mw0000aocw31u48n64)
- authToken: missing (source=[missing], preview=[missing])
- emailCampaignId: present (source=EMAIL_CAMPAIGN_ID, preview=cmoczj4oi0001kax6e3a13lvz)
- emailRetryJobId: missing (source=[optional-missing], preview=[optional-missing])

## Raw JSON

```json
{
  "timestamp": "2026-04-24T18:27:09.904Z",
  "ready": false,
  "checks": {
    "baseUrl": {
      "present": true,
      "source": "BASE_URL",
      "preview": "http://localhost:3000"
    },
    "tenantId": {
      "present": true,
      "source": "TENANT_ID",
      "preview": "cmjptk2mw0000aocw31u48n64"
    },
    "authToken": {
      "present": false,
      "source": "[missing]",
      "preview": "[missing]"
    },
    "emailCampaignId": {
      "present": true,
      "source": "EMAIL_CAMPAIGN_ID",
      "preview": "cmoczj4oi0001kax6e3a13lvz"
    },
    "emailRetryJobId": {
      "present": false,
      "source": "[optional-missing]",
      "preview": "[optional-missing]"
    }
  }
}
```

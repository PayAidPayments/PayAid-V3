# Email Step 4.1 Smoke Env Readiness

- Timestamp: 2026-04-24T13:22:55.793Z
- Ready: no

## Checks

- baseUrl: present (source=BASE_URL, preview=http://localhost:3000)
- tenantId: present (source=TENANT_ID, preview=cmo9lebrp0001qjwe54slsy4d)
- authToken: missing (source=[missing], preview=[missing])
- emailCampaignId: missing (source=[missing], preview=[missing])
- emailRetryJobId: missing (source=[optional-missing], preview=[optional-missing])

## Raw JSON

```json
{
  "timestamp": "2026-04-24T13:22:55.793Z",
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
      "preview": "cmo9lebrp0001qjwe54slsy4d"
    },
    "authToken": {
      "present": false,
      "source": "[missing]",
      "preview": "[missing]"
    },
    "emailCampaignId": {
      "present": false,
      "source": "[missing]",
      "preview": "[missing]"
    },
    "emailRetryJobId": {
      "present": false,
      "source": "[optional-missing]",
      "preview": "[optional-missing]"
    }
  }
}
```

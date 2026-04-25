# Email Step 4.1 Smoke Env Readiness

- Timestamp: 2026-04-24T13:12:06.867Z
- Ready: no

## Checks

- baseUrl: present (source=NEXT_PUBLIC_APP_URL, preview=http://localhost:3000)
- tenantId: missing (source=[missing], preview=[missing])
- authToken: missing (source=[missing], preview=[missing])
- emailCampaignId: missing (source=[missing], preview=[missing])
- emailRetryJobId: missing (source=[optional-missing], preview=[optional-missing])

## Raw JSON

```json
{
  "timestamp": "2026-04-24T13:12:06.867Z",
  "ready": false,
  "checks": {
    "baseUrl": {
      "present": true,
      "source": "NEXT_PUBLIC_APP_URL",
      "preview": "http://localhost:3000"
    },
    "tenantId": {
      "present": false,
      "source": "[missing]",
      "preview": "[missing]"
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

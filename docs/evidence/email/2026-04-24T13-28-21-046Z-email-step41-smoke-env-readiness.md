# Email Step 4.1 Smoke Env Readiness

- Timestamp: 2026-04-24T13:28:21.046Z
- Ready: yes

## Checks

- baseUrl: present (source=BASE_URL, preview=http://localhost:3000)
- tenantId: present (source=TENANT_ID, preview=cmo9lebrp0001qjwe54slsy4d)
- authToken: present (source=AUTH_TOKEN, preview=[set len=7])
- emailCampaignId: present (source=EMAIL_CAMPAIGN_ID, preview=<campaign-id>)
- emailRetryJobId: missing (source=[optional-missing], preview=[optional-missing])

## Raw JSON

```json
{
  "timestamp": "2026-04-24T13:28:21.046Z",
  "ready": true,
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
      "present": true,
      "source": "AUTH_TOKEN",
      "preview": "[set len=7]"
    },
    "emailCampaignId": {
      "present": true,
      "source": "EMAIL_CAMPAIGN_ID",
      "preview": "<campaign-id>"
    },
    "emailRetryJobId": {
      "present": false,
      "source": "[optional-missing]",
      "preview": "[optional-missing]"
    }
  }
}
```

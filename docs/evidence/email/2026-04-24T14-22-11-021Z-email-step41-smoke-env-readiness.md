# Email Step 4.1 Smoke Env Readiness

- Timestamp: 2026-04-24T14:22:11.021Z
- Ready: yes

## Checks

- baseUrl: present (source=BASE_URL, preview=https://payaid-v3.vercel.app)
- tenantId: present (source=TENANT_ID, preview=cmjptk2mw0000aocw31u48n64)
- authToken: present (source=AUTH_TOKEN, preview=[set len=881])
- emailCampaignId: present (source=EMAIL_CAMPAIGN_ID, preview=cmoczj4oi0001kax6e3a13lvz)
- emailRetryJobId: missing (source=[optional-missing], preview=[optional-missing])

## Raw JSON

```json
{
  "timestamp": "2026-04-24T14:22:11.021Z",
  "ready": true,
  "checks": {
    "baseUrl": {
      "present": true,
      "source": "BASE_URL",
      "preview": "https://payaid-v3.vercel.app"
    },
    "tenantId": {
      "present": true,
      "source": "TENANT_ID",
      "preview": "cmjptk2mw0000aocw31u48n64"
    },
    "authToken": {
      "present": true,
      "source": "AUTH_TOKEN",
      "preview": "[set len=881]"
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

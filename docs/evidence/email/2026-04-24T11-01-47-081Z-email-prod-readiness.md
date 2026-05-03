# Email Production Readiness Check

- Timestamp: 2026-04-24T11:01:47.081Z
- Environment: unknown
- Overall ready: no

## Redis TCP

- Config present: no
- Endpoint: [missing]:[missing]
- TCP reachable: no
- Detail: REDIS_URL is missing or invalid

## Database

- DATABASE_URL present: no
- Connected: no
- Detail: DATABASE_URL is missing

## Required Email Tables

- EmailSendJob: missing
- EmailTrackingEvent: missing
- EmailSyncCheckpoint: missing
- EmailDeliverabilityLog: missing
- EmailCampaignSenderPolicy: missing

## Raw JSON

```json
{
  "timestamp": "2026-04-24T11:01:47.081Z",
  "environment": "unknown",
  "overallReady": false,
  "redis": {
    "configPresent": false,
    "host": null,
    "port": null,
    "tcpReachable": false,
    "detail": "REDIS_URL is missing or invalid"
  },
  "database": {
    "configPresent": false,
    "connected": false,
    "detail": "DATABASE_URL is missing",
    "tables": {
      "EmailSendJob": false,
      "EmailTrackingEvent": false,
      "EmailSyncCheckpoint": false,
      "EmailDeliverabilityLog": false,
      "EmailCampaignSenderPolicy": false
    }
  }
}
```

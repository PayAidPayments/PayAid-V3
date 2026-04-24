# Email Production Readiness Check

- Timestamp: 2026-04-24T11:22:41.605Z
- Environment: development
- Overall ready: no

## Redis TCP

- Config present: yes
- Endpoint: beloved-gull-95753.upstash.io:6379
- TCP reachable: yes
- Detail: Connected to beloved-gull-95753.upstash.io:6379

## Database

- DATABASE_URL present: yes
- Connected: yes
- Detail: Connected and basic query succeeded

## Required Email Tables

- EmailSendJob: missing
- EmailTrackingEvent: missing
- EmailSyncCheckpoint: missing
- EmailDeliverabilityLog: missing
- EmailCampaignSenderPolicy: missing

## Raw JSON

```json
{
  "timestamp": "2026-04-24T11:22:41.605Z",
  "environment": "development",
  "overallReady": false,
  "redis": {
    "source": "derived_from_upstash_rest",
    "configPresent": true,
    "host": "beloved-gull-95753.upstash.io",
    "port": 6379,
    "tcpReachable": true,
    "detail": "Connected to beloved-gull-95753.upstash.io:6379"
  },
  "database": {
    "configPresent": true,
    "connected": true,
    "detail": "Connected and basic query succeeded",
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

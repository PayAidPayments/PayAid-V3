# Email Production Readiness Check

- Timestamp: 2026-04-24T13:00:23.709Z
- Environment: development
- Overall ready: yes

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

- EmailSendJob: present
- EmailTrackingEvent: present
- EmailSyncCheckpoint: present
- EmailDeliverabilityLog: present
- EmailCampaignSenderPolicy: present

## Raw JSON

```json
{
  "timestamp": "2026-04-24T13:00:23.709Z",
  "environment": "development",
  "overallReady": true,
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
      "EmailSendJob": true,
      "EmailTrackingEvent": true,
      "EmailSyncCheckpoint": true,
      "EmailDeliverabilityLog": true,
      "EmailCampaignSenderPolicy": true
    }
  }
}
```

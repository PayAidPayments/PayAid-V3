# Email Production Readiness Check

- Timestamp: 2026-04-24T10:28:54.380Z
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


## Raw JSON

```json
{
  "timestamp": "2026-04-24T10:28:54.380Z",
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
    "tables": {}
  }
}
```

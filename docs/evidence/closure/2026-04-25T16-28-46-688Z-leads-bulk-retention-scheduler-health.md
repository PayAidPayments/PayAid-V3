# Leads Bulk Retention Scheduler Health Evidence

- Captured at: 2026-04-25T16:28:46.688Z
- Command: `npm run check:leads-bulk-retention-scheduler-health`
- Strict mode: yes
- Cleanup run: yes
- Cleanup apply: no
- Exit code: 1
- Health OK: no

## Summary JSON

```json
{
  "parseError": "health output was not valid JSON",
  "stdout": ""
}
```

## stderr

```text
{
  "ok": false,
  "check": "leads-bulk-retention-scheduler-health",
  "message": "Scheduler health check request failed",
  "endpoint": "http://127.0.0.1:3010/api/activation/bulk-reports/scheduler-status?tenantId=demo-business-pvt-ltd&staleAfterMinutes=180&runningMaxMinutes=180&skipWarnCount=3",
  "fetchTimeoutMs": 3000,
  "errorName": "TypeError",
  "error": "fetch failed",
  "hint": [
    "Verify the app serving http://127.0.0.1:3010/api/activation/bulk-reports/scheduler-status?tenantId=demo-business-pvt-ltd&staleAfterMinutes=180&runningMaxMinutes=180&skipWarnCount=3 is running and reachable.",
    "If this endpoint is in the leads app, ensure `apps/leads` is running on the expected port.",
    "You can tune timeout via LEADS_BULK_RETENTION_HEALTH_FETCH_TIMEOUT_MS."
  ]
}
```

## Cleanup

- Command: `npm run cleanup:leads-bulk-retention-artifacts`
- Apply mode: no
- Exit code: 0

```json
{
  "ok": true,
  "apply": false,
  "mode": "delete",
  "includeMarkers": false,
  "allowMarkerMutation": false,
  "markerApprovalFromFile": false,
  "retentionDays": 14,
  "scannedDir": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\closure",
  "candidateCount": 0,
  "deletedCount": 0,
  "archivedCount": 0,
  "candidates": [],
  "archived": [],
  "nextSteps": [
    "Dry run only. To apply cleanup:",
    "$env:LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_APPLY=\"1\"",
    "$env:LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_MODE=\"archive\"  # or \"delete\"",
    "$env:LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_INCLUDE_MARKERS=\"1\"  # optional",
    "$env:LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_ALLOW_MARKER_MUTATION=\"1\"  # required when includeMarkers=1 + apply",
    "npm run cleanup:leads-bulk-retention-artifacts"
  ]
}
```

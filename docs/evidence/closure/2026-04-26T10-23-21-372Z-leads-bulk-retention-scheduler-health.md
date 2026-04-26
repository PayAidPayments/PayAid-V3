# Leads Bulk Retention Scheduler Health Evidence

- Captured at: 2026-04-26T10:23:21.372Z
- Command: `npm run check:leads-bulk-retention-scheduler-health`
- Strict mode: yes
- Cleanup run: yes
- Cleanup apply: no
- Exit code: 0
- Health OK: yes

## Summary JSON

```json
{
  "ok": true,
  "check": "leads-bulk-retention-scheduler-health",
  "endpoint": "local-fallback",
  "severity": "healthy",
  "reasons": [],
  "metrics": {
    "statusAgeMinutes": 34,
    "runningForMinutes": 34,
    "consecutiveSkipped": 0,
    "state": "completed",
    "hasActiveLock": false,
    "tenantId": "demo-business-pvt-ltd"
  },
  "evaluatedAt": "2026-04-26T10:23:21.364Z",
  "source": "local-fallback"
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

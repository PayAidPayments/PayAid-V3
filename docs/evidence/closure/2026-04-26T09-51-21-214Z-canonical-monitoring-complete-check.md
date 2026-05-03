# Canonical monitoring complete check

- Timestamp: 2026-04-26T09:51:21.214Z
- Overall: fail
- JSON artifact: `D:\Cursor Projects\PayAid-V3-temp-finish\docs\evidence\closure\2026-04-26T09-51-21-214Z-canonical-monitoring-complete-check.json`
- Cutover start source: signoff-doc (`2026-04-25T08:00:00Z`)

## Required checkpoints

- PASS tplus8 -> `docs/evidence/closure/2026-04-26T09-51-19-900Z-canonical-post-enable-monitor-checkpoint-tplus8.md` (eligible after 2026-04-25T16:00:00.000Z)
- MISSING tplus16 (eligible after 2026-04-26T00:00:00.000Z)
- PASS tplus24 -> `docs/evidence/closure/2026-04-26T09-51-17-513Z-canonical-post-enable-monitor-checkpoint-tplus24.md` (eligible after 2026-04-26T08:00:00.000Z)

- Missing labels: tplus16

## Raw payload

```json
{
  "check": "canonical-monitoring-complete-check",
  "timestamp": "2026-04-26T09:51:21.214Z",
  "requiredLabels": [
    "tplus8",
    "tplus16",
    "tplus24"
  ],
  "mode": "executed",
  "overallOk": false,
  "cutoverStart": {
    "source": "signoff-doc",
    "ms": 1777104000000,
    "raw": "2026-04-25T08:00:00Z"
  },
  "checkpoints": [
    {
      "label": "tplus8",
      "present": true,
      "artifact": "docs/evidence/closure/2026-04-26T09-51-19-900Z-canonical-post-enable-monitor-checkpoint-tplus8.md",
      "artifactTimestampUtc": "2026-04-26T09:51:19.900Z",
      "requiredHours": 8,
      "eligibleAtUtc": "2026-04-25T16:00:00.000Z",
      "elapsedEligible": true
    },
    {
      "label": "tplus16",
      "present": false,
      "artifact": null,
      "artifactTimestampUtc": null,
      "requiredHours": 16,
      "eligibleAtUtc": "2026-04-26T00:00:00.000Z",
      "elapsedEligible": false
    },
    {
      "label": "tplus24",
      "present": true,
      "artifact": "docs/evidence/closure/2026-04-26T09-51-17-513Z-canonical-post-enable-monitor-checkpoint-tplus24.md",
      "artifactTimestampUtc": "2026-04-26T09:51:17.513Z",
      "requiredHours": 24,
      "eligibleAtUtc": "2026-04-26T08:00:00.000Z",
      "elapsedEligible": true
    }
  ],
  "missingLabels": [
    "tplus16"
  ],
  "tooEarlyLabels": []
}
```

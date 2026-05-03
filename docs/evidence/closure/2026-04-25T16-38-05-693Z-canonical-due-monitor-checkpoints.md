# Canonical due monitor checkpoints

- Timestamp: 2026-04-25T16:38:05.693Z
- Cutover start: 2026-04-25T08:00:00.000Z (signoff-doc)
- Overall: pass
- Due labels run: none
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-25T16-38-05-693Z-canonical-due-monitor-checkpoints.json`

## Plan

- tplus8: due=yes, captured=yes, shouldRun=no, eligibleAt=2026-04-25T16:00:00.000Z
- tplus16: due=no, captured=no, shouldRun=no, eligibleAt=2026-04-26T00:00:00.000Z
- tplus24: due=no, captured=no, shouldRun=no, eligibleAt=2026-04-26T08:00:00.000Z

## Run results

- none

## Raw payload

```json
{
  "check": "canonical-due-monitor-checkpoints",
  "timestamp": "2026-04-25T16:38:05.693Z",
  "cutoverStart": {
    "source": "signoff-doc",
    "valueUtc": "2026-04-25T08:00:00.000Z",
    "raw": "2026-04-25T08:00:00Z"
  },
  "checkpointTimeoutMs": 180000,
  "plan": [
    {
      "label": "tplus8",
      "hours": 8,
      "eligibleAtUtc": "2026-04-25T16:00:00.000Z",
      "due": true,
      "alreadyCaptured": true,
      "shouldRun": false
    },
    {
      "label": "tplus16",
      "hours": 16,
      "eligibleAtUtc": "2026-04-26T00:00:00.000Z",
      "due": false,
      "alreadyCaptured": false,
      "shouldRun": false
    },
    {
      "label": "tplus24",
      "hours": 24,
      "eligibleAtUtc": "2026-04-26T08:00:00.000Z",
      "due": false,
      "alreadyCaptured": false,
      "shouldRun": false
    }
  ],
  "runLabels": [],
  "runResults": [],
  "overallOk": true
}
```

# Canonical due monitor checkpoints

- Timestamp: 2026-04-26T03:38:08.762Z
- Cutover start: 2026-04-25T08:00:00.000Z (signoff-doc)
- Overall: fail
- Due labels run: tplus16
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-26T03-38-08-762Z-canonical-due-monitor-checkpoints.json`

## Plan

- tplus8: due=yes, captured=yes, shouldRun=no, eligibleAt=2026-04-25T16:00:00.000Z
- tplus16: due=yes, captured=no, shouldRun=yes, eligibleAt=2026-04-26T00:00:00.000Z
- tplus24: due=no, captured=no, shouldRun=no, eligibleAt=2026-04-26T08:00:00.000Z

## Run results

- FAIL tplus16 (1793ms)

## Raw payload

```json
{
  "check": "canonical-due-monitor-checkpoints",
  "timestamp": "2026-04-26T03:38:08.762Z",
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
      "due": true,
      "alreadyCaptured": false,
      "shouldRun": true
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
  "runLabels": [
    "tplus16"
  ],
  "runResults": [
    {
      "label": "tplus16",
      "ok": false,
      "exitCode": 1,
      "timedOut": false,
      "elapsedMs": 1793,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-monitor-checkpoint\n> node scripts/run-canonical-post-enable-monitor-checkpoint.mjs\n\n{\n  \"overallOk\": false,\n  \"mode\": \"blocked\",\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-38-18-351Z-canonical-post-enable-monitor-checkpoint-tplus16.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-38-18-351Z-canonical-post-enable-monitor-checkpoint-tplus16.md\"\n}\n\n"
    }
  ],
  "overallOk": false
}
```

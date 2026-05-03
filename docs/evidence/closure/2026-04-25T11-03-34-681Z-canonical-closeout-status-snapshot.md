# Canonical closeout status snapshot

- Timestamp: 2026-04-25T11:03:34.681Z
- Overall: fail
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-25T11-03-34-681Z-canonical-closeout-status-snapshot.json`
- Next checkpoint: tplus8 at 2026-04-25T16:00:00.000Z (remaining 297 minutes)

## Check results

- PASS due-monitor-checkpoints (`npm run run:canonical-due-monitor-checkpoints`, 1133ms, timeout=180000ms)
- FAIL monitoring-complete (`npm run check:canonical-monitoring-complete`, 1348ms, timeout=120000ms)
- FAIL readiness-verdict-stable (`npm run check:canonical-module-api-readiness-verdict:stable`, 30060ms, timeout=360000ms)

## Raw payload

```json
{
  "check": "canonical-closeout-status-snapshot",
  "timestamp": "2026-04-25T11:03:34.681Z",
  "cutoverStart": {
    "source": "signoff-doc",
    "valueUtc": "2026-04-25T08:00:00.000Z",
    "raw": "2026-04-25T08:00:00Z"
  },
  "nextCheckpoint": {
    "label": "tplus8",
    "hours": 8,
    "eligibleAtUtc": "2026-04-25T16:00:00.000Z",
    "dueNow": false,
    "remainingMinutes": 297
  },
  "checkpointStatus": [
    {
      "label": "tplus8",
      "hours": 8,
      "eligibleAtUtc": "2026-04-25T16:00:00.000Z",
      "dueNow": false,
      "remainingMinutes": 297
    },
    {
      "label": "tplus16",
      "hours": 16,
      "eligibleAtUtc": "2026-04-26T00:00:00.000Z",
      "dueNow": false,
      "remainingMinutes": 777
    },
    {
      "label": "tplus24",
      "hours": 24,
      "eligibleAtUtc": "2026-04-26T08:00:00.000Z",
      "dueNow": false,
      "remainingMinutes": 1257
    }
  ],
  "overallOk": false,
  "checks": [
    {
      "id": "due-monitor-checkpoints",
      "command": "npm run run:canonical-due-monitor-checkpoints",
      "timeoutMs": 180000,
      "exitCode": 0,
      "timedOut": false,
      "ok": true,
      "elapsedMs": 1133,
      "outputExcerpt": "\n> payaid-v3@0.1.0 run:canonical-due-monitor-checkpoints\n> node scripts/run-canonical-due-monitor-checkpoints.mjs\n\n{\n  \"overallOk\": true,\n  \"ran\": [],\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-25T11-03-35-354Z-canonical-due-monitor-checkpoints.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-25T11-03-35-354Z-canonical-due-monitor-checkpoints.md\"\n}\n\n"
    },
    {
      "id": "monitoring-complete",
      "command": "npm run check:canonical-monitoring-complete",
      "timeoutMs": 120000,
      "exitCode": 1,
      "timedOut": false,
      "ok": false,
      "elapsedMs": 1348,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-monitoring-complete\n> node scripts/check-canonical-monitoring-complete.mjs\n\n{\n  \"overallOk\": false,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-25T11-03-36-990Z-canonical-monitoring-complete-check.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-25T11-03-36-990Z-canonical-monitoring-complete-check.md\"\n}\n\n"
    },
    {
      "id": "readiness-verdict-stable",
      "command": "npm run check:canonical-module-api-readiness-verdict:stable",
      "timeoutMs": 360000,
      "exitCode": 1,
      "timedOut": false,
      "ok": false,
      "elapsedMs": 30060,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-readiness-verdict:stable\n> cross-env CANONICAL_READINESS_COMMAND_TIMEOUT_MS=120000 CANONICAL_READINESS_COMMAND_TIMEOUT_MS_CANONICAL_CONSUMER_USAGE=300000 node scripts/check-canonical-module-api-readiness-verdict.mjs\n\n{\n  \"overallOk\": false,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-25T11-03-51-834Z-canonical-module-api-readiness-verdict.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-25T11-03-51-834Z-canonical-module-api-readiness-verdict.md\",\n  \"unchecked\": 2\n}\n\n"
    }
  ],
  "notes": [
    "Single status snapshot for canonical closeout while waiting on time-gated monitoring checkpoints.",
    "Overall remains false until monitoring-complete and readiness-verdict-stable both pass."
  ]
}
```

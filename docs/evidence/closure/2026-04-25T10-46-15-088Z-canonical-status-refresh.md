# Canonical status refresh

- Timestamp: 2026-04-25T10:46:15.088Z
- Overall: fail
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-25T10-46-15-088Z-canonical-status-refresh.json`

## Step results

- FAIL closeout-status-snapshot (`npm run run:canonical-closeout-status-snapshot`, 317890ms, timeout=420000ms)

## Raw payload

```json
{
  "check": "canonical-status-refresh",
  "timestamp": "2026-04-25T10:46:15.088Z",
  "overallOk": false,
  "totalSteps": 3,
  "completedSteps": 1,
  "results": [
    {
      "id": "closeout-status-snapshot",
      "command": "npm run run:canonical-closeout-status-snapshot",
      "timeoutMs": 420000,
      "elapsedMs": 317890,
      "exitCode": 1,
      "timedOut": false,
      "ok": false,
      "outputTail": [
        "",
        "> payaid-v3@0.1.0 run:canonical-closeout-status-snapshot",
        "> node scripts/run-canonical-closeout-status-snapshot.mjs",
        "",
        "{",
        "  \"overallOk\": false,",
        "  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-25T10-46-39-420Z-canonical-closeout-status-snapshot.json\",",
        "  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-25T10-46-39-420Z-canonical-closeout-status-snapshot.md\"",
        "}",
        "",
        ""
      ]
    }
  ]
}
```

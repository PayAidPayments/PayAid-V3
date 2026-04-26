# Canonical module API readiness verdict

- Timestamp: 2026-04-26T06:26:15.475Z
- Overall: fail
- Commands: pass
- Checklist: fail (2 unchecked)
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-26T06-26-15-475Z-canonical-module-api-readiness-verdict.json`

## Command results

- PASS `npm run check:canonical-module-api-contract` (14380ms, timeout=120000ms)
- PASS `npm run check:canonical-module-api-post-cutover` (37126ms, timeout=120000ms)
- PASS `npm run check:canonical-module-api-response-snapshots` (61188ms, timeout=120000ms)
- PASS `npm run check:canonical-module-api-consumer-usage` (87028ms, timeout=300000ms)

## Unchecked checklist items

- (16) `npm run check:canonical-module-api-readiness-verdict` passes (commands + checklist consolidated verdict).
- (58) Post-enable 24-hour monitoring completed with no critical issues.

## Raw payload

```json
{
  "check": "canonical-module-api-readiness-verdict",
  "timestamp": "2026-04-26T06:26:15.475Z",
  "overallOk": false,
  "commandsOk": true,
  "checklistOk": false,
  "commandTimeoutMsDefault": 120000,
  "commandResults": [
    {
      "label": "canonical-contract",
      "command": "npm run check:canonical-module-api-contract",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 120000,
      "elapsedMs": 14380,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-contract\n> node scripts/check-canonical-module-api-contract.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T06-26-27-308Z-canonical-module-api-contract-check.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T06-26-27-308Z-canonical-module-api-contract-check.md\"\n}\n\n"
    },
    {
      "label": "canonical-post-cutover",
      "command": "npm run check:canonical-module-api-post-cutover",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 120000,
      "elapsedMs": 37126,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-post-cutover\n> node scripts/check-canonical-module-api-post-cutover.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T06-27-01-064Z-canonical-module-api-post-cutover-guard.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T06-27-01-064Z-canonical-module-api-post-cutover-guard.md\"\n}\n\n"
    },
    {
      "label": "canonical-response-snapshots",
      "command": "npm run check:canonical-module-api-response-snapshots",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 120000,
      "elapsedMs": 61188,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-response-snapshots\n> node scripts/check-canonical-module-api-response-snapshots.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T06-28-03-395Z-canonical-module-api-response-snapshots.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T06-28-03-395Z-canonical-module-api-response-snapshots.md\"\n}\n\n"
    },
    {
      "label": "canonical-consumer-usage",
      "command": "npm run check:canonical-module-api-consumer-usage",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 300000,
      "elapsedMs": 87028,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-consumer-usage\n> node scripts/check-canonical-module-api-consumer-usage.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T06-28-27-922Z-canonical-module-api-consumer-usage.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T06-28-27-922Z-canonical-module-api-consumer-usage.md\",\n  \"consumers\": 3\n}\n\n"
    }
  ],
  "checklist": {
    "path": "docs/CANONICAL_MODULE_API_CONSUMER_READINESS_CHECKLIST.md",
    "checkedCount": 23,
    "uncheckedCount": 2,
    "uncheckedItems": [
      {
        "line": 16,
        "text": "`npm run check:canonical-module-api-readiness-verdict` passes (commands + checklist consolidated verdict)."
      },
      {
        "line": 58,
        "text": "Post-enable 24-hour monitoring completed with no critical issues."
      }
    ]
  },
  "notes": [
    "Consolidates canonical contract checks + post-cutover guard + checklist status.",
    "Use as final readiness gate before enabling CANONICAL_MODULE_API_ONLY=1 in production."
  ]
}
```

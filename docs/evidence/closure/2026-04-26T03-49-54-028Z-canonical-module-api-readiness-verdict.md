# Canonical module API readiness verdict

- Timestamp: 2026-04-26T03:49:54.028Z
- Overall: fail
- Commands: pass
- Checklist: fail (2 unchecked)
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-26T03-49-54-028Z-canonical-module-api-readiness-verdict.json`

## Command results

- PASS `npm run check:canonical-module-api-contract` (5213ms, timeout=120000ms)
- PASS `npm run check:canonical-module-api-post-cutover` (1110ms, timeout=120000ms)
- PASS `npm run check:canonical-module-api-response-snapshots` (2247ms, timeout=120000ms)
- PASS `npm run check:canonical-module-api-consumer-usage` (67083ms, timeout=300000ms)

## Unchecked checklist items

- (16) `npm run check:canonical-module-api-readiness-verdict` passes (commands + checklist consolidated verdict).
- (58) Post-enable 24-hour monitoring completed with no critical issues.

## Raw payload

```json
{
  "check": "canonical-module-api-readiness-verdict",
  "timestamp": "2026-04-26T03:49:54.028Z",
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
      "elapsedMs": 5213,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-contract\n> node scripts/check-canonical-module-api-contract.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-49-57-669Z-canonical-module-api-contract-check.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-49-57-669Z-canonical-module-api-contract-check.md\"\n}\n\n"
    },
    {
      "label": "canonical-post-cutover",
      "command": "npm run check:canonical-module-api-post-cutover",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 120000,
      "elapsedMs": 1110,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-post-cutover\n> node scripts/check-canonical-module-api-post-cutover.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-49-59-650Z-canonical-module-api-post-cutover-guard.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-49-59-650Z-canonical-module-api-post-cutover-guard.md\"\n}\n\n"
    },
    {
      "label": "canonical-response-snapshots",
      "command": "npm run check:canonical-module-api-response-snapshots",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 120000,
      "elapsedMs": 2247,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-response-snapshots\n> node scripts/check-canonical-module-api-response-snapshots.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-50-01-431Z-canonical-module-api-response-snapshots.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-50-01-431Z-canonical-module-api-response-snapshots.md\"\n}\n\n"
    },
    {
      "label": "canonical-consumer-usage",
      "command": "npm run check:canonical-module-api-consumer-usage",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 300000,
      "elapsedMs": 67083,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-consumer-usage\n> node scripts/check-canonical-module-api-consumer-usage.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-50-03-249Z-canonical-module-api-consumer-usage.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T03-50-03-249Z-canonical-module-api-consumer-usage.md\",\n  \"consumers\": 3\n}\n\n"
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

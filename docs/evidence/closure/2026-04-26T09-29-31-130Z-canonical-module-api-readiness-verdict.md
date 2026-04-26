# Canonical module API readiness verdict

- Timestamp: 2026-04-26T09:29:31.130Z
- Overall: fail
- Commands: pass
- Checklist: fail (1 unchecked)
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-26T09-29-31-130Z-canonical-module-api-readiness-verdict.json`

## Command results

- PASS `npm run check:canonical-module-api-contract` (1474ms, timeout=120000ms)
- PASS `npm run check:canonical-module-api-post-cutover` (1470ms, timeout=120000ms)
- PASS `npm run check:canonical-module-api-response-snapshots` (1006ms, timeout=120000ms)
- PASS `npm run check:canonical-module-api-consumer-usage` (37607ms, timeout=120000ms)

## Unchecked checklist items

- (16) `npm run check:canonical-module-api-readiness-verdict` passes (commands + checklist consolidated verdict).

## Raw payload

```json
{
  "check": "canonical-module-api-readiness-verdict",
  "timestamp": "2026-04-26T09:29:31.130Z",
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
      "elapsedMs": 1474,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-contract\n> node scripts/check-canonical-module-api-contract.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T09-29-32-037Z-canonical-module-api-contract-check.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T09-29-32-037Z-canonical-module-api-contract-check.md\"\n}\n\n"
    },
    {
      "label": "canonical-post-cutover",
      "command": "npm run check:canonical-module-api-post-cutover",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 120000,
      "elapsedMs": 1470,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-post-cutover\n> node scripts/check-canonical-module-api-post-cutover.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T09-29-34-006Z-canonical-module-api-post-cutover-guard.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T09-29-34-006Z-canonical-module-api-post-cutover-guard.md\"\n}\n\n"
    },
    {
      "label": "canonical-response-snapshots",
      "command": "npm run check:canonical-module-api-response-snapshots",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 120000,
      "elapsedMs": 1006,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-response-snapshots\n> node scripts/check-canonical-module-api-response-snapshots.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T09-29-35-016Z-canonical-module-api-response-snapshots.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T09-29-35-016Z-canonical-module-api-response-snapshots.md\"\n}\n\n"
    },
    {
      "label": "canonical-consumer-usage",
      "command": "npm run check:canonical-module-api-consumer-usage",
      "ok": true,
      "exitCode": 0,
      "timedOut": false,
      "timeoutMs": 120000,
      "elapsedMs": 37607,
      "outputExcerpt": "\n> payaid-v3@0.1.0 check:canonical-module-api-consumer-usage\n> node scripts/check-canonical-module-api-consumer-usage.mjs\n\n{\n  \"overallOk\": true,\n  \"jsonPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T09-29-36-081Z-canonical-module-api-consumer-usage.json\",\n  \"mdPath\": \"D:\\\\Cursor Projects\\\\PayAid V3\\\\docs\\\\evidence\\\\closure\\\\2026-04-26T09-29-36-081Z-canonical-module-api-consumer-usage.md\",\n  \"consumers\": 3\n}\n\n"
    }
  ],
  "checklist": {
    "path": "docs/CANONICAL_MODULE_API_CONSUMER_READINESS_CHECKLIST.md",
    "checkedCount": 24,
    "uncheckedCount": 1,
    "uncheckedItems": [
      {
        "line": 16,
        "text": "`npm run check:canonical-module-api-readiness-verdict` passes (commands + checklist consolidated verdict)."
      }
    ]
  },
  "notes": [
    "Consolidates canonical contract checks + post-cutover guard + checklist status.",
    "Use as final readiness gate before enabling CANONICAL_MODULE_API_ONLY=1 in production."
  ]
}
```

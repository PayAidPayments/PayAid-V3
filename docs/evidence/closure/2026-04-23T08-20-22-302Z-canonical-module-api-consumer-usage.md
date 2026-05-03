# Canonical module API consumer usage check

- Timestamp: 2026-04-23T08:20:22.302Z
- Consumers discovered: 3
- Overall: pass
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-23T08-20-22-302Z-canonical-module-api-consumer-usage.json`

## Per-file results

- PASS `apps/dashboard/app/dashboard/modules/page.tsx` (legacy=0, canonical=6)
- PASS `apps/dashboard/app/industries/[industry]/page.tsx` (legacy=0, canonical=3)
- PASS `apps/dashboard/app/signup/page.tsx` (legacy=0, canonical=6)

## Raw payload

```json
{
  "check": "canonical-module-api-consumer-usage",
  "timestamp": "2026-04-23T08:20:22.302Z",
  "discoveredConsumers": 3,
  "overallOk": true,
  "failures": [],
  "results": [
    {
      "file": "apps/dashboard/app/dashboard/modules/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 6,
      "legacyPatterns": [],
      "canonicalPatterns": [
        {
          "pattern": "/\\.canonical\\b/g",
          "count": 4
        },
        {
          "pattern": "/\\.suites\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.capabilities\\b/g",
          "count": 1
        }
      ],
      "ok": true
    },
    {
      "file": "apps/dashboard/app/industries/[industry]/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 3,
      "legacyPatterns": [],
      "canonicalPatterns": [
        {
          "pattern": "/\\.canonical\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.suites\\b/g",
          "count": 2
        }
      ],
      "ok": true
    },
    {
      "file": "apps/dashboard/app/signup/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 6,
      "legacyPatterns": [],
      "canonicalPatterns": [
        {
          "pattern": "/\\.canonical\\b/g",
          "count": 3
        },
        {
          "pattern": "/\\.suites\\b/g",
          "count": 3
        }
      ],
      "ok": true
    }
  ],
  "notes": [
    "Scans endpoint consumers for legacy response-field usage.",
    "Pass requires at least one consumer file, zero legacy matches, and canonical-field matches per consumer."
  ]
}
```

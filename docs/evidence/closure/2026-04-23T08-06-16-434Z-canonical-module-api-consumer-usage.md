# Canonical module API consumer usage check

- Timestamp: 2026-04-23T08:06:16.434Z
- Consumers discovered: 4
- Overall: fail
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-23T08-06-16-434Z-canonical-module-api-consumer-usage.json`

## Per-file results

- FAIL `apps/dashboard/app/dashboard/admin/modules/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/modules/page.tsx` (legacy=2, canonical=0)
- FAIL `apps/dashboard/app/industries/[industry]/page.tsx` (legacy=1, canonical=0)
- FAIL `apps/dashboard/app/signup/page.tsx` (legacy=1, canonical=0)

## Raw payload

```json
{
  "check": "canonical-module-api-consumer-usage",
  "timestamp": "2026-04-23T08:06:16.434Z",
  "discoveredConsumers": 4,
  "overallOk": false,
  "failures": [
    {
      "file": "apps/dashboard/app/dashboard/admin/modules/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/modules/page.tsx",
      "legacyMatches": 2,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.base\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.recommended\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/industries/[industry]/page.tsx",
      "legacyMatches": 1,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.coreModules\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/signup/page.tsx",
      "legacyMatches": 1,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.coreModules\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    }
  ],
  "results": [
    {
      "file": "apps/dashboard/app/dashboard/admin/modules/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/modules/page.tsx",
      "legacyMatches": 2,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.base\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.recommended\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/industries/[industry]/page.tsx",
      "legacyMatches": 1,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.coreModules\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/signup/page.tsx",
      "legacyMatches": 1,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.coreModules\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    }
  ],
  "notes": [
    "Scans endpoint consumers for legacy response-field usage.",
    "Pass requires at least one consumer file, zero legacy matches, and canonical-field matches per consumer."
  ]
}
```

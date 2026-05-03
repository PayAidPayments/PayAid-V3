# Canonical module API post-cutover guard

- Timestamp: 2026-04-22T15:12:36.084Z
- Overall: fail
- Guard window chars: 280
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-22T15-12-36-084Z-canonical-module-api-post-cutover-guard.json`

## File results

- FAIL `apps/dashboard/app/api/modules/route.ts`
  - token `base:`: total=2, guarded=1, unguarded=1
  - token `industry:`: total=2, guarded=1, unguarded=1
  - token `compatibility:`: total=2, guarded=1, unguarded=1
- FAIL `apps/dashboard/app/api/industries/[industry]/modules/route.ts`
  - token `optionalModules:`: total=1, guarded=0, unguarded=1
  - token `compatibility:`: total=3, guarded=1, unguarded=2
- PASS `apps/dashboard/app/api/industries/custom/modules/route.ts`
- FAIL `apps/dashboard/app/api/ai/analyze-industry/route.ts`
  - token `coreModules: normalizedCoreModules`: total=2, guarded=0, unguarded=2
  - token `compatibility:`: total=2, guarded=1, unguarded=1

## Raw payload

```json
{
  "check": "canonical-module-api-post-cutover-guard",
  "timestamp": "2026-04-22T15:12:36.084Z",
  "guardWindowChars": 280,
  "overallOk": false,
  "files": [
    {
      "id": "api-modules-route",
      "file": "apps/dashboard/app/api/modules/route.ts",
      "ok": false,
      "failures": [
        {
          "token": "base:",
          "total": 2,
          "guarded": 1,
          "unguarded": 1
        },
        {
          "token": "industry:",
          "total": 2,
          "guarded": 1,
          "unguarded": 1
        },
        {
          "token": "compatibility:",
          "total": 2,
          "guarded": 1,
          "unguarded": 1
        }
      ],
      "tokenStats": [
        {
          "token": "base:",
          "totalOccurrences": 2,
          "guardedOccurrences": 1
        },
        {
          "token": "industry:",
          "totalOccurrences": 2,
          "guardedOccurrences": 1
        },
        {
          "token": "compatibility:",
          "totalOccurrences": 2,
          "guardedOccurrences": 1
        }
      ],
      "anchorCount": 1
    },
    {
      "id": "api-industry-route",
      "file": "apps/dashboard/app/api/industries/[industry]/modules/route.ts",
      "ok": false,
      "failures": [
        {
          "token": "optionalModules:",
          "total": 1,
          "guarded": 0,
          "unguarded": 1
        },
        {
          "token": "compatibility:",
          "total": 3,
          "guarded": 1,
          "unguarded": 2
        }
      ],
      "tokenStats": [
        {
          "token": "coreModules:",
          "totalOccurrences": 1,
          "guardedOccurrences": 1
        },
        {
          "token": "industryPacks:",
          "totalOccurrences": 1,
          "guardedOccurrences": 1
        },
        {
          "token": "optionalModules:",
          "totalOccurrences": 1,
          "guardedOccurrences": 0
        },
        {
          "token": "compatibility:",
          "totalOccurrences": 3,
          "guardedOccurrences": 1
        }
      ],
      "anchorCount": 1
    },
    {
      "id": "api-industry-custom-route",
      "file": "apps/dashboard/app/api/industries/custom/modules/route.ts",
      "ok": true,
      "failures": [],
      "tokenStats": [
        {
          "token": "compatibility:",
          "totalOccurrences": 1,
          "guardedOccurrences": 1
        }
      ],
      "anchorCount": 1
    },
    {
      "id": "api-ai-analyze-industry-route",
      "file": "apps/dashboard/app/api/ai/analyze-industry/route.ts",
      "ok": false,
      "failures": [
        {
          "token": "coreModules: normalizedCoreModules",
          "total": 2,
          "guarded": 0,
          "unguarded": 2
        },
        {
          "token": "compatibility:",
          "total": 2,
          "guarded": 1,
          "unguarded": 1
        }
      ],
      "tokenStats": [
        {
          "token": "coreModules: fallbackModules",
          "totalOccurrences": 2,
          "guardedOccurrences": 2
        },
        {
          "token": "coreModules: normalizedCoreModules",
          "totalOccurrences": 2,
          "guardedOccurrences": 0
        },
        {
          "token": "compatibility:",
          "totalOccurrences": 2,
          "guardedOccurrences": 1
        }
      ],
      "anchorCount": 1
    }
  ],
  "notes": [
    "Fails if legacy tokens appear outside includeLegacy-gated windows.",
    "Use as post-cutover regression guard for CANONICAL_MODULE_API_ONLY=1 readiness."
  ]
}
```

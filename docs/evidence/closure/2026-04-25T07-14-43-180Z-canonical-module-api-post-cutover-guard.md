# Canonical module API post-cutover guard

- Timestamp: 2026-04-25T07:14:43.180Z
- Overall: pass
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-25T07-14-43-180Z-canonical-module-api-post-cutover-guard.json`

## File results

- PASS `apps/dashboard/app/api/modules/route.ts`
- PASS `apps/dashboard/app/api/industries/[industry]/modules/route.ts`
- PASS `apps/dashboard/app/api/industries/custom/modules/route.ts`
- PASS `apps/dashboard/app/api/ai/analyze-industry/route.ts`

## Raw payload

```json
{
  "check": "canonical-module-api-post-cutover-guard",
  "timestamp": "2026-04-25T07:14:43.180Z",
  "overallOk": true,
  "files": [
    {
      "id": "api-modules-route",
      "file": "apps/dashboard/app/api/modules/route.ts",
      "ok": true,
      "failures": [],
      "tokenStats": [
        {
          "token": "base:",
          "totalOccurrences": 2,
          "guardedOccurrences": 2
        },
        {
          "token": "industry:",
          "totalOccurrences": 2,
          "guardedOccurrences": 2
        },
        {
          "token": "compatibility:",
          "totalOccurrences": 2,
          "guardedOccurrences": 2
        }
      ],
      "anchorCount": 2
    },
    {
      "id": "api-industry-route",
      "file": "apps/dashboard/app/api/industries/[industry]/modules/route.ts",
      "ok": true,
      "failures": [],
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
          "guardedOccurrences": 1
        },
        {
          "token": "compatibility:",
          "totalOccurrences": 3,
          "guardedOccurrences": 3
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
      "ok": true,
      "failures": [],
      "tokenStats": [
        {
          "token": "coreModules: fallbackModules",
          "totalOccurrences": 2,
          "guardedOccurrences": 2
        },
        {
          "token": "coreModules: normalizedCoreModules",
          "totalOccurrences": 2,
          "guardedOccurrences": 2
        },
        {
          "token": "compatibility:",
          "totalOccurrences": 2,
          "guardedOccurrences": 2
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

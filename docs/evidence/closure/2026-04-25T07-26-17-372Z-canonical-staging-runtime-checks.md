# Canonical staging runtime checks

- Timestamp: 2026-04-25T07:26:17.372Z
- Base URL: https://payaid-v3.vercel.app
- Mode: executed
- Overall: pass
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-25T07-26-17-372Z-canonical-staging-runtime-checks.json`

## Checks

- PASS S1 GET /api/modules (status=200, keys=canonical, taxonomy)
- PASS S2 GET /api/industries/[industry]/modules (status=200, keys=canonical, capabilities, industry, optionalSuites, suites)
- PASS S3 POST /api/industries/[industry]/modules (status=200, keys=canonical, success, templatesLoaded)
- PASS S4 POST /api/industries/custom/modules (status=200, keys=canonical, industryName, success)
- PASS S5 POST /api/ai/analyze-industry (status=200, keys=aiService, canonical, description, industryFeatures, industryName, keyProcesses)

## Raw payload

```json
{
  "check": "canonical-staging-runtime-checks",
  "timestamp": "2026-04-25T07:26:17.372Z",
  "baseUrl": "https://payaid-v3.vercel.app",
  "mode": "executed",
  "overallOk": true,
  "checks": [
    {
      "id": "S1",
      "endpoint": "GET /api/modules",
      "status": 200,
      "pass": true,
      "keys": [
        "canonical",
        "taxonomy"
      ],
      "required": [
        "canonical",
        "taxonomy"
      ],
      "forbidden": [
        "recommended",
        "all",
        "base",
        "industry",
        "compatibility"
      ]
    },
    {
      "id": "S2",
      "endpoint": "GET /api/industries/[industry]/modules",
      "status": 200,
      "pass": true,
      "keys": [
        "canonical",
        "capabilities",
        "industry",
        "optionalSuites",
        "suites"
      ],
      "required": [
        "industry",
        "canonical",
        "suites",
        "capabilities",
        "optionalSuites"
      ],
      "forbidden": [
        "coreModules",
        "industryPacks",
        "optionalModules",
        "compatibility"
      ]
    },
    {
      "id": "S3",
      "endpoint": "POST /api/industries/[industry]/modules",
      "status": 200,
      "pass": true,
      "keys": [
        "canonical",
        "success",
        "templatesLoaded"
      ],
      "required": [
        "success",
        "canonical"
      ],
      "forbidden": [
        "enabledModules",
        "enabledPacks",
        "compatibility"
      ]
    },
    {
      "id": "S4",
      "endpoint": "POST /api/industries/custom/modules",
      "status": 200,
      "pass": true,
      "keys": [
        "canonical",
        "industryName",
        "success"
      ],
      "required": [
        "success",
        "canonical",
        "industryName"
      ],
      "forbidden": [
        "enabledModules",
        "enabledFeatures",
        "compatibility"
      ]
    },
    {
      "id": "S5",
      "endpoint": "POST /api/ai/analyze-industry",
      "status": 200,
      "pass": true,
      "keys": [
        "aiService",
        "canonical",
        "description",
        "industryFeatures",
        "industryName",
        "keyProcesses"
      ],
      "required": [
        "industryName",
        "canonical",
        "industryFeatures",
        "description",
        "keyProcesses"
      ],
      "forbidden": [
        "coreModules",
        "compatibility"
      ]
    }
  ],
  "runMutations": true,
  "industry": "retail"
}
```

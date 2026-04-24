# Canonical staging runtime checks

- Timestamp: 2026-04-23T10:14:18.826Z
- Base URL: https://payaid-v3.vercel.app
- Mode: executed
- Overall: fail
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-23T10-14-18-826Z-canonical-staging-runtime-checks.json`

## Checks

- FAIL S1 GET /api/modules (status=200, keys=all, base, canonical, compatibility, industry, recommended, taxonomy)
- FAIL S2 GET /api/industries/[industry]/modules (status=200, keys=canonical, capabilities, compatibility, coreModules, industry, industryPacks, optionalModules, optionalSuites, suites)
- FAIL S3 POST /api/industries/[industry]/modules (status=200, keys=canonical, compatibility, enabledModules, enabledPacks, success, templatesLoaded)
- FAIL S4 POST /api/industries/custom/modules (status=200, keys=canonical, compatibility, enabledFeatures, enabledModules, industryName, success)
- FAIL S5 POST /api/ai/analyze-industry (status=200, keys=aiService, canonical, compatibility, coreModules, description, industryFeatures, industryName, keyProcesses)

## Raw payload

```json
{
  "check": "canonical-staging-runtime-checks",
  "timestamp": "2026-04-23T10:14:18.826Z",
  "baseUrl": "https://payaid-v3.vercel.app",
  "mode": "executed",
  "overallOk": false,
  "checks": [
    {
      "id": "S1",
      "endpoint": "GET /api/modules",
      "status": 200,
      "pass": false,
      "keys": [
        "all",
        "base",
        "canonical",
        "compatibility",
        "industry",
        "recommended",
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
      "pass": false,
      "keys": [
        "canonical",
        "capabilities",
        "compatibility",
        "coreModules",
        "industry",
        "industryPacks",
        "optionalModules",
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
      "pass": false,
      "keys": [
        "canonical",
        "compatibility",
        "enabledModules",
        "enabledPacks",
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
      "pass": false,
      "keys": [
        "canonical",
        "compatibility",
        "enabledFeatures",
        "enabledModules",
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
      "pass": false,
      "keys": [
        "aiService",
        "canonical",
        "compatibility",
        "coreModules",
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

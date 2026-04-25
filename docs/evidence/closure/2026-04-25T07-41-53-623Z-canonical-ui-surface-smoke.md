# Canonical UI surface smoke

- Timestamp: 2026-04-25T07:41:53.623Z
- Base URL: https://payaid-v3.vercel.app
- Mode: executed
- Overall: fail
- Auth token source: login
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-25T07-41-53-623Z-canonical-ui-surface-smoke.json`

## Checks

- PASS UI:/dashboard/modules (200)
- PASS UI:/industries/retail (200)
- PASS UI:/signup (200)
- PASS API:modules (200)
- PASS API:industry-modules (200)
- FAIL API:custom-industry (400)
- PASS API:analyze-industry (200)

## Raw payload

```json
{
  "check": "canonical-ui-surface-smoke",
  "timestamp": "2026-04-25T07:41:53.623Z",
  "baseUrl": "https://payaid-v3.vercel.app",
  "mode": "executed",
  "overallOk": false,
  "checks": [
    {
      "id": "UI:/dashboard/modules",
      "type": "ui",
      "route": "/dashboard/modules",
      "status": 200,
      "pass": true,
      "overlay": false
    },
    {
      "id": "UI:/industries/retail",
      "type": "ui",
      "route": "/industries/retail",
      "status": 200,
      "pass": true,
      "overlay": false
    },
    {
      "id": "UI:/signup",
      "type": "ui",
      "route": "/signup",
      "status": 200,
      "pass": true,
      "overlay": false
    },
    {
      "id": "API:modules",
      "type": "api",
      "endpoint": "/api/modules",
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
      "id": "API:industry-modules",
      "type": "api",
      "endpoint": "/api/industries/retail/modules",
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
      "id": "API:custom-industry",
      "type": "api",
      "endpoint": "/api/industries/custom/modules",
      "status": 400,
      "pass": false,
      "keys": [
        "error"
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
      "id": "API:analyze-industry",
      "type": "api",
      "endpoint": "/api/ai/analyze-industry",
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
  "tokenSource": "login",
  "tokenAvailable": true,
  "loginStatus": 200
}
```

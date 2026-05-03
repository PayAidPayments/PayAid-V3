# Canonical module API response snapshots

- Timestamp: 2026-04-25T07:27:18.951Z
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-25T07-27-18-951Z-canonical-module-api-response-snapshots.json`

## Endpoint snapshots

### GET /api/modules

- Legacy required: taxonomy, canonical, compatibility, recommended, all, base, industry
- Legacy note: Legacy compatibility fields retained when CANONICAL_MODULE_API_ONLY is not 1.
- Canonical-only required: taxonomy, canonical
- Canonical-only forbidden: compatibility, recommended, all, base, industry
- Canonical-only note: Canonical-only payload when CANONICAL_MODULE_API_ONLY=1.

### GET /api/industries/[industry]/modules

- Legacy required: industry, canonical, suites, capabilities, optionalSuites, compatibility, coreModules, industryPacks, optionalModules
- Canonical-only required: industry, canonical, suites, capabilities, optionalSuites
- Canonical-only forbidden: compatibility, coreModules, industryPacks, optionalModules

### POST /api/industries/[industry]/modules

- Legacy required: success, canonical, compatibility, enabledModules, enabledPacks
- Canonical-only required: success, canonical
- Canonical-only forbidden: compatibility, enabledModules, enabledPacks

### POST /api/industries/custom/modules

- Legacy required: success, canonical, compatibility, enabledModules, enabledFeatures, industryName
- Canonical-only required: success, canonical, industryName
- Canonical-only forbidden: compatibility, enabledModules, enabledFeatures

### POST /api/ai/analyze-industry

- Legacy required: industryName, canonical, industryFeatures, description, keyProcesses, coreModules, compatibility, aiService
- Canonical-only required: industryName, canonical, industryFeatures, description, keyProcesses, aiService
- Canonical-only forbidden: coreModules, compatibility

## Raw payload

```json
{
  "check": "canonical-module-api-response-snapshots",
  "timestamp": "2026-04-25T07:27:18.951Z",
  "canonicalFlag": {
    "variable": "CANONICAL_MODULE_API_ONLY",
    "legacyValue": "unset or not 1",
    "canonicalOnlyValue": "1"
  },
  "snapshots": [
    {
      "endpoint": "GET /api/modules",
      "legacyMode": {
        "requiredTopLevel": [
          "taxonomy",
          "canonical",
          "compatibility",
          "recommended",
          "all",
          "base",
          "industry"
        ],
        "notes": "Legacy compatibility fields retained when CANONICAL_MODULE_API_ONLY is not 1."
      },
      "canonicalOnlyMode": {
        "requiredTopLevel": [
          "taxonomy",
          "canonical"
        ],
        "forbiddenTopLevel": [
          "compatibility",
          "recommended",
          "all",
          "base",
          "industry"
        ],
        "notes": "Canonical-only payload when CANONICAL_MODULE_API_ONLY=1."
      }
    },
    {
      "endpoint": "GET /api/industries/[industry]/modules",
      "legacyMode": {
        "requiredTopLevel": [
          "industry",
          "canonical",
          "suites",
          "capabilities",
          "optionalSuites",
          "compatibility",
          "coreModules",
          "industryPacks",
          "optionalModules"
        ]
      },
      "canonicalOnlyMode": {
        "requiredTopLevel": [
          "industry",
          "canonical",
          "suites",
          "capabilities",
          "optionalSuites"
        ],
        "forbiddenTopLevel": [
          "compatibility",
          "coreModules",
          "industryPacks",
          "optionalModules"
        ]
      }
    },
    {
      "endpoint": "POST /api/industries/[industry]/modules",
      "legacyMode": {
        "requiredTopLevel": [
          "success",
          "canonical",
          "compatibility",
          "enabledModules",
          "enabledPacks"
        ]
      },
      "canonicalOnlyMode": {
        "requiredTopLevel": [
          "success",
          "canonical"
        ],
        "forbiddenTopLevel": [
          "compatibility",
          "enabledModules",
          "enabledPacks"
        ]
      }
    },
    {
      "endpoint": "POST /api/industries/custom/modules",
      "legacyMode": {
        "requiredTopLevel": [
          "success",
          "canonical",
          "compatibility",
          "enabledModules",
          "enabledFeatures",
          "industryName"
        ]
      },
      "canonicalOnlyMode": {
        "requiredTopLevel": [
          "success",
          "canonical",
          "industryName"
        ],
        "forbiddenTopLevel": [
          "compatibility",
          "enabledModules",
          "enabledFeatures"
        ]
      }
    },
    {
      "endpoint": "POST /api/ai/analyze-industry",
      "legacyMode": {
        "requiredTopLevel": [
          "industryName",
          "canonical",
          "industryFeatures",
          "description",
          "keyProcesses",
          "coreModules",
          "compatibility",
          "aiService"
        ]
      },
      "canonicalOnlyMode": {
        "requiredTopLevel": [
          "industryName",
          "canonical",
          "industryFeatures",
          "description",
          "keyProcesses",
          "aiService"
        ],
        "forbiddenTopLevel": [
          "coreModules",
          "compatibility"
        ]
      }
    }
  ]
}
```

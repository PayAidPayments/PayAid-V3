# Social OAuth Smoke Evidence

- Captured at: 2026-04-25T14:26:23.653Z
- Command: `npm run run:social-oauth-smoke-pipeline`
- Exit code: 1
- Overall OK: no

## Summary JSON

```json
{
  "parseError": "Pipeline output was not valid JSON",
  "stdout": ""
}
```

## stderr

```text
{
  "ok": false,
  "error": "Missing SOCIAL_SMOKE_AUTH_TOKEN",
  "nextSteps": [
    "Set SOCIAL_SMOKE_AUTH_TOKEN to a valid app JWT for a tenant admin/owner user.",
    "Run: node scripts/smoke-social-oauth-connectors.mjs"
  ]
}
```

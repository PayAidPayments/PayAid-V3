# Canonical Staging Env Template

Canonical details fetched from current rollout setup:

- Canonical feature flag: `CANONICAL_MODULE_API_ONLY=1`
- Canonical verification endpoints:
  - `GET /api/modules`
  - `GET /api/industries/[industry]/modules`
  - `POST /api/industries/[industry]/modules`
  - `POST /api/industries/custom/modules`
  - `POST /api/ai/analyze-industry`
- Known hosted URL from existing evidence: `https://payaid-v3.vercel.app`

Copy these into your shell before running staging checks.

```powershell
$env:CANONICAL_STAGING_BASE_URL="https://payaid-v3.vercel.app"
$env:CANONICAL_STAGING_AUTH_TOKEN="paste-bearer-token"
$env:CANONICAL_STAGING_INDUSTRY="retail"
$env:CANONICAL_STAGING_RUN_MUTATIONS="1"
```

If you do not have a token, fetch one via login:

```powershell
$env:CANONICAL_STAGING_BASE_URL="https://payaid-v3.vercel.app"
$env:CANONICAL_STAGING_LOGIN_EMAIL="admin@demo.com"
$env:CANONICAL_STAGING_LOGIN_PASSWORD="paste-password"
npm run get:canonical-staging-token
```

Then run:

```powershell
npm run check:canonical-staging-runtime
npm run apply:canonical-staging-runtime-artifact
```

Or one command:

```powershell
npm run run:canonical-staging-evidence-pipeline
```

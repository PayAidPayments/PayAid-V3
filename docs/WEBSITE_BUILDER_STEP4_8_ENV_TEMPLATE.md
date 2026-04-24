# Website Builder Step 4.8 Env Template

Copy these into your shell before running Step 4.8 runtime automation.

Known hosted URL from existing evidence:

- `https://payaid-v3.vercel.app`

```powershell
$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"
$env:WEBSITE_BUILDER_AUTH_TOKEN="paste-bearer-token"
```

If you do not have a token, fetch one via login:

```powershell
$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"
$env:WEBSITE_BUILDER_LOGIN_EMAIL="admin@demo.com"
$env:WEBSITE_BUILDER_LOGIN_PASSWORD="paste-password"
npm run get:website-builder-step4-8-token
```

Then run:

```powershell
npm run check:website-builder-step4-8-runtime
npm run apply:website-builder-step4-8-runtime-artifact
```

Or one command:

```powershell
npm run run:website-builder-step4-8-evidence-pipeline
```

Full gate pack (runtime evidence + ready-to-commit preflight):

```powershell
npm run run:website-builder-ready-to-commit-pack
```

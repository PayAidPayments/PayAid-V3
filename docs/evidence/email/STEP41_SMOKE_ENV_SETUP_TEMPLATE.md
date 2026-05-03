# Step 4.1 Smoke Env Setup (PowerShell)

Use this in the same shell before running `smoke:email-step41-runtime`.

```powershell
$env:BASE_URL="https://<your-vercel-url>"
$env:TENANT_ID="<tenant-id>"
$env:AUTH_TOKEN="<bearer-token>"
$env:EMAIL_CAMPAIGN_ID="<campaign-id>"
# Optional:
$env:EMAIL_RETRY_JOB_ID="<failed-job-id>"
```

Then run:

```powershell
npm run check:email-step41-smoke-env
npm run smoke:email-step41-runtime
```

Expected:

- Env readiness returns `ready: true`
- Runtime smoke returns `ok: true`
- New artifact appears at `docs/evidence/email/*-email-step41-runtime-smoke.md`


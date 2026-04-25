# Email Step 4.1 Auth Smoke Pipeline

- Timestamp: 2026-04-24T13:22:45.528Z
- Overall ok: no
- BASE_URL: http://localhost:3000
- TENANT_ID: cmo9lebrp0001qjwe54slsy4d
- AUTH_TOKEN present: no
- EMAIL_CAMPAIGN_ID: [missing]
- ID resolve note: Auto-resolve attempted from DB (Campaign, EmailSendJob, EmailCampaignSenderPolicy).
- Token resolve note: Missing base URL or login credentials for token mint.

## Command status

- check:email-step41-smoke-env: FAIL (exit=1)
- smoke:email-step41-runtime: FAIL (exit=1)

## check:email-step41-smoke-env output

```text
> payaid-v3@0.1.0 check:email-step41-smoke-env
> node scripts/check-email-step41-smoke-env.mjs

{
  "ready": false,
  "outPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T13-22-55-793Z-email-step41-smoke-env-readiness.md"
}
```

## smoke:email-step41-runtime output

```text
> payaid-v3@0.1.0 smoke:email-step41-runtime
> node scripts/smoke-email-step41-runtime.mjs

{
  "ok": false,
  "outputPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-24T13-23-02-303Z-email-step41-runtime-smoke.md",
  "missing": [
    "AUTH_TOKEN",
    "EMAIL_CAMPAIGN_ID"
  ]
}
```

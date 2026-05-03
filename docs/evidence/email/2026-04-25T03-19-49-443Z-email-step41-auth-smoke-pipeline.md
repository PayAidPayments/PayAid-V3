# Email Step 4.1 Auth Smoke Pipeline

- Timestamp: 2026-04-25T03:19:49.443Z
- Overall ok: no
- BASE_URL: https://payaid-v3.vercel.app
- TENANT_ID: cmjptk2mw0000aocw31u48n64
- AUTH_TOKEN present: yes
- EMAIL_CAMPAIGN_ID: cmoczj4oi0001kax6e3a13lvz
- ID resolve note: Auto-resolve attempted from DB (Campaign, EmailSendJob, EmailCampaignSenderPolicy).
- Token resolve note: Using existing token from env.

## Command status

- check:email-step41-smoke-env: PASS (exit=0)
- smoke:email-step41-runtime: FAIL (exit=1)

## check:email-step41-smoke-env output

```text
> payaid-v3@0.1.0 check:email-step41-smoke-env
> node scripts/check-email-step41-smoke-env.mjs

{
  "ready": true,
  "outPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-25T03-19-51-452Z-email-step41-smoke-env-readiness.md"
}
```

## smoke:email-step41-runtime output

```text
> payaid-v3@0.1.0 smoke:email-step41-runtime
> node scripts/smoke-email-step41-runtime.mjs

{
  "ok": false,
  "outputPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-25T03-19-51-967Z-email-step41-runtime-smoke.md"
}
```

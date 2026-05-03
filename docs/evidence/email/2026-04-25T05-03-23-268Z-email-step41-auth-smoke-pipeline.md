# Email Step 4.1 Auth Smoke Pipeline

- Timestamp: 2026-04-25T05:03:23.268Z
- Overall ok: yes
- BASE_URL: https://payaid-v3.vercel.app
- TENANT_ID: cmjptk2mw0000aocw31u48n64
- AUTH_TOKEN present: yes
- EMAIL_CAMPAIGN_ID: cmoczj4oi0001kax6e3a13lvz
- ID resolve note: Auto-resolve attempted from DB (Campaign, EmailSendJob, EmailCampaignSenderPolicy).
- Token resolve note: Using existing token from env.

## Command status

- check:email-step41-smoke-env: PASS (exit=0)
- smoke:email-step41-runtime: PASS (exit=0)

## check:email-step41-smoke-env output

```text
> payaid-v3@0.1.0 check:email-step41-smoke-env
> node scripts/check-email-step41-smoke-env.mjs

{
  "ready": true,
  "outPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-25T05-03-46-342Z-email-step41-smoke-env-readiness.md"
}
```

## smoke:email-step41-runtime output

```text
> payaid-v3@0.1.0 smoke:email-step41-runtime
> node scripts/smoke-email-step41-runtime.mjs

{
  "ok": true,
  "outputPath": "D:\\Cursor Projects\\PayAid V3\\docs\\evidence\\email\\2026-04-25T05-03-53-753Z-email-step41-runtime-smoke.md"
}
```

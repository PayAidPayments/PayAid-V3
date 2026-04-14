# CRM Feature Audit (Playwright)

Sixteen feature / AI / integration checks for native CRM routes (`tests/e2e/crm-audit/crm-audit.spec.ts`).

## Prerequisites

- Dashboard dev server reachable (default `http://localhost:3000`). Start from repo root: `npm run dev`.
- Seeded tenant data (demo tenant) so login and CRM routes return data.
- If local Redis/Upstash lookups fail noisy DNS: clear `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REDIS_URL` in the shell running dev (optional).

## Run (recommended)

From **repo root**:

```bash
npm run test:e2e:crm-audit
```

This uses **`playwright.crm-audit.config.ts`** (one `chromium` project, 16 tests).  
Do **not** run only `playwright test tests/e2e/crm-audit -c playwright.config.ts` without `--project chromium` — the root config has five projects and will execute the same spec **five times**.

The npm script sets: `PLAYWRIGHT_NO_WEB_SERVER=1`, `CRM_AUDIT_SKIP_PREFLIGHT=1`, `PLAYWRIGHT_BASE_URL=http://localhost:3000`. JSON report: `e2e-crm-audit-results.json`.

## Optional env

| Variable | Purpose |
| --- | --- |
| `CRM_AUDIT_TENANT` | Tenant slug/segment for URLs (default demo) |
| `CRM_AUDIT_TENANT_ID` | Tenant id if not inferred from storage |
| `CRM_AUDIT_CONTACT_ID` | Contact id for 360 / contact probes |
| `CRM_AUDIT_SKIP_PREFLIGHT=1` | Skip HTTP preflight warmup (faster when dev is already hot) |

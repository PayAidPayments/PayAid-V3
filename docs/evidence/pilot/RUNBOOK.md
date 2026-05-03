# Inbound pilot — evidence runbook (commands only)

Canonical artifact bundle pointer: `2026-04-20-inbound-pilot-evidence-index.md`.

## 1. Table probe (no writes)

```powershell
cd "D:\Cursor Projects\PayAid V3"
$env:DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?schema=public"
npx tsx scripts/verify-inbound-pilot-smoke.ts
npx tsx scripts/verify-inbound-pilot-smoke.ts --tenant=<id|slug|subdomain>
```

Save stdout to `docs/evidence/pilot/YYYY-MM-DD-inbound-db-verify.md`.

## 2. Integration smoke (writes + cleanup)

Local Docker DB (from repo root):

```powershell
npm run smoke:inbound-pilot:local -- --tenant=demo
```

`--tenant` may be **`Tenant.id`** (cuid), **`Tenant.slug`**, or **`Tenant.subdomain`** (`prisma/seed.ts` uses `subdomain` **`demo`** / **`sample`**, not always `slug`).

Hosted / other URL: set `DATABASE_URL` (and clear `DATABASE_DIRECT_URL` if you use the local override pattern), then:

```powershell
npm run smoke:inbound-pilot -- --tenant=<id|slug|subdomain>
```

Save stdout to `docs/evidence/pilot/YYYY-MM-DD-inbound-smoke.md` on success.

Latest hosted example: `2026-04-20-inbound-smoke-hosted.md` (`--tenant=sample`).

## 3. Decisions API (contract)

**Automated (CI / local):** M2 smoke includes route-level mocks (no live server):

```powershell
npm run test:m2:smoke -- --testPathPattern="m2-crm-inbound-routing-decisions-route|m2-crm-inbound-orchestration-logs-route|m2-crm-lead-routing-get-route|m2-module-license-filter"
```

## 4. Decisions API (manual curl)

Replace `TOKEN`, `TENANT_ID`, host.

```powershell
curl.exe -s -o NUL -w "%{http_code}" -H "Authorization: Bearer TOKEN" "http://127.0.0.1:3000/api/crm/inbound-routing/decisions?tenantId=TENANT_ID&limit=40"
curl.exe -s -w "%{http_code}" -H "Authorization: Bearer TOKEN" "http://127.0.0.1:3000/api/crm/inbound-routing/decisions?tenantId=TENANT_ID&limit=notanumber"
curl.exe -s -w "%{http_code}" -H "Authorization: Bearer TOKEN" "http://127.0.0.1:3000/api/crm/inbound-routing/decisions?tenantId=TENANT_ID&contactId=bad"
```

Record status codes in the same dated evidence file or a `…-decisions-api.md` snippet.

## 5. UI checklist (E4)

Copy `INBOUND_UI_QA_CHECKLIST.template.md` → `YYYY-MM-DD-inbound-ui-qa.md`, fill table, attach links to screenshots.

## 6. PR handoff (CLI + browser fallback)

Preferred (GitHub CLI available):

```powershell
gh --version
gh pr create --title "crm: close inbound pilot gate with hosted/local evidence" --body-file docs/evidence/pilot/2026-04-20-inbound-pilot-pr-body.long.md
```

If `gh` is unavailable, open this URL in browser and paste the same long/short body file content:

`https://github.com/PayAidPayments/PayAid-V3/pull/new/docs/inbound-pilot-pr-handoff`


# Module routing (Zoho-style suite)

**apps/web** is the PayAid Suite shell. It exposes landing, login, module switcher, and routes that proxy to the CRM and Finance module apps.

## Routing

| Shell route | Proxies to | Env var |
|-------------|------------|---------|
| `/crm/[slug]/...` | CRM module app | `PAYAID_CRM_URL` (e.g. `http://localhost:3003`) |
| `/sales-studio/[slug]/...` | Sales Studio (Frappe CRM) | `PAYAID_SALES_STUDIO_URL` (e.g. `http://crm.localhost:8000`) |
| `/finance/[slug]/...` | Finance module app | `PAYAID_FINANCE_URL` (e.g. `http://localhost:3004`) |

- **Tenant** is resolved by `slug` from **packages/db** (Tenant model). If no tenant is found, the page shows "Tenant not found".
- The shell builds a **target URL** for the iframe:
  - Base = `PAYAID_CRM_URL` or `PAYAID_FINANCE_URL`
  - Query: `?tenant=<tenant.id>&slug=<tenant.slug>`
  - Hash path (if any): `#/<rest>` (e.g. `#/dashboard`, `#/invoices`)

Example target URLs:

- CRM: `http://localhost:3003/?tenant=clxxx&slug=demo-1234#/dashboard`
- Finance: `http://localhost:3004/?tenant=clxxx&slug=demo-1234#/dashboard`

## Redirects (no slug)

- **/crm** → redirects to `/crm/[slug]/dashboard` using tenant from `?tenantId=`, session, cookie, or `"demo"`.
- **/sales-studio** → redirects to `/sales-studio/[slug]/dashboard` with the same tenant resolution.
- **/finance** → redirects to `/finance/[slug]/dashboard` with the same tenant resolution.

## Module apps (placeholders)

- **apps/payaid-crm** – Next.js placeholder on port **3003**. Replace with EspoCRM fork; set `PAYAID_CRM_URL` to that app’s URL.
- **apps/payaid-finance** – Next.js placeholder on port **3004**. Replace with Bigcapital fork; set `PAYAID_FINANCE_URL` to that app’s URL.

## Running

```bash
pnpm dev
```

- **apps/web** (shell): default port (e.g. 3001)
- **apps/payaid-crm**: 3003
- **apps/payaid-finance**: 3004

Set in **apps/web** `.env` or environment:

- `PAYAID_CRM_URL=http://localhost:3003`
- `PAYAID_SALES_STUDIO_URL=http://crm.localhost:8000` (Frappe CRM Docker)
- `PAYAID_FINANCE_URL=http://localhost:3004`

## CRM = forked only

The shell has **no scratch CRM**. All `/crm/[slug]/...` routes are handled by the catch-all **app/crm/[slug]/[[...rest]]/page.tsx**, which renders the iframe to `PAYAID_CRM_URL`. The standalone **apps/crm** app has been removed; use **apps/payaid-crm** (placeholder or EspoCRM fork).

## Tenant and packages/db

Tenants and `tenantId` are unchanged: **packages/db** remains the single source of truth. The shell does not change the Prisma schema; it only resolves tenant by slug and passes `tenant` and `slug` to the module apps via the iframe URL.

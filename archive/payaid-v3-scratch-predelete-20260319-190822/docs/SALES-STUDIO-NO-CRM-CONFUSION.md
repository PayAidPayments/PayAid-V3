# Add Sales Studio (Frappe) – No CRM Confusion

**Rule:** Two separate modules, different names and paths. Do not rename Espo; do not merge CRM and Sales Studio.

| Module         | Env var                   | Path            | Backend              |
|----------------|---------------------------|-----------------|----------------------|
| **CRM**        | `PAYAID_CRM_URL`          | `/crm`          | Espo (localhost:3003) |
| **Sales Studio** | `PAYAID_SALES_STUDIO_URL` | `/sales-studio` | Frappe (crm.localhost:8000) |
| **Finance**   | `PAYAID_FINANCE_URL`      | `/finance`      | Bigcapital (3004)    |

- **CRM** = records, leads, contacts, deals (Espo).
- **Sales Studio** = pipelines, sequences, forecasting (Frappe). Iframe label: "PayAid Sales Studio".

## .env (cursor-proof)

```env
PAYAID_CRM_URL=http://localhost:3003
PAYAID_SALES_STUDIO_URL=http://crm.localhost:8000
PAYAID_FINANCE_URL=http://localhost:3004
```

## Shell structure

- **Module list:** `apps/web/lib/modules.ts` — entries: `crm`, `sales-studio`, `finance` (order: CRM | Sales Studio | Finance).
- **Iframe pages:**
  - `app/crm/[slug]/[[...rest]]/page.tsx` → `src={PAYAID_CRM_URL + query + hash}`
  - `app/sales-studio/[slug]/[[...rest]]/page.tsx` → `src={PAYAID_SALES_STUDIO_URL + "/app/crm" + query + hash}` (Frappe CRM workspace is at `/app/crm`)

## Tasks when adding or fixing

1. Add or keep the env vars above in `apps/web/.env` or `.env.local`.
2. In `modules.ts`, keep the `sales-studio` entry (name: "Sales Studio", href: "/sales-studio").
3. Do **not** copy app/crm to app/sales-studio by renaming "CRM" to "Sales Studio" everywhere; keep two distinct apps and two routes.
4. Sales Studio iframe: `base = PAYAID_SALES_STUDIO_URL`, target URL = `${base}/app/crm?tenant=...&slug=...#/path`.

## Test

- `/crm` → Espo loads (PAYAID_CRM_URL).
- `/sales-studio` → Frappe loads (PAYAID_SALES_STUDIO_URL, open `/app/crm` on that host).
- Switcher shows **CRM | Sales Studio | Finance**.

## Commit

Use a clear message, e.g. `sales-studio-iframe` or `feat(shell): add Sales Studio (Frappe) alongside CRM (Espo)`.

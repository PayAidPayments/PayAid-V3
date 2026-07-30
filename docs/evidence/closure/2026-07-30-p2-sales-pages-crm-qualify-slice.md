# P2 Sales Pages → CRM qualify — first slice (2026-07-30)

## Gate

`npm run release:readiness` **OVERALL PASS** (see `docs/evidence/closure/2026-07-30-post-redeploy-canonical-readiness-pass.md`).

## Change

Wired `apps/sales/app/api/sales-submissions/route.ts` to **landing-page-bridge-v2** parity with dashboard:

- Increment LandingPage conversions
- Parse UTM attribution
- `processInboundLead` (merge / score / qualify / assign → Contact)
- Response includes `contactId` + `compatibility.mode: landing-page-bridge-v2`
- Removed stub `crmSync: 'queued'`

Out of scope this slice: Lead Intelligence discovery, auto-Deal create, CRM Mapping UI, canonical `sales_*` schema merge.

## Smoke

```bash
node scripts/validate-p2-sales-pages-crm-qualify.mjs
```

Result: `pass: true`

## Next

- Live POST smoke against published sales page (tenant DB) when Sales host is deployed
- CRM Deals reliability: proxy/SLO only (BD-05 stays closed)
- Submissions View crm sync status + retry (screen plan)

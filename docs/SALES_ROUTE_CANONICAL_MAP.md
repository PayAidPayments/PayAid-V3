# Sales Route Canonical Map

Last updated: 2026-04-24

Purpose: keep Sales IA consistent around **Home / Sales Pages / Checkout Pages / Orders** and prevent legacy page-builder route drift.

## Canonical routes

- Home: `/sales/[tenantId]/Home`
- Sales Pages list: `/sales/[tenantId]/Sales-Pages`
- Sales Pages create: `/sales/[tenantId]/Sales-Pages/new`
- Sales Pages detail: `/sales/[tenantId]/Sales-Pages/[id]`
- Checkout Pages list: `/sales/[tenantId]/Checkout-Pages`
- Orders list: `/sales/[tenantId]/Orders`

## Legacy aliases (redirects)

- `/sales/[tenantId]/Landing-Pages` -> `/sales/[tenantId]/Sales-Pages`
- `/sales/[tenantId]/Landing-Pages/new` -> `/sales/[tenantId]/Sales-Pages/new`
- `/sales/[tenantId]/Landing-Pages/[id]` -> `/sales/[tenantId]/Sales-Pages/[id]`

## Redirect enforcement notes

- Redirect is enforced server-side in `apps/dashboard/proxy.ts`.
- Redirect should preserve query params for deep links and filtered views.
- Legacy route files remain for compatibility but canonical entry/navigation must use `Sales-Pages`.
- Automated regression test: `apps/dashboard/__tests__/proxy.test.ts`.
- Dedicated runner: `npm run test:sales:proxy-canonical`.

## Guardrails for future changes

- New page-builder surfaces must attach to `Sales-Pages` route family.
- Do not introduce new `Landing-Pages` links in nav/CTAs or docs.
- Any new legacy alias must be listed here and added to proxy redirect logic.

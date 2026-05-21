# Finance API protection model

**Date:** 2026-05-18  
**Scope:** Dashboard finance/billing/GST routes (`apps/dashboard/app/api`)

## Standard (required)

All tenant-scoped finance mutations and reads use:

1. **`requireFinanceTenant(request, organizationId?)`** — [`lib/api/finance/resolve-finance-tenant.ts`](../../lib/api/finance/resolve-finance-tenant.ts)
   - Calls `requireModuleAccess(request, 'finance')` (JWT Bearer + license).
   - If `organizationId` query/body is present, it **must equal** JWT `tenantId` or response is **403 TENANT_MISMATCH**.
   - All Prisma queries use **`auth.tenantId`** from the token, never unvalidated client org ids alone.

2. **`handleLicenseError`** — returned for missing/invalid token (**401**) or unlicensed module (**403**).

## Alternate patterns (allowed when documented)

| Pattern | Use case | Example |
|---------|----------|---------|
| `authenticateRequest` + integration RBAC | Settings / integrations | `api/settings/smtp` |
| `getSessionToken` + dashboard proxy | Legacy finance pages proxying to monolith | `api/finance/gst-reports` |
| Webhook signature | Provider callbacks | `api/billing/webhook` (must verify signature) |
| Portal token | Customer-facing invoice links | `api/portal/invoices/*` |

## P0 routes fixed (2026-05-18)

| Route | Protection |
|-------|------------|
| `GET/POST /api/finance/expenses` | `requireFinanceTenant` |
| `GET /api/finance/gst-returns` | `requireFinanceTenant` |
| `GET/POST /api/gst/search` | `requireFinanceTenant` |
| `GET /api/finance/gstr3b/[period]` | `requireFinanceTenant` |

## Remaining gap register (non-P0)

See [`a1-finance-api-gaps.md`](./a1-finance-api-gaps.md) — portal/webhook/admin routes need explicit review, not open unauthenticated tenant reads.

## Verification

```bash
# Without Bearer — expect 401/403 after deploy
curl -s -o /dev/null -w "%{http_code}" "https://<host>/api/finance/expenses?organizationId=<uuid>"
```

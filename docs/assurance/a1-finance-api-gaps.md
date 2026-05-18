# A1 — Finance API auth gap register

**Date:** 2026-05-18  
**Scope:** `apps/dashboard/app/api/**` finance/billing/gst/invoice paths

## Summary

| Metric | Value |
|--------|-------|
| Finance-related `route.ts` files | **71** |
| With `requireModuleAccess` / `requireAnyModuleAccess` | **52** |
| Without (this register) | **19** |
| With alternate auth (`authenticateRequest`, etc.) | **7** of 19 |
| **No auth in file** | **12** of 19 |

## Routes without `requireModuleAccess`

| Path | Alt auth in file | Staging probe (no Bearer) | Severity |
|------|------------------|---------------------------|----------|
| `api/admin/billing/route.ts` | No | Not probed | P1 |
| `api/billing/checkout/complete/route.ts` | Yes | Not probed | Review |
| `api/billing/create-order/route.ts` | Yes | Not probed | Review |
| `api/billing/orders/route.ts` | Yes | Not probed | Review |
| `api/billing/orders/[orderId]/route.ts` | Yes | Not probed | Review |
| `api/billing/trial-status/route.ts` | No | Not probed | P1 |
| `api/billing/webhook/route.ts` | No | Webhook (signature expected) | P2 if verified |
| `api/finance/accounting/route.ts` | Yes | Not probed | Review |
| `api/finance/expenses/route.ts` | **No** | `GET ?organizationId=` → **200** | **P0** |
| `api/finance/gst-reports/route.ts` | Yes | Not probed | Review |
| `api/finance/gst-returns/route.ts` | **No** | `GET ?organizationId=` → **200** | **P0** |
| `api/finance/gstr3b/[period]/route.ts` | No | Not probed | P1 |
| `api/finance/invoices/auto-create/route.ts` | No | Not probed | P1 |
| `api/finance/invoices/[id]/payaid-link/route.ts` | No | Not probed | P1 |
| `api/finance/purchase-orders/route.ts` | Yes | Not probed | Review |
| `api/gst/search/route.ts` | **No** | `GET ?q=test` → **200** | **P0** |
| `api/invoices/[id]/track-payment-link/route.ts` | No | Not probed | P1 |
| `api/portal/invoices/route.ts` | No | Portal token expected | P2 |
| `api/portal/invoices/[id]/payment-link/route.ts` | No | Portal token expected | P2 |

**Staging host:** `https://payaid-v3.vercel.app` (2026-05-18 UTC)

## Invoice / GST / audit (runtime)

| Check | Status | Notes |
|-------|--------|-------|
| GST invoice create flow | **PENDING** | No `CANONICAL_STAGING_AUTH_TOKEN` |
| Draft-first send | **PENDING** | — |
| `auditLog` on invoice mutations | **FAIL** (static) | No matches under `apps/dashboard/app/api/**/invoice*`; milestone handoff uses `auditLog` in `lib/api/projects/*` only |

## Canonical `apps/finance`

| Route | Auth | Status |
|-------|------|--------|
| `api/billing/invoices` | `requireModuleAccess('finance')` | PASS |
| `api/projects/handoff/invoice-prefill` | `requireAnyModuleAccess` | PASS |

## A1 verdict

**FAIL (runtime)** for unauthenticated finance/GST reads on staging. **PARTIAL (static)** for canonical finance app. Close P0 gaps before Revenue Desk go.

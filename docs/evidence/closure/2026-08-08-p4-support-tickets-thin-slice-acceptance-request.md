# P4 Support — tickets thin slice: Product acceptance request (2026-08-08)

## Status

**ACCEPTED** — see `docs/evidence/closure/2026-08-08-p4-support-tickets-thin-slice-product-accepted.md`.

Recommendation: `docs/evidence/closure/2026-08-08-next-module-recommendation-support-tickets-slice.md`  
Projects / Finance remain **CLOSED** — do not reopen.

## Verdict

Accept **Support** as the next open module and authorize **only** the ticket operator thin slice below.

## Scope to approve

| # | Requirement | Notes |
|---|-------------|--------|
| 1 | Create ticket | Optional CRM `contactId` |
| 2 | List tickets for tenant | Tenant-scoped list |
| 3 | Status flow | Product `new → open → resolved\|closed` |
| 4 | DB mapping | `SupportCase.status` string (same vocabulary) |
| 4b | Controlled DDL (prerequisite) | Idempotent `SupportCase` table only — **not** blind apply of all 11 never-applied pkg migrations |
| 5 | Proof order | Contract → hosted API proof **before** any UI |
| 6 | Thin UI | Only if Tickets hub still stubby/broken after API proof |

Preferred surface: slim-safe `/api/support/tickets/slice` (prisma + license only).

## Explicit non-goals (locked)

- No Module Switcher promotion / Support primary-tile GA  
- No live email / WhatsApp / chat send  
- No SLA / assignment / KB / Unibox rebuild  
- No Voice Stage 4 / Appointments / Finance / Projects reopen  
- No closed-lane reopen

## Delivery pattern

1. Smallest useful API + data flow  
2. Contract smoke + hosted Ready proof  
3. Product acceptance of proof  
4. Thin UI only if hub still stubby  
5. Product acceptance → mark Support tickets loop demo-ready  
6. Next module only if Product asks  

## Acceptance checkbox (Product)

- [x] **ACCEPTED** — authorize Support tickets thin slice as specified  
- [ ] **REJECTED** — name alternate open module / slice  

| Field | Value |
|-------|--------|
| Decision | **ACCEPTED** |
| Date | 2026-08-08 |
| Signer | Product (“go ahead with the recommended next steps”) |

## After ACCEPTED

Engineering implements **only** the smallest Support tickets loop, records evidence under `docs/evidence/support/` + closure pack, and stops for Product acceptance of the proof before UI (unless hub is proven stubby).

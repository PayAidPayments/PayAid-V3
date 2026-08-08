# P4 Support — tickets hub probe (2026-08-08)

## Verdict

**HUB_STUBBY** — thin operator UI authorized on proven `/api/support/tickets/slice`.

## Evidence

| Surface | Result |
|---------|--------|
| `GET /api/support/tickets` (authed) | **200 demo rows** (`demo-tkt-1` / Acme Trading) — not SupportCase |
| `GET /support/{tenant}/Tickets` | 307 redirect |
| `GET /dashboard/support/tickets` | 200 app shell (not slice-backed) |
| Proven slice | `/api/support/tickets/slice` hosted PASS |

## Authorization

Thin UI at `/dashboard/support/tickets/requests` on slice API only — same pattern as Finance invoices + Projects delivery.

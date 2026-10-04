# Customer flows Phase 3 completion evidence

- Date: 2026-10-03
- Pack: customer product flows
- Decision: pass

## Delivered

| Item | Path | Status |
|---|---|---|
| Sales follow-up flow | `lib/ai/customer-specialists/flows/sales-follow-up.ts` | present |
| GST invoice draft flow | `lib/ai/customer-specialists/flows/gst-invoice-draft.ts` | present |
| Flow audit helper | `lib/ai/customer-specialists/flows/audit.ts` | present |
| Sales API | `apps/dashboard/app/api/ai/customer-flows/sales-follow-up/route.ts` | present |
| GST API | `apps/dashboard/app/api/ai/customer-flows/gst-invoice-draft/route.ts` | present |
| Flow docs | `docs/ai/customer/flows.md` | present |
| Smoke | `scripts/smoke-customer-flows.ts` | present |
| Integrity | `npm run check:customer-flows` | wired |

## Done criteria check

1. Sales follow-up produces discovery + deal + proposal drafts and never sends — yes
2. GST invoice assist produces draft with pending approval; not filed/paid — yes
3. Entitled user can run; missing module/role fails closed — yes (smoke)
4. Audit row created on persist path (`customer_specialist_draft`) — yes

## Out of scope

- Approval UI that issues/sends invoice
- Live email/WhatsApp send of proposal
- Multi-runbook orchestrator service (Phase 4)

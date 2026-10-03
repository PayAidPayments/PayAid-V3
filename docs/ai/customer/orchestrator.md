# Customer Thin Orchestrator + Approval UX (Phase 4)

## Orchestrator

- **Library:** `lib/ai/customer-specialists/orchestrator/`
- **Runbooks:** `lib/ai/customer-specialists/orchestrator/runbooks.json`
- **API:** `POST /api/ai/customer-flows/orchestrate`

Behavior:

1. Select runbook (`sales-follow-up` | `gst-invoice-draft`)
2. Fail closed if tenant lacks required module
3. Run Phase 3 flow roster in order
4. Entitlement/validation denials escalate immediately (not retried)
5. Unexpected errors retry up to `maxAttempts` (3), then escalate
6. Store handoffs in `AuditLog` (`entityType: customer_flow_handoff`) when persistence is enabled

## Approval UX

- **UI:** `/ai-studio/[tenantId]/Flows`
- **List pending:** `GET /api/ai/customer-flows/drafts?pending=1`
- **Decide:** `POST /api/ai/customer-flows/drafts/[draftId]/approve`

Approve/reject only updates draft approval status in the audit trail.

Hard guarantees after approval:

- `executable: false`
- not sent
- not filed
- not paid

## Verification

```bash
npm run check:customer-flows
npm run check:customer-orchestrator
```

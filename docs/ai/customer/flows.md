# Customer Product Flows (Phase 3)

Draft-only in-product flows built on the Phase 2 entitlement catalog.

## Flows

### 1) Sales follow-up draft

- **Route:** `POST /api/ai/customer-flows/sales-follow-up`
- **Agents (in order):**
  1. `sales-discovery-coach` → `discovery_call_plan`
  2. `sales-deal-strategist` → `deal_scorecard`
  3. `sales-proposal-strategist` → `proposal_draft`
- **License:** `sales` or `crm`
- **Output:** editable draft bundle (`executable: false`, `sendStatus: not_sent`)
- **Audit:** `customer_specialist_draft` + specialist activity when available

### 2) GST invoice draft

- **Route:** `POST /api/ai/customer-flows/gst-invoice-draft`
- **Agent:** `finance-bookkeeper` → `invoice_draft`
- **License:** `finance`
- **Roles:** manager/admin/owner
- **Output:** GST-aware invoice draft with CGST/SGST or IGST breakup
- **Approval:** `approvalStatus: pending_approval`, `executable: false`
- **Hard bans:** not issued, not paid, not filed

## Fail-closed behavior

| Case | Result |
|---|---|
| Missing module | HTTP 403, reason `MODULE_NOT_LICENSED` |
| Insufficient role (finance) | HTTP 403, reason `ROLE_DENIED` |
| Validation error | HTTP 400, reason `VALIDATION_ERROR` |

## Example bodies

### Sales follow-up

```json
{
  "contactName": "Asha Rao",
  "companyName": "Rao Traders",
  "dealValueInr": 320000,
  "notes": "Urgent need this month"
}
```

### GST invoice draft

```json
{
  "customerName": "Beta Pvt Ltd",
  "customerGstin": "29ABCDE1234F1Z5",
  "supplierStateCode": "KA",
  "placeOfSupplyStateCode": "MH",
  "lineItems": [
    {
      "description": "Implementation services",
      "hsn": "998314",
      "quantity": 2,
      "unitPriceInr": 5000,
      "gstRatePercent": 18
    }
  ]
}
```

## Verification

```bash
npm run check:customer-specialists
npm run check:customer-flows
```

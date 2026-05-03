# M2 staging validation evidence

## Capture

```bash
set PAYAID_BASE_URL=https://your-staging-host
set PAYAID_AUTH_TOKEN=...
set PAYAID_TENANT_ID=...   # required for optional DB integrity check below
set DATABASE_URL=...       # staging read-only, only when FK check enabled
set M2_VALIDATE_CALL_FK=1  # optional: verify AICall.contactId/dealId/leadId resolve to Contact/Deal
npm run collect:m2:staging-evidence
```

Writes a timestamped JSON file here. Checks:

- Marketplace catalog `total >= 8`
- Sample `GET /api/v1/calls` rows include CRM linkage (`contact_id` | `deal_id` | `lead_id`)
- `GET /api/v1/audit/actions?entityType=sdr_run` returns `sdr_run` actions

## Real evidence only

Synthetic reference payloads have been removed from this folder.
Use timestamped collector outputs only for sign-off (for example:
`2026-04-09T08-26-28-449Z-demo-business-pvt-ltd-m2-staging-validation.json`
and `2026-04-09T09-30-53-494Z-demo-business-pvt-ltd-m2-staging-validation.json`).

## DB FK note

`AICall.contactId`, `dealId`, `leadId` are optional string columns without Prisma relations to `Contact`/`Deal`/`Lead` (application-level linkage). API + audit evidence demonstrates end-to-end linkage; adding DB foreign keys is optional hardening.

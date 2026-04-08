# CRM ↔ Sales Studio Sync (PayAid Hub)

**Rules:** EspoCRM = source of truth for Contacts/Leads/Deals. Frappe = Sales views (pipelines/forecasts). **Hub** (Prisma DB) owns `ExternalContact` and sync logic. No direct Espo ↔ Frappe API calls.

```
EspoCRM (CRM) ←→ PayAid Hub (Prisma) ←→ Frappe CRM (Sales Studio)
```

---

## Data model

- **Hub table:** `ExternalContact` (email as key per tenant)
  - `tenantId`, `email`, `espoContactId`, `frappeLeadId`, `syncDirection`, `lastEspoSync`, `lastFrappeSync`, `tags`
- **Sync direction:** `CrmToSales` | `SalesToCrm` | `Bidirectional` (entitlements control behaviour)

---

## Webhook endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/webhooks/espo` | Espo → Hub upsert → optionally push to Frappe (if tenant has Sales Studio) |
| `POST /api/webhooks/frappe` | Frappe → Hub upsert → optionally push to Espo (if tenant has CRM) |

**Request body (espo):** `{ tenantId, entityType?, entityId?, email, name?, espoContactId? }`  
**Request body (frappe):** `{ tenantId, email, frappeLeadId?, lead_name?, pipeline_stage? }`

In production, verify webhook signatures (e.g. `X-Espo-Signature`, `X-Frappe-Signature`).

---

## Sync API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/sync/contacts/[email]?tenantId=` | Returns Hub mapping (espo_contact_id, frappe_lead_id) for that contact |

---

## Entitlements

- **tenant_modules** (TenantModule) controls which modules are enabled: `crm`, `sales-studio`, `finance`, etc.
- **Only CRM:** Hub sync CRM → Hub; Sales Studio 404 or "Upgrade to Pro".
- **Only Sales Studio:** Hub sync Sales → Hub; CRM 404 or "Upgrade for CRM"; Frappe Leads → Hub → optional "CRM stub" (email-only).
- **Full Suite:** Both + bidirectional sync.

---

## Implementation status

- [x] Prisma: `ExternalContact` + `SyncDirection` enum
- [x] `POST /api/webhooks/espo` – upsert Hub; **push to Frappe** when tenant has Sales Studio (via `lib/frappeClient.pushLeadToFrappe`). Set `PAYAID_SALES_STUDIO_API_KEY` + `PAYAID_SALES_STUDIO_API_SECRET` in env.
- [x] `POST /api/webhooks/frappe` – upsert Hub; TODO: push to Espo API
- [x] `GET /api/sync/contacts/[email]` – return mapping
- [x] Frappe API client (`lib/frappeClient.ts`) – create Lead in Frappe from Espo webhook
- [ ] Espo API client + auth (for Frappe → update Espo Deal)
- [ ] Webhook signature verification
- [x] WhatsApp relay: `POST /api/webhooks/whatsapp` forwards to Frappe `crm.webhook.whatsapp` (configure WAHA/Baileys to hit this URL)

---

## WhatsApp → Sales Studio

- **Relay:** `POST /api/webhooks/whatsapp` – forwards the request body to Frappe `POST {PAYAID_SALES_STUDIO_URL}/api/method/crm.webhook.whatsapp`.
- **Setup:** Point your WhatsApp gateway (WAHA, Baileys, or provider webhook) at your PayAid shell URL, e.g. `https://your-app/api/webhooks/whatsapp`. Frappe CRM will receive the same payload and can process sequences/replies.

---

## References

- [DATA-SYNC-ESPO-FRAPPE.md](./DATA-SYNC-ESPO-FRAPPE.md) – direction Espo → Frappe
- [.cursor/rules/crm-vs-sales-studio.mdc](../.cursor/rules/crm-vs-sales-studio.mdc) – CRM vs Sales Studio rules

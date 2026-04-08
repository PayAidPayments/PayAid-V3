# Data Sync: EspoCRM → Sales Studio (Frappe) – Future

**Status:** Optional, not yet implemented.

**Rule:** EspoCRM = core CRM (source of truth for Leads, Contacts, Accounts, Deals). Sales Studio (Frappe) = pipelines, sequences, forecasting. Both stay permanent; no replacement.

## Intended direction (when implemented)

- **Direction:** Espo (source CRM) → Frappe (sales views only). Not the other way around.
- **Mechanism (optional):** Frappe reads Espo/Postgres via Prisma bridge, or sync jobs push relevant entities (e.g. deals, contacts) to Frappe for pipeline/forecast views.
- **Scope:** Read-only in Frappe from CRM data, or controlled sync; no plan to make Frappe the source for core CRM records.

## References

- [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md) – Sales Studio section, Data sync (future)
- [CRM-SALES-SYNC-HUB.md](./CRM-SALES-SYNC-HUB.md) – Hub sync (ExternalContact, webhooks, API)
- `.cursor/rules/crm-vs-sales-studio.mdc` (at repo root) – CRM vs Sales Studio rules

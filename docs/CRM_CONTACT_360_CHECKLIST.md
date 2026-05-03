# Contact 360 — implementation checklist

Track **account + related contacts + full commercial and engagement story** on the CRM contact detail page. Aligned with `docs/CRM_PROSPECT_CONTACT_DEAL_ENHANCEMENTS.md` and PayAid `Contact` relations in `prisma/schema.prisma`.

**Core implementation:** `lib/crm/build-contact-360.ts` (aggregations) · `GET /api/contacts/[id]?include360=1` · `components/crm/contact/ContactInfoTimelineCard.tsx` + `Contact360RollupSections.tsx`.

---

## Product bar (“best in market”)

A top-tier Contact 360 answers in one place:

1. **Who** is this person, **which account**, and **who else** matters there?  
2. **What is the money story** — pipeline, quotes, orders, invoices, renewals (INR-first)?  
3. **What happened** — one timeline of touchpoints (tasks, calls, email, WhatsApp, meetings, forms)?  
4. **What next** — next step, risk, owner, and AI grounded in **this tenant’s data only** (per layout blueprint).

---

## API — `contact360` payload (include360)

| Status | Item |
|--------|------|
| Done | Include **`Account`** + **`parentAccount`** on `GET /api/contacts/[id]` (`parentAccountId`, parent name/id). |
| Done | `include360=1` / `include360=true` + existing `tenantId` resolution. |
| Done | **Peers:** same `accountId` (cap 100), else same **`company`** (**case-insensitive**, PostgreSQL), else solo. |
| Done | **`peerContactIds`** on `contact360` — full peer set for Deals list deep-links. |
| Done | **Rollups (cap 25 each unless noted):** `relatedContacts`, `accountDeals` (+ won/lost/competitor), `accountOrders`, `accountQuotes`, `proposals`, `contracts`, `invoices`, `creditNotes`, `debitNotes`, `projects`, `workOrders`, `formSubmissions`, `surveyResponses`, `nurtureEnrollments`, `loyaltyRows`, `realEstateAdvances`. |
| Done | **Activity feed:** merge interactions, CRM tasks, appointments, email, WhatsApp, scheduled email, SMS (merged cap 28). |
| Done | **`customerInsight`**, **`duplicateSuggestions`**. |

---

## API — Deals list (Contact 360 integration)

| Status | Item |
|--------|------|
| Done | **`GET /api/deals`** supports **`accountId`** — deals whose linked **`contact.accountId`** matches (tenant-scoped). |
| Done | **`contactIds`** — comma-separated contact IDs (max 100, validated id shape); overrides single `contactId` when present. |
| Done | **Cache key** includes `contactIds` / `accountId` segment so filtered lists cache correctly. |

---

## API — Merge duplicates & proposals

| Status | Item |
|--------|------|
| Done | **`POST /api/contacts/duplicates`** — body `{ primaryContactId, duplicateContactId, bypassDuplicateSuggestionGuard? }`. |
| Done | **Merge guard** (`lib/crm/contact-merge-guard.ts`): unless **`bypassDuplicateSuggestionGuard: true`**, duplicate must share primary’s **email, phone, or GSTIN** (trimmed), matching **`duplicateSuggestions`** rules. |
| Done | **`DuplicateDetectorService.mergeContacts`** — transaction, full FK moves, loyalty merge, etc. |
| Done | **WhatsApp conflict:** if primary already has a thread for the same account, **messages are moved** to the primary conversation (`whatsappMessage.updateMany`), **unread** and **lastMessageAt** merged, duplicate empty conversation removed; response **`notices`** describe the merge (or empty-thread removal). **`warnings`** reserved for other post-merge alerts. |
| Done | **`GET /api/proposals/[id]`** — tenant-scoped proposal with **`lineItems`** (ordered), contact/deal, counts. |

---

## UI — contact detail

| Status | Item |
|--------|------|
| Done | Profile, GSTIN, completeness, health strip, linked account + parent, rollups, INR, test ids. |
| Done | **View in Deals** (`crm-contact-360-view-deals`): `?accountId=&from=contact360` when contact has account; else `?contactIds=<peerContactIds>&from=contact360`; else `?contactId=`. |
| Done | **Activity:** header **Open CRM inbox**; per-row **Inbox** for `email`, `whatsapp`, `sms`, `scheduled_email` (`crm-contact-360-activity-inbox-*`). |
| Done | **Possible duplicates:** merge UI; **`crm-contact-360-merge-notices`** / **`crm-contact-360-merge-warnings`** after merge (hooks run before `c360` null guard). |
| Done | **Proposals** rows link to **`/crm/[tenantId]/Proposals/[id]`**. |
| Done | **Staff notes** — `internalNotes` (**`crm-contact-staff-notes`**); **Edit contact** includes staff notes. |

---

## UI — Deals page

| Status | Item |
|--------|------|
| Done | Reads **`contactId`**, **`contactIds`**, **`accountId`**, **`from=contact360`** from query; passes to **`useDeals`**. |
| Done | **Banner** when `from=contact360` + a filter (`deals-contact-360-filter-banner`) + **Clear filter** → plain Deals list. |

---

## UI — CRM proposal detail

| Status | Item |
|--------|------|
| Done | **`/crm/[tenantId]/Proposals/[id]`** (`crm-proposal-detail`) — **Amounts** (subtotal, tax, discount, total, **`formatINRForDisplay`**), **timeline** (valid until, sent/viewed/accepted/rejected/converted), **public token copy** when enabled, **converted invoice** link, **line items** table (`crm-proposal-detail-line-items`), **plain-text content preview** from stored JSON/HTML. |

---

## Account detail & Page AI & E2E

| Status | Item |
|--------|------|
| Done | `/crm/[tenantId]/Accounts/[id]`, page AI `pageExtra`, CRM audit 360 probe + `tests/e2e/contact-360.spec.ts`. |

---

## Schema / ops

| Status | Item |
|--------|------|
| Done | **`Contact.internalNotes`** — migration `prisma/migrations/20260410120000_contact_internal_notes/migration.sql`. Run **`prisma migrate deploy`** (or `db push`) in each environment. |

---

## Still open / next iterations

| Priority | Status | Item |
|----------|--------|------|
| P5 | Todo | **Proposal public URL** — document or generate full customer-facing link once the public host/path is stable (token copy exists on CRM detail). |
| P5 | Todo | **Proposal versions / full rich render** — optional server-rendered HTML view for `content` when product needs WYSIWYG parity. |

---

## Quick verification

1. Contact with **account** → **View in Deals** opens Deals with **account** filter + banner.  
2. **Merge** duplicate → WhatsApp messages **consolidate** into primary thread when both share a WA account; **`notices`** in UI.  
3. **Proposal** detail shows **line items**, **timeline**, **amounts**, **content preview**, **copy token** (if public view on).  
4. **Staff notes** do not appear in **ContactTimeline** (`notes` only).

---

*Last updated: WhatsApp message merge on contact merge, proposal detail enrichment, merge notices UI + hooks fix, checklist sync.*

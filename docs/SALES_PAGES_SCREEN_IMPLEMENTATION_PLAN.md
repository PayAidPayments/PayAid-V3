# Sales Pages Screen Implementation Plan (Execution-Ready)

**Scope:** Turn Sales Pages into a conversion-first PayAid-native module using the canonical architecture approved in `docs/SALES_PAGES_MODULE_FOUNDATION_RECOMMENDATION.md`.

---

## Delivery phases

## Phase 1 - Foundation and bridge hardening
- [ ] Introduce canonical API namespace: `/api/sales-pages/*` and `/api/sales-submissions`.
- [ ] Keep bridge mode on `LandingPage` until canonical migrations are merged.
- [ ] Add publish/unpublish endpoints with status/event contract.
- [ ] Add submission ingest endpoint and event placeholders.

## Phase 2 - Canonical schema + migration
- [ ] Merge draft models from `prisma/proposals/sales-pages-canonical-schema.prisma`.
- [ ] Create migration with compatibility backfill from `LandingPage`/`CheckoutPage`.
- [ ] Add data-access layer for `sales_*` entities.

## Phase 3 - Core UX MVP
- [ ] Sales Pages Home
- [ ] Template Gallery
- [ ] Setup Wizard
- [ ] Visual Builder (core blocks only)
- [ ] Form Builder
- [ ] CRM Mapping
- [ ] Publish Settings
- [ ] Submissions View
- [ ] Basic Analytics

## Phase 4 - Automation and voice
- [ ] Automation Mapping recipes
- [ ] Owner assignment + SLA rules
- [ ] Optional Voice Agent trigger path
- [ ] Retry and failure diagnostics

---

## Screen-by-screen build tickets

## 1. Sales Pages Home
**Goal:** manage all pages quickly.

**Back-end**
- [ ] `GET /api/sales-pages` supports filters: `status`, `type`, `owner`, `campaign`, pagination.
- [ ] Include metrics summary fields per page.

**Front-end**
- [ ] table/cards with status, path, submissions, conversion rate, owner.
- [ ] actions: create, duplicate, preview, publish, unpublish, archive.

## 2. Template Gallery
**Goal:** speed page creation.

**Back-end**
- [ ] `GET /api/sales-pages/templates` with filters `category`, `industry`, `goal`.

**Front-end**
- [ ] grid cards with preview, goal tags, included blocks.
- [ ] CTA: "Use template".

## 3. Setup Wizard
**Goal:** capture conversion intent before editing.

**Fields**
- [ ] name, type, goal, campaign, default CRM target, default owner routing, domain/path, thank-you behavior.

**Back-end**
- [ ] `POST /api/sales-pages` consumes wizard payload and initializes draft version.

## 4. Visual Builder
**Goal:** build responsive pages quickly.

**Blocks (MVP)**
- [ ] hero, benefits, testimonials, pricing, form, CTA, FAQ, booking, checkout CTA, WhatsApp.

**Tech**
- [ ] section/block schema persisted via version snapshots.
- [ ] autosave + undo/redo + desktop/mobile preview.

## 5. Form Builder
**Goal:** conversion-ready data capture.

**Features**
- [ ] hidden UTM/source fields.
- [ ] required/validation/conditional fields.
- [ ] duplicate rule selection.

**Back-end**
- [ ] `sales_form` and `sales_form_field` CRUD.

## 6. CRM Mapping
**Goal:** deterministic submit-to-CRM flow.

**Back-end**
- [ ] mapping config per form.
- [ ] dedupe policy by phone/email/record precedence.
- [ ] owner assignment policy hooks.

**QA checks**
- [ ] submit creates/updates expected CRM entity.
- [ ] source/page metadata attached.

## 7. Automation Mapping
**Goal:** no manual dead-end after conversion.

**Triggers**
- [ ] submit, CTA click, booking created, payment intent created, proposal accepted, whatsapp clicked.

**Actions**
- [ ] assign owner, create task, add tag, update score, send message, start voice call.

## 8. Publish Settings
**Goal:** safe publishing.

**Rules**
- [ ] primary CTA required.
- [ ] mobile preview pass required.
- [ ] identity field mapping required for lead-gen forms.

**Back-end**
- [ ] `POST /api/sales-pages/:id/publish`
- [ ] `POST /api/sales-pages/:id/unpublish`

## 9. Submissions View
**Goal:** monitor operational outcomes.

**Columns**
- [ ] submitted at, page, contact fields, attribution, crm sync status, owner, automation state, voice state.

**Actions**
- [ ] retry CRM sync, manual assign, export.

## 10. Analytics
**Goal:** conversion and source clarity.

**Metrics**
- [ ] visits, unique visits, form starts, submissions, conversion rate, CTA clicks, booking rate, source breakdown.

---

## API contracts (MVP)

- `GET /api/sales-pages`
- `POST /api/sales-pages`
- `GET /api/sales-pages/:id`
- `PATCH /api/sales-pages/:id`
- `POST /api/sales-pages/:id/publish`
- `POST /api/sales-pages/:id/unpublish`
- `POST /api/sales-submissions`

---

## Release gates

- [ ] No-404 checks for all Sales Pages routes/screens.
- [ ] submission-to-CRM integration smoke (happy + duplicate + failure paths).
- [ ] automation trigger verification logs.
- [ ] role-permission checks by Admin/Marketing/Sales Manager/Sales Rep.
- [ ] publish validation checks.
- [ ] mobile view sanity across builder + runtime page.

---

## Notes

- Bridge mode endpoints are already introduced for incremental migration.
- Do not remove existing `Landing-Pages` UI until canonical screens reach parity and data migration is complete.

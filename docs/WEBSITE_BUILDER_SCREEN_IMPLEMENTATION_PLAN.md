# Website Builder Screen Implementation Plan (Execution-Ready)

**Scope:** Build the PayAid Website Builder module as a business-profile-driven visual website system using the canonical architecture in `docs/AI_WEBSITE_BUILDER_FOUNDATION_AND_MODULE_SPEC.md`.

---

## Delivery phases

## Phase 1 - Foundation and bridge APIs
- [ ] Introduce canonical API namespace: `/api/website/sites/*`, `/api/website/submissions`, `/api/website/ai/*`.
- [ ] Keep bridge mode on `LandingPage` until canonical `website_*` models are merged.
- [ ] Add publish/unpublish lifecycle endpoints with event contract.
- [ ] Add AI draft generation scaffold with structured request payload.

## Phase 2 - Canonical schema + migration
- [ ] Merge models from `prisma/proposals/website-builder-canonical-schema.prisma`.
- [ ] Create migration and bridge backfill from `LandingPage` where required.
- [ ] Add data-access layer for `website_*` entities.

## Phase 3 - Core UX MVP
- [ ] Website Builder Home
- [ ] AI Setup Wizard
- [ ] AI Draft Review
- [ ] Visual Builder
- [ ] Page Manager
- [ ] Brand Kit Panel
- [ ] Forms and Actions Panel
- [ ] SEO and Page Settings
- [ ] Publish Settings
- [ ] Submissions View
- [ ] Analytics baseline

## Phase 4 - Integration hardening
- [ ] CRM sync + dedupe + owner assignment policies.
- [ ] Automation trigger mappings and retries.
- [ ] WhatsApp/call/booking CTA event paths.
- [ ] Domain verification + SSL diagnostics.

---

## Screen-by-screen build tickets

## 1. Website Builder Home
**Goal:** central site management.

**Back-end**
- [ ] `GET /api/website/sites` supports filters: `status`, `goalType`, pagination.
- [ ] Include operational summary fields: pages, submissions, conversion trend.

**Front-end**
- [ ] cards/table with site status, domain, pages, submissions, last updated.
- [ ] actions: create, duplicate, preview, publish, unpublish, archive.

## 2. AI Setup Wizard
**Goal:** collect structured context before generation.

**Fields**
- [ ] business profile, industry, city, services, audience, primary goal, page set, tone, colors, logo, contact channels.

**Back-end**
- [ ] `POST /api/website/ai/generate-draft` consumes structured payload.

## 3. AI Draft Review
**Goal:** validate AI plan before editing.

**Features**
- [ ] sitemap preview, page section plan, CTA strategy, SEO suggestions.
- [ ] actions: regenerate full draft, regenerate page, continue to builder.

## 4. Visual Builder
**Goal:** visual editing with reusable blocks.

**MVP blocks**
- [ ] hero, services, benefits, testimonials, pricing, faq, form, CTA, map, WhatsApp, call, booking.

**Tech**
- [ ] autosave, undo/redo, device preview, section reorder.
- [ ] page-version snapshots through `website_page_version`.

## 5. Page Manager
**Goal:** manage navigation and page tree.

**Features**
- [ ] add/reorder/duplicate pages.
- [ ] set homepage and nav visibility.
- [ ] draft/publish status per page.

## 6. Brand Kit Panel
**Goal:** brand consistency across sites.

**Features**
- [ ] apply logo/colors/fonts/button style/tone.
- [ ] sync with existing brand-kit/logo sources.

## 7. Forms and Actions Panel
**Goal:** conversion and lead capture.

**Features**
- [ ] form builder with validation and hidden attribution fields.
- [ ] action mappings: CRM create/update, assignment, workflow trigger.
- [ ] CTA mappings: WhatsApp, phone, booking, payment.

## 8. SEO and Page Settings
**Goal:** indexing and sharing controls.

**Fields**
- [ ] slug, title, meta description, social image, indexing toggle, canonical.

## 9. Publish Settings
**Goal:** safe launch flows.

**Rules**
- [ ] homepage exists.
- [ ] at least one contact method configured.
- [ ] forms mapped to actions where forms exist.
- [ ] mobile preview pass.

**Back-end**
- [ ] `POST /api/website/sites/:id/publish`
- [ ] `POST /api/website/sites/:id/unpublish`

## 10. Submissions View
**Goal:** conversion operations visibility.

**Columns**
- [ ] submitted at, site/page/form, key fields, attribution, crm sync status, owner, automation status.

**Actions**
- [ ] retry CRM sync, assign owner, export.

## 11. Website Analytics
**Goal:** conversion performance clarity.

**Metrics**
- [ ] visits, page views, form starts, submissions, CTA clicks, WhatsApp clicks, booking starts, conversion rate, source breakdown.

---

## API contracts (MVP scaffold)

- `GET /api/website/sites`
- `POST /api/website/sites`
- `GET /api/website/sites/:id`
- `PATCH /api/website/sites/:id`
- `POST /api/website/sites/:id/publish`
- `POST /api/website/sites/:id/unpublish`
- `POST /api/website/submissions`
- `POST /api/website/ai/generate-draft`

---

## Release gates

- [ ] No-404 checks for Website Builder routes/screens.
- [ ] Submission-to-CRM integration smoke (happy + duplicate + failure paths).
- [ ] Automation trigger verification logs.
- [ ] Role-permission checks by Admin/Marketing Manager/Sales Manager/Sales Rep.
- [ ] Publish validation checks and fallback behavior.
- [ ] Mobile view sanity across editor + runtime page.

---

## Notes

- Bridge APIs are intentionally compatible with existing persistence to reduce migration risk.
- Keep bridge mode active until canonical `website_*` migration, backfill, and parity validation are complete.

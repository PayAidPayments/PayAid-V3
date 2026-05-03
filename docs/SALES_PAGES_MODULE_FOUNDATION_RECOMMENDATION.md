# PayAid V3 Sales Pages Module - Foundation Recommendation

**Date:** 2026-04-24  
**Decision style:** Same framework used for Logo Generator (ownable, low-cost, stack-fit, integration-first)

---

## 1) Current-state audit (PayAid today)

PayAid already has a basic Sales Pages implementation, but it is a v0 CRUD layer, not yet a conversion operating system.

### What exists
- Sales module taxonomy and entitlement include `sales` as "Sales Pages".
- Sales routes exist for `Landing-Pages`, `Checkout-Pages`, and `Orders`.
- API routes exist for landing pages (`/api/landing-pages`, `/api/sales/landing-pages` wrapper).
- Prisma models exist for `LandingPage` and `CheckoutPage`.
- Basic fields exist for status, slug, SEO fields, and simple metrics (`views`, `conversions`, `conversionRate`).

### Gaps vs required direction
- No first-class form model (`sales_form`, `sales_form_field`) and no submission pipeline.
- No attribution model (UTM/source/referrer persistence per submission/session).
- No CRM mapping and dedupe flow on submit.
- No automation trigger/action layer tied to page events.
- No page versioning model (draft/history/publish snapshots).
- No block/template model suitable for reusable section system.
- No voice-agent trigger pipeline from submissions.
- Wrapper API currently forwards to `NEXT_PUBLIC_APP_URL` and introduces avoidable runtime/network coupling.

### Verdict on current state
- **Do not discard.**
- **Keep and evolve** into a PayAid-native conversion module.
- Existing `LandingPage`/`CheckoutPage` can be migration bridges into a canonical `sales_*` data model.

---

## 2) OSS options comparison

| Rank | Option | Keep / Skip | Fit for PayAid |
|---|---|---|---|
| 1 | `LiveDuo/destack` | **Keep** | Best architectural fit for self-hosted, Next.js-friendly page builder primitives and reusable sections. |
| 2 | `Jauharmuhammed/landing-page-builder` | **Maybe** | Good editor + preview + page management references; likely not drop-in due to auth/storage assumptions. |
| 3 | Instant Land | **Maybe** | Useful product references for campaigns/lead tracking behavior and funnel-style flows. |
| 4 | `aialvi/openfunnels` | **Maybe** | Useful funnel mental model and UX concepts; likely reference-level, not direct embed. |
| 5 | `givanz/VvvebJs` | **Maybe (low-level)** | Can inspire builder engine patterns, but too generic and lower-level for direct use as core foundation. |
| 6 | Template-only starters | **Skip as foundation** | Good for marketing sites; weak for in-app CRM-connected conversion workflows. |

---

## 3) Best repo choice

**Recommended foundation:** Destack-style architecture as primary reference/foundation candidate.

**Final product strategy:**  
Build Sales Pages as a **PayAid-native module** with deep CRM/automation/voice/appointments/finance integration.  
Do not ship a detached external mini-app.

Decision: **Build hybrid (recommended)**  
- Adapt builder/runtime ideas from Destack.
- Keep PayAid’s own module boundaries, auth, tenancy, event model, and CRM data ownership.

---

## 4) Best architecture choice

### Layer A - Builder layer
- Visual editor with block library and reusable sections.
- Template system by goal/type/industry.
- Form builder with hidden fields and CRM mapping preview.
- Versioning and autosave.

### Layer B - Runtime/publishing layer
- Publish/unpublish workflow with validation gates.
- Tenant domain/subdomain/path mapping.
- SEO and OG metadata.
- Fast-render strategy (SSG/ISR/edge rendering where possible).

### Layer C - Conversion/data layer
- Capture all actions (submit, CTA, booking, WhatsApp, payment intent, proposal accept).
- Normalize payload and dedupe against CRM.
- Persist attribution and session metadata.
- Emit canonical events for automation and analytics.

### Layer D - AI assist layer
- AI-assisted copy/headlines/CTA/form suggestions.
- Industry-specific page composition suggestions.
- Optional design recommendations (colors/images/structure).

---

## 5) Proposed canonical entities (MVP schema target)

- `sales_page`
- `sales_page_version`
- `sales_page_template`
- `sales_page_block`
- `sales_form`
- `sales_form_field`
- `sales_submission`
- `sales_page_event`
- `sales_page_attribution`
- `sales_page_goal`

Note: Existing `LandingPage` and `CheckoutPage` can be mapped/migrated into this schema to preserve continuity.

---

## 6) API/event model and CRM sync rules

### Key internal events
- `sales_page.created`
- `sales_page.updated`
- `sales_page.published`
- `sales_page.unpublished`
- `sales_submission.received`
- `sales_submission.normalized`
- `sales_submission.crm_synced`
- `sales_submission.assigned`
- `sales_submission.qualified`
- `sales_submission.voice_triggered`
- `sales_submission.booking_created`
- `sales_submission.payment_intent_created`

### CRM sync baseline
1. Capture page + attribution context.
2. Normalize/validate payload.
3. Dedupe by phone/email and tenant policy.
4. Create/update lead/contact/account/deal based on mapping.
5. Attach source/UTM/page/CTA metadata.
6. Assign owner and update score.
7. Trigger automation recipes and notifications.

---

## 7) Integration mapping across modules

- **CRM:** lead/contact/deal/account creation/update, owner assignment, timeline activity.
- **Marketing:** campaign/source attribution, channel-level conversion analytics.
- **Appointments:** booking CTA to appointment creation and owner scheduling.
- **Finance / Checkout:** payment CTA intent and order/deal linkage.
- **Automation:** trigger/action orchestration on page and submission lifecycle.
- **Voice Agents:** optional immediate call workflow when phone + consent + policy checks pass.

---

## 8) Implementation risks

1. **Data model drift risk** - Extending ad-hoc `LandingPage` JSON without canonical entities will create long-term coupling.
2. **API coupling risk** - Current wrapper pattern (`/api/sales/landing-pages` -> `/api/landing-pages`) plus base URL indirection can cause latency/env mismatch issues.
3. **Event consistency risk** - Without durable event contracts, CRM/automation/analytics can diverge.
4. **Publish safety risk** - Lack of publish-time validation can produce broken public pages and poor conversion quality.
5. **Permission boundary risk** - Non-canonical role checks can expose cross-team config controls unintentionally.
6. **Migration risk** - Existing landing/checkout pages need compatibility adapters during schema transition.

---

## 9) Phased rollout plan

### Phase 0 - Stabilize current implementation
- Normalize Sales API routes and remove unnecessary forwarding.
- Add telemetry + error visibility for current landing/checkout CRUD.
- Freeze/define publish contract and statuses.

### Phase 1 - Canonical data model + migration bridge
- Introduce `sales_*` canonical tables.
- Add read/write adapters from existing `LandingPage`/`CheckoutPage`.
- Backfill existing records.

### Phase 2 - MVP builder + forms + submissions
- Template gallery, setup wizard, visual builder (core blocks), form builder.
- Submission ingestion + normalization + attribution capture.
- CRM mapping and sync pipeline.

### Phase 3 - Conversion orchestration
- Automation mapping screen + recipe library.
- Owner assignment/SLA rules + notification channels.
- Submissions inbox and retry workflows.

### Phase 4 - Publish + analytics + hardening
- Publish validation gates and domain settings.
- Page/submission analytics baseline.
- Role/permission hardening and audit logging.

### Phase 5 - v2 growth features
- A/B variants, personalization, multi-step funnels, deeper payment flows.

---

## 10) QA checklist (MVP acceptance)

- Can create page from template and publish/unpublish safely.
- Public page loads fast and mobile-friendly.
- Form submission persists payload + attribution.
- CRM record is created/updated with dedupe and field map applied.
- Owner assignment + automation triggers execute successfully.
- Notification dispatch succeeds and is traceable.
- Optional voice trigger works under policy checks.
- Analytics reflect visits/submissions/conversion metrics.
- Role-based access controls prevent unauthorized configuration changes.

---

## Final recommendation

For PayAid V3 Sales Pages, the strongest path is:

**Adopt Destack-style builder/runtime architecture, but implement as a PayAid-native conversion module with canonical `sales_*` entities and deep CRM + automation integration.**

This preserves speed-to-build while maximizing long-term product leverage.

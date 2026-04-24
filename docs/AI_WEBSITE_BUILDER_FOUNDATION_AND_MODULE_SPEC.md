# PayAid V3 - AI Website Builder Foundation and Module Spec

**Owner:** Product + Platform  
**Audience:** Engineering + UX + QA  
**Last updated:** 2026-04-24  
**Purpose:** Define the recommended OSS foundation, architecture, and phased implementation plan for a self-hosted, visual, AI-assisted Website Builder module inside PayAid V3.

---

## 1) Decision summary

For PayAid V3, do **not** use a pure prompt-to-site repository as the product core.

Use:

- A **visual builder foundation** (primary: `Craft.js` or `GrapesJS`)
- A **PayAid-native AI assistance layer** on top
- Native **CRM/forms/leads/automation** integration from day one

Core principle:

- AI should generate the first draft and accelerate edits
- The business user must keep full visual control through a structured editor

---

## 2) Decision criteria

Any foundation selected for this module must satisfy:

- Self-hostable / ownable deployment model
- Low recurring vendor dependency for core editing workflow
- Fast editor runtime and acceptable performance under tenant load
- Strong visual editing and reusable block capabilities
- Structured output compatible with PayAid publish and analytics pipelines
- Tight integration potential with CRM, forms, WhatsApp, Voice, Sales Pages
- Multi-tenant fit for SaaS isolation and governance

---

## 3) Repository/options shortlist

| Rank | Option | Keep / Skip | Best use in PayAid | Decision notes |
|---|---|---|---|---|
| 1 | `GrapesJS` | Keep | Fast path visual builder engine | Mature drag-and-drop core, plugin ecosystem, strong self-host fit; best as engine layer. |
| 2 | `Craft.js` | Keep | React-native custom editor foundation | Best long-term fit for PayAid-native UX and component-level control in React/Next.js. |
| 3 | `Framely` | Keep | Multi-tenant builder reference | Useful architecture reference for tenant-aware editor patterns. |
| 4 | `Destack` | Keep/Maybe | Landing/content builder reference | Strong for page-builder concepts; useful as architecture inspiration. |
| 5 | `Ratna-Babu/Ai-Website-Builder` | Maybe | AI generation workflow reference | Useful AI prompting/generation ideas; not ideal as production core dependency. |
| 6 | `menuRivera/ai-website-builder` | Maybe | Prompt generation reference | Good conceptual input, limited as stable SaaS foundation. |
| 7 | `VvvebJs` | Maybe | Alternative builder engine benchmark | Self-hostable but less natural fit for React-native module ownership. |
| 8 | `Webstudio` | Study | Product benchmark | Good benchmark for UX/performance direction, less ideal as embedded core. |

---

## 4) Best foundation choice

### Preferred long-term path

- **`Craft.js` + PayAid AI layer**
- Why: best control of in-app UX, component contracts, schema ownership, and React-native integration.

### Faster implementation path

- **`GrapesJS` + PayAid AI layer**
- Why: faster time-to-first-builder with mature drag/drop primitives and plugin support.

### Explicit anti-pattern

- Do not adopt prompt-only AI website repos as the main production foundation.
- Treat those repos as idea/reference inputs for AI assistants, not as system core.

---

## 5) Current-state audit (PayAid alignment)

- PayAid already has strong module infrastructure for CRM, Sales Pages, Marketing, Integrations, and Admin governance.
- Website Builder should be introduced as another tenant-aware module, not as an isolated side app.
- Existing strengths to reuse:
  - Auth + tenant scoping
  - Module navigation and permissions model
  - CRM lead lifecycle and automation triggers
  - Brand and sales page workflows
- Current gap:
  - No single business-profile-driven visual website workflow connected end-to-end to CRM capture and publish lifecycle.

---

## 6) Target architecture

### 6.1 Layer model

1. **Builder Core Layer**
   - `Craft.js` (preferred) or `GrapesJS` (faster route)
   - Handles drag/drop, block tree, responsive previews, reusable sections

2. **PayAid Domain Layer**
   - Site/page/version/block schemas
   - Publishing, domains, SEO metadata
   - Tenant ownership and RBAC enforcement

3. **AI Assistance Layer**
   - Structured generation from business profile + goals + brand kit
   - In-editor rewrite/suggest actions
   - Section/page-level draft regeneration

4. **Business Integration Layer**
   - Form-to-CRM mapping and submission ingestion
   - Automation routing (assignment, score, notifications, workflows)
   - WhatsApp/call/booking/payment CTA event tracking

### 6.2 AI behavior model

- Input must be structured (industry, services, location, goals, CTA, tone, brand, contact channels), not just free-text prompts.
- Output must be structured and editable:
  - sitemap proposal
  - page drafts
  - block plans
  - SEO title/meta suggestions
  - form/CTA suggestions

---

## 7) Module screens (implementation baseline)

1. Website Builder Home  
2. AI Setup Wizard  
3. AI Draft Review  
4. Visual Builder  
5. Page Manager  
6. Brand Kit Panel  
7. Forms and Actions Panel  
8. SEO and Page Settings  
9. Publish Settings  
10. Leads/Submissions View  
11. Website Analytics

---

## 8) Canonical data model proposal

### Core entities

- `website_site`
- `website_page`
- `website_page_version`
- `website_block`
- `website_brand_kit`
- `website_form`
- `website_form_field`
- `website_submission`
- `website_event`
- `website_domain`

### Design constraints

- Every table tenant-scoped (`tenant_id`) where applicable
- Strong versioning for publish-safe rollbacks (`website_page_version`)
- Block schema payloads stored in JSON with typed app-side contracts
- Submission payload normalized for CRM mapping and attribution

---

## 9) API and event model (v1)

### 9.1 API groups

- `/api/website/sites/*` (list/create/update/archive)
- `/api/website/pages/*` (CRUD/order/homepage/nav visibility)
- `/api/website/versions/*` (save version/publish snapshot/restore)
- `/api/website/ai/*` (generate draft/rewrite section/SEO suggestions)
- `/api/website/forms/*` (create/map/validate actions)
- `/api/website/submissions/*` (ingest/list/status)
- `/api/website/domains/*` (subdomain/custom domain/verify)
- `/api/website/analytics/*` (traffic/conversion/event summaries)

### 9.2 Event contract examples

- `website.form.submitted`
- `website.cta.clicked`
- `website.whatsapp.clicked`
- `website.booking.requested`
- `website.page.published`

Event payloads should include:

- `tenantId`, `siteId`, `pageId`, `eventType`, `occurredAt`, `attribution`

---

## 10) CRM sync rules

On form submission:

1. Normalize payload and required contact keys
2. Attach attribution (`utm`, referrer, page/site source)
3. Deduplicate by email/phone strategy
4. Create/update lead/contact/account records
5. Assign owner and score intent
6. Log activity timeline event
7. Trigger configured automation workflows

Minimum field mapping coverage:

- name, phone, email, business name, city, message, interest, callback time
- source fields (`page_url`, `site_name`, `utm_*`)

---

## 11) Automation behavior

Support workflow triggers such as:

- new lead from website form
- quote/callback request
- WhatsApp CTA click
- booking flow start/submit
- high-intent conversion page submit

Config should remain in existing automation/routing surfaces; Website Builder only emits reliable normalized events and action payloads.

---

## 12) Publishing and domain model

Before publish, enforce:

- site name present
- homepage exists
- at least one contact path
- form actions mapped (if forms exist)
- SEO title/meta for homepage
- valid subdomain/custom-domain state
- mobile preview pass

Domain support:

- PayAid subdomain (MVP)
- Custom domain + verification + SSL status (MVP/basic)

---

## 13) Implementation risks and mitigations

1. **Schema drift between builder output and runtime renderer**  
   Mitigation: typed block contract registry + migration adapters.

2. **Editor performance degradation on large pages**  
   Mitigation: block virtualization, lazy-loaded side panels, autosave batching.

3. **AI output quality inconsistency**  
   Mitigation: structured prompts + deterministic templates + post-generation validation.

4. **CRM sync duplication/noise**  
   Mitigation: duplicate rules, idempotent submission keys, retry-safe ingestion.

5. **Tenant isolation/security gaps**  
   Mitigation: strict tenant filters on all website entities and events, RBAC checks on every write route.

---

## 14) Phased rollout plan

### Phase 0 - Foundation selection and spike (1-2 weeks)

- Finalize `Craft.js` vs `GrapesJS` decision
- Build one-page prototype with save/load block schema
- Validate rendering, responsiveness, and tenant-scoped persistence

### Phase 1 - MVP core (3-5 weeks)

- Website Home, Setup Wizard, Draft generation, Visual Builder, Page Manager
- Core entities and versioning
- Basic publish to PayAid subdomain

### Phase 2 - Conversion + integration (2-4 weeks)

- Forms and Actions panel
- CRM sync + attribution
- Automation events and basic analytics
- WhatsApp/call/booking CTA blocks

### Phase 3 - Operational hardening (2-3 weeks)

- Domain verification/SSL hardening
- Error/retry visibility, audit trails
- QA matrix and role-based permissions validation

### Phase 4 - V2 expansions (post-MVP)

- CMS/blog patterns
- multilingual support
- A/B testing and advanced SEO
- collaborative editing and template marketplace

---

## 15) MVP acceptance checklist

MVP is accepted only if a tenant can:

- Generate a website draft from business profile inputs
- Edit pages visually with reusable sections/blocks
- Configure forms and map to CRM
- Publish to PayAid subdomain (and basic custom domain path)
- Capture submissions and trigger automation
- Track baseline visits/submissions/conversions

---

## 16) Recommendation

Recommended product path for PayAid V3:

- Build on **`Craft.js`** when prioritizing long-term native control and module cohesion
- Build on **`GrapesJS`** when prioritizing speed-to-market for editor capabilities
- In both cases, keep AI as an assistive layer and keep business-profile + CRM-integrated workflows as the core differentiator

This gives PayAid a practical SMB growth module (site + lead capture + follow-up) rather than a prompt-demo generator.

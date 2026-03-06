# PayAid V3 — CRM Complete Feature Checklist Audit

**Scope:** `app/crm`, `lib/crm`, `app/api/crm`, `app/api/contacts`, `app/api/deals`, `app/api/tasks`, `app/api/leads`, `app/api/interactions`, related components and shared modules.

**Legend:**
- **✅** Implemented & Working (with file paths)
- **⚠️** Implemented but incomplete or broken (with file path and notes)
- **❌** Not implemented (no code found)

---

## 1. Data Model & Records

### 1.1 Contacts

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Create contact (manual form) | ✅ | `app/crm/[tenantId]/Contacts/New/page.tsx`, `app/api/crm/contacts/route.ts` → `modules/shared/crm/api/contacts.ts` (POST) |
| 2 | Edit contact | ✅ | `app/crm/[tenantId]/Contacts/[id]/Edit/page.tsx`, `app/api/crm/contacts/[id]/route.ts` (PATCH) |
| 3 | Delete / archive contact | ✅ | `app/api/crm/contacts/[id]/route.ts` (DELETE → soft archive `status: 'archived'`); `app/crm/[tenantId]/Contacts/[id]/page.tsx` (handleDelete) |
| 4 | Contact detail page (360° view) | ✅ | `app/crm/[tenantId]/Contacts/[id]/page.tsx`, `components/crm/layout/ContactDetailLayout.tsx`, `ContactTimeline`, `QuickActionsCard`, `NextBestActionCard`, `AIFitScoreCard`, `AIAssistCard` — activity, deals, tasks, notes, emails in one place |
| 5 | Custom fields (text, number, date, dropdown, checkbox, URL, phone, email) | ⚠️ | Schema supports `customFields` (JSON) in shared contacts API; field-level config: `app/api/crm/field-layouts/route.ts`, `app/crm/[tenantId]/Settings/Field-Configuration/page.tsx`. No full custom field type UI per object. |
| 6 | Field-level visibility by role | ❌ | No role-based field visibility in CRM; field-layouts are admin-only, not per-role. |
| 7 | Duplicate detection on email / phone on create | ❌ | No duplicate check in `modules/shared/crm/api/contacts.ts` or CRM create flow. |
| 8 | Merge duplicate contacts | ❌ | No merge API or UI. |
| 9 | Contact tags / labels | ✅ | `Contact` has `tags` (String[]); used in filters and shared API. |
| 10 | Contact owner assignment | ✅ | `Contact.assignedToId` (SalesRep); `app/api/crm/contacts/mass-transfer/route.ts`; assignment in UI. |
| 11 | Contact source tracking | ✅ | `Contact.source`, `sourceId`, `LeadSource` relation; seed and lead sources in `prisma/seeds/demo/seed-crm.ts`. |
| 12 | Contact lifecycle stage | ✅ | `Contact.stage` (prospect, contact, customer); `StageBadge`, `StagePromotionButton`; filters by stage. |
| 13 | Contact activity timeline | ✅ | `components/crm/contact/ContactTimeline.tsx` — interactions, deals, tasks, notes; `/api/interactions`, `/api/deals`. |
| 14 | Contact avatar / profile photo | ❌ | No avatar/photo field or UI in Contact model/CRM. |
| 15 | Link contact to Account (Company) | ✅ | `Contact.accountId` → `Account`; `prisma/schema.prisma`; Accounts page and tree. |
| 16 | Link contact to multiple deals | ✅ | `Deal.contactId` → Contact; deal list/detail show contact. |
| 17 | Import contacts via CSV | ⚠️ | `app/api/contacts/import/route.ts` (full CSV/XLSX import); `components/contacts/contact-import-dialog.tsx` used on `app/dashboard/contacts/page.tsx`. CRM Leads page shows "coming soon" for import — not wired in CRM Contacts/Leads UI. |
| 18 | Export contacts to CSV | ✅ | `app/api/crm/contacts/export/route.ts` (CSV/Excel); CRM Contacts page has Download. |
| 19 | Bulk edit contacts | ⚠️ | `app/api/crm/contacts/mass-transfer/route.ts` (reassign owner); `BulkActionsBar` in Contacts page. No generic bulk-edit fields. |
| 20 | Bulk delete / archive | ⚠️ | Bulk actions UI present; mass delete may use single delete or needs confirmation — no dedicated bulk-delete API in `app/api/crm/contacts`. |
| 21 | Contact list view with sortable columns | ✅ | `app/crm/[tenantId]/Contacts/page.tsx`, `ContactList`; table with sort/filter. |
| 22 | Contact Kanban view by lifecycle stage | ❌ | Contacts use list/table; no Contact Kanban by stage. |
| 23 | Search contacts (full text, by field) | ✅ | List API supports `search` param; Contacts page search. |
| 24 | Filter contacts (tag, owner, stage, date, source, custom field) | ✅ | Filters in API and UI; `lib/utils/crm-filters.ts`; status, type, tags, etc. |
| 25 | Save filter as a Segment / View | ✅ | `app/api/crm/saved-filters/route.ts`, `app/api/crm/segments/route.ts`; segments with criteria; saved filters per entity (lead/contact). |

### 1.2 Accounts (Companies)

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Create / edit / delete account | ⚠️ | `app/crm/[tenantId]/Accounts/page.tsx` lists contacts with stage customer / company view; `app/api/accounts/route.ts`. No dedicated Account CRUD in CRM; accounts as contact-centric view. |
| 2 | Account detail page (contacts, deals, invoices, activity) | ⚠️ | `app/crm/[tenantId]/Accounts/[id]/tree/page.tsx` (tree); full account detail with contacts/deals/invoices not confirmed. |
| 3 | Company size, industry, website, GST number, PAN fields (India-specific) | ⚠️ | `Account` model has industry, website, employeeCount, annualRevenue; **no gstin/pan** on Account. Contact has `gstin`. |
| 4 | Account owner assignment | ❌ | Account model has no ownerId in schema. |
| 5 | Account type (prospect, customer, partner, vendor) | ✅ | `Account.type` (customer, partner, competitor, etc.). |
| 6 | Account hierarchy (parent–child) | ✅ | `Account.parentAccountId`, `parentAccount`, `childAccounts`. |
| 7 | Link multiple contacts to one account | ✅ | `Contact.accountId`; multiple contacts per account. |
| 8 | Link deals and invoices to account | ✅ | Deals via contact; Invoice has customer link; account implied via contact. |
| 9 | Account activity timeline | ❌ | No dedicated account timeline component found. |
| 10 | Import / export accounts | ❌ | No account import/export API in CRM. |

### 1.3 Leads / Prospects

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Create lead (manual) | ✅ | `app/crm/[tenantId]/Leads/New/page.tsx` (creates contact with type/stage lead); `useCreateContact`. |
| 2 | Lead capture from web forms (embed code) | ⚠️ | Forms: `app/api/forms`, `FormBuilder`; form submissions can create leads — embed code / form→lead mapping to confirm. |
| 3 | Lead capture from landing pages (Sales module) | ❌ | No dedicated Sales/landing integration found. |
| 4 | Lead auto-assignment rules (round robin, territory, score-based) | ⚠️ | `lib/sales-automation/lead-allocation.ts`; APIs for assignment. CRM UI may not expose full rule config. |
| 5 | Lead source tracking | ✅ | `Contact.source`, `LeadSource`; seed and stats. |
| 6 | Lead scoring (manual + AI) | ✅ | `app/api/crm/leads/[id]/score/route.ts`, `lib/ai/lead-scoring`; `LeadScoreCard`, `LeadScoringBadge`; scoring-weights, train-model APIs. |
| 7 | Lead qualification checklist / BANT | ⚠️ | `lib/crm/lead-qualification.ts`; `app/api/crm/leads/qualify/route.ts`. BANT fields not fully surfaced as checklist in UI. |
| 8 | Convert lead → Contact + Account + Deal | ✅ | `app/api/crm/leads/convert/route.ts` (Account, Contact, optional Deal). |
| 9 | Disqualify lead with reason | ⚠️ | Status/stage and lost reason exist; no dedicated "disqualify with reason" API/UI. |
| 10 | Lead age / time-in-stage tracking | ⚠️ | `createdAt`, `lastContactedAt` exist; no explicit time-in-stage field or report. |
| 11 | Duplicate lead detection | ❌ | Leads page has "Deduplicate Leads" button (UI only); no backend duplicate detection. |
| 12 | Lead list view, Kanban view, filter, sort | ✅ | `app/crm/[tenantId]/Leads/page.tsx`; `LeadsKanban.tsx` (drag-drop by stage); list + filters. |
| 13 | Import / export leads | ⚠️ | Export via contacts export; Leads page says "coming soon" for CSV import. `app/api/leads/import/route.ts` exists in repo (may be legacy). |

### 1.4 Deals / Pipeline

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Create deal (manual + from lead conversion) | ✅ | `app/crm/[tenantId]/Deals/New/page.tsx`, `app/api/crm/deals/route.ts` → deals API; lead convert creates deal. |
| 2 | Deal detail page (value, stage, close date, contacts, account, tasks, notes, files) | ✅ | `app/crm/[tenantId]/Deals/[id]/page.tsx`, `components/crm/deal/DealTimeline.tsx`. |
| 3 | Multiple pipelines (e.g. New Business, Renewal, Partner) | ⚠️ | `app/api/crm/pipelines/route.ts`, `app/api/crm/pipelines/custom/route.ts`; pipeline snapshot. Single default pipeline in UI; custom pipelines in DB. |
| 4 | Customizable pipeline stages per pipeline | ✅ | `app/api/crm/pipelines/custom/route.ts`; `DealPipelineCustomizer.tsx`. |
| 5 | Drag-and-drop Kanban board | ❌ | Deals page is list/table only; no Deal Kanban component. |
| 6 | Deal list view with sortable columns | ✅ | `app/crm/[tenantId]/Deals/page.tsx` (table, sort, filter). |
| 7 | Deal value in INR (and other currencies per tenant) | ✅ | Deal.value; INR used in UI (₹). |
| 8 | Expected close date | ✅ | `Deal.expectedCloseDate`. |
| 9 | Deal probability % (manual + AI suggested) | ✅ | `Deal.probability`; `app/api/crm/deals/[id]/probability/route.ts`; AI deal scoring. |
| 10 | Deal owner assignment | ✅ | `Deal.assignedToId` (SalesRep). |
| 11 | Deal source | ⚠️ | Not on Deal model in schema; may be derived from contact source. |
| 12 | Won / Lost marking with reason | ✅ | `CloseDealModal.tsx`; `Deal.lostReason`, `wonReason`, `competitor`. |
| 13 | Rotting deals (flag no activity after X days) | ✅ | `app/api/crm/deals/rotting/route.ts`, `lib/crm/deal-rot-detector.ts`; `DealRotWidget`. |
| 14 | Deal age tracking | ⚠️ | Via `createdAt`/`updatedAt`; no explicit "deal age" field. |
| 15 | Link products / line items to deal (CPQ) | ⚠️ | Quote/CPQ model exists; CPQ quotes API stub; no full product line items on deal. |
| 16 | Deal-level custom fields | ❌ | No custom fields on Deal in schema. |
| 17 | Bulk update deals | ⚠️ | No dedicated bulk-update API in `app/api/crm/deals`. |
| 18 | Import / export deals | ❌ | No deal import/export API. |

---

## 2. Activities & Communication

### 2.1 Tasks

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Create task (manual, from deal, from contact) | ✅ | `app/crm/[tenantId]/Tasks/new/page.tsx`, `app/api/crm/tasks/route.ts` → `/api/tasks`; from contact/deal in UI. |
| 2 | Task types (Call, Email, Follow-up, Demo, Meeting, Other) | ⚠️ | Single task entity; no separate "type" enum in Task model (title/description used). |
| 3 | Due date + time | ✅ | `Task.dueDate`; `app/api/tasks/route.ts`. |
| 4 | Priority (High / Medium / Low) | ✅ | `Task.priority`; API and UI. |
| 5 | Task owner assignment | ✅ | `Task.assignedToId`. |
| 6 | Recurring tasks | ✅ | `Task.recurrenceRule`, `recurrenceEndDate` in schema; API may not fully support create/update. |
| 7 | Task completion marking | ✅ | `Task.status`, `completedAt`; API PATCH. |
| 8 | Overdue task highlighting | ✅ | Tasks API filters `dueDate < today`; dashboard/Home use overdue. |
| 9 | Task list view (my tasks, all tasks, by deal/contact) | ✅ | `app/crm/[tenantId]/Tasks/page.tsx`, `TasksKanbanView`, `TasksCalendarView`, `TasksFilters`; `app/api/crm/dashboard/tasks-view/route.ts`. |
| 10 | Task reminders (in-app + email) | ✅ | `app/api/tasks/remind/[id]/route.ts`, `sendTaskReminder`; `Task.reminderSentAt`. |
| 11 | Bulk task actions | ⚠️ | No dedicated bulk task API; UI may allow multi-select. |

### 2.2 Meetings

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Schedule meeting (manual) | ✅ | `app/crm/[tenantId]/Meetings/page.tsx`, `app/api/crm/meetings/route.ts`. |
| 2 | Meeting booking link (Calendly-like, built-in) | ❌ | No booking link / shareable calendar slot found. |
| 3 | Meeting types (In-person, Video, Phone) | ⚠️ | Meeting entity exists; type may be in metadata. |
| 4 | Meeting outcome logging | ✅ | Interactions have `outcome`; meeting logged as interaction. |
| 5 | Link meeting to deal / contact / account | ✅ | `Interaction.contactId`; deal link via contact. |
| 6 | Meeting reminders | ⚠️ | Generic task reminders; no meeting-specific reminder flow. |
| 7 | Calendar view (day / week / month) | ✅ | `components/crm/tasks/TasksCalendarView.tsx` (tasks); Meetings page may have calendar. |
| 8 | Google Calendar / Outlook sync | ❌ | No calendar sync integration in CRM. |

### 2.3 Notes

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Add note to contact / deal / lead / account | ✅ | Notes via ContactTimeline (add note → interaction/note); contact `notes` field. |
| 2 | Rich text notes (bold, lists, links) | ⚠️ | Note as text; no rich-text editor confirmed. |
| 3 | Note timestamp and author | ✅ | Interaction/note has `createdAt`; author via `createdByRepId`. |
| 4 | Edit / delete notes | ⚠️ | Interactions editable/deletable; notes as interaction type. |
| 5 | Pin important notes | ❌ | No pin field or UI. |

### 2.4 Calls (Dialer)

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Click-to-call from contact / lead detail | ✅ | QuickActionsCard, NextBestActionCard — call links. |
| 2 | Call logging (manual — duration, outcome, notes) | ✅ | `app/api/crm/dialer/call/route.ts`, `dialer/call/end`; Interaction created. |
| 3 | Auto-log calls made via built-in Dialer | ✅ | Dialer WebRTC + call end creates interaction. |
| 4 | Call recording (if Dialer supports) | ⚠️ | `app/api/crm/calls/recordings/route.ts` exists; recording storage/playback not verified. |
| 5 | Call outcome types (Answered, No Answer, Voicemail, Busy) | ⚠️ | Interaction has `outcome`; fixed set of outcome types not confirmed. |
| 6 | Call activity visible in contact timeline | ✅ | `ContactTimeline` shows interactions (call type). |

### 2.5 Email (within CRM context)

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Send email from contact / deal page | ✅ | `EmailComposeDialog`; QuickActions / outreach panel. |
| 2 | Email templates (saved, reusable) | ✅ | `lib/crm/template-variables.ts`; TemplatePickerModal, TemplateSelector; `app/api/crm/templates/render/route.ts`. |
| 3 | Email open tracking | ❌ | No open-tracking implementation found. |
| 4 | Email click tracking | ❌ | No click-tracking found. |
| 5 | Email thread view in contact timeline | ✅ | ContactTimeline shows email interactions. |
| 6 | BCC-to-CRM (forward email into contact timeline) | ✅ | `lib/email/bcc-auto-logger.ts`, `lib/email-helpers/link-to-crm.ts`; BCC crm@payaid.store logs to contact. |
| 7 | Bulk email to a segment (with unsubscribe) | ⚠️ | Bulk/segment email and unsubscribe compliance not confirmed in CRM. |

### 2.6 WhatsApp (India-critical)

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Send WhatsApp message from contact page | ⚠️ | NextBestActionCard builds WhatsApp link; no in-app send flow. |
| 2 | WhatsApp message templates (pre-approved) | ✅ | `app/api/crm/whatsapp-templates/route.ts` (CRUD). |
| 3 | WhatsApp conversation view in contact timeline | ✅ | ContactTimeline shows whatsapp type. |
| 4 | WhatsApp opt-in / opt-out tracking | ❌ | No opt-in/opt-out tracking in CRM. |

---

## 3. Sales Pipeline & Forecasting

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Pipeline dashboard (total value by stage, conversion rates) | ✅ | Home dashboard, `app/api/crm/deals/pipeline-snapshot/route.ts`, `app/api/crm/dashboard/stats/route.ts`. |
| 2 | Sales funnel visualization (leads → deals → won) | ✅ | Home pipeline view and charts. |
| 3 | Revenue forecast (month, quarter, year) | ✅ | `app/api/crm/analytics/revenue-forecast/route.ts`, `lib/ai/revenue-forecast`; `RevenueForecast.tsx`. |
| 4 | Forecast by owner / team | ⚠️ | Forecast API may support filters; team breakdown not confirmed. |
| 5 | Win rate by stage, owner, source, deal size | ⚠️ | Analytics APIs; `app/api/crm/analytics/metrics/route.ts`; win rate breakdown to confirm. |
| 6 | Average deal cycle time | ⚠️ | Can be derived from deal dates; no dedicated metric API. |
| 7 | Deal velocity | ⚠️ | Pipeline health / analytics; `lib/ai/pipeline-health.ts`. |
| 8 | Lost deal analysis (by reason, stage) | ✅ | `Deal.lostReason`, `competitor`; CloseDealModal; reporting can use. |
| 9 | Quota management (target per user per period) | ❌ | No quota model or API found. |
| 10 | Quota attainment tracking | ❌ | No quota attainment. |
| 11 | Leaderboard (top performers by revenue, deals closed) | ⚠️ | Dashboard/Reports may show; no dedicated leaderboard API. |

---

## 4. CPQ (Configure, Price, Quote)

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Product / service catalog (name, SKU, description, unit price, HSN/SAC) | ⚠️ | `app/api/crm/cpq/products/route.ts` returns sample products; no full catalog model in CRM. |
| 2 | Product categories | ❌ | Not in CPQ products API. |
| 3 | Price books (standard, discounted, partner) | ❌ | Not implemented. |
| 4 | Create quote from deal (select products, qty, discount) | ⚠️ | `Quote` model exists in Prisma; `app/api/crm/cpq/quotes/route.ts` returns `[]` (stub). |
| 5 | Quote line item editor | ❌ | No UI/API for line items. |
| 6 | Discount types (%, flat, per line or total) | ❌ | Quote has discount field; no type UI. |
| 7 | Tax calculation (GST — CGST/SGST/IGST by state) | ❌ | Quote has tax; India GST logic not in CRM CPQ. |
| 8 | Quote PDF generation | ❌ | Not found. |
| 9 | Send quote via email / WhatsApp from CRM | ❌ | Not implemented. |
| 10 | Quote status (Draft → Sent → Viewed → Accepted → Rejected) | ✅ | `Quote.status` in schema. |
| 11 | Quote acceptance / e-signature | ⚠️ | `Quote.signatureEnvelopeId`, `signatureProvider`, `signatureStatus` in schema; no flow. |
| 12 | Quote expiry date | ✅ | `Quote.validUntil`. |
| 13 | Convert accepted quote → Invoice (Finance) | ❌ | No convert-to-invoice in CRM. |
| 14 | Multiple quotes per deal (versioning) | ⚠️ | Schema has Deal → Quote one-to-one; no versioning. |
| 15 | Quote templates | ❌ | Not found. |

---

## 5. Automation & Workflows

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Workflow trigger types (Record created/updated, Field change, Date, Stage change) | ⚠️ | `app/api/agents/workflows/route.ts` — workflow has `trigger: { type, config }`; types not fully CRM-specific (e.g. stage change). |
| 2 | Workflow actions (Email, WhatsApp, Task, Update field, Assign, Tag, Move stage, Notify, Webhook) | ⚠️ | Agent workflows have `steps`; action types not enumerated in audit. |
| 3 | Multi-step workflows (if → then → else) | ⚠️ | Steps array exists; conditional logic not confirmed. |
| 4 | Delay steps (wait X days then follow-up) | ❌ | No delay step in workflow. |
| 5 | Workflow activation / deactivation | ✅ | `AgentWorkflow.isActive` in schema. |
| 6 | Workflow execution log | ✅ | `_count: { runs }`; runs relation exists. |
| 7 | Auto-assignment rules (new lead → assign by rule) | ⚠️ | `lib/sales-automation/lead-allocation.ts`; rule engine partial. |
| 8 | Stage-based automation (e.g. deal to Proposal → create task) | ❌ | No stage-triggered automation in CRM. |
| 9 | SLA rules (e.g. lead not contacted in 2h → escalate) | ❌ | No SLA rules. |
| 10 | Duplicate prevention automation | ❌ | No. |
| 11 | Re-engagement automation (inactive 30 days → sequence) | ⚠️ | Nurture/sequences exist; auto-trigger by inactivity not confirmed. |

---

## 6. Sequences & Cadences

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Create sequence (timed steps: email D1, WhatsApp D3, call D5) | ✅ | Nurture/sequences; `app/api/leads/[id]/sequences`, `app/api/leads/[id]/enroll-sequence`, `app/api/sequences`, `app/api/marketing/sequences/route.ts`, `app/api/nurture/*`. |
| 2 | Step types: Email, WhatsApp, SMS, Task, LinkedIn | ⚠️ | Sequence steps exist; full set of types not verified. |
| 3 | Enroll contact / lead into sequence | ✅ | Enroll API; NurtureSequenceApplier in UI. |
| 4 | Auto-enroll via workflow trigger | ⚠️ | Workflows can trigger; link to sequence enrollment not confirmed. |
| 5 | Sequence pause / resume | ⚠️ | Nurture enrollment state; pause/resume API not confirmed. |
| 6 | Unenroll on reply | ⚠️ | Logic may exist in nurture; not verified. |
| 7 | Sequence performance stats (open, reply, conversion per step) | ⚠️ | Template analytics / nurture stats; per-step stats not confirmed. |
| 8 | A/B test sequence steps | ❌ | Not found. |
| 9 | Sequence templates library | ⚠️ | Nurture templates in seed; no library UI. |

---

## 7. AI Features (PayAid Differentiator)

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | AI Lead Score (0–100) | ✅ | `app/api/crm/leads/[id]/score/route.ts`, `lib/ai/lead-scoring`; `LeadScoreCard`, `AIFitScoreCard`. |
| 2 | AI Deal Score (win probability) | ✅ | `app/api/crm/deals/[id]/probability/route.ts`; `lib/ai/deal-closure-probability.ts`; DealHealthIndicator, AIScoreBadge. |
| 3 | AI Next Best Action | ✅ | `NextBestActionCard.tsx`; nurture_action, Email/WhatsApp/Call CTAs. |
| 4 | AI Email Composer | ✅ | `ContactAIOutreachPanel`, `EmailComposeDialog`; AI-generated content. |
| 5 | AI WhatsApp Message Composer | ⚠️ | NextBestActionCard builds message link; no dedicated AI composer for WhatsApp. |
| 6 | AI Call Summary | ⚠️ | Conversation intelligence / meeting intelligence APIs exist; call summary not verified. |
| 7 | AI Meeting Brief | ✅ | `app/api/crm/interactions/[id]/meeting-intelligence/route.ts`; prep brief. |
| 8 | AI Churn Risk Score | ✅ | `app/api/crm/analytics/churn-risk/route.ts`, `lib/ai/churn-predictor`; `ChurnRiskCard`, `ChurnRiskBadge`. |
| 9 | AI Pipeline Health Alert | ✅ | `app/api/crm/analytics/pipeline-health/route.ts`, `lib/ai/pipeline-health.ts`; `PipelineHealthDashboard`. |
| 10 | AI Duplicate Detector | ❌ | No AI duplicate detection. |
| 11 | AI Sentiment Analysis (email/note) | ❌ | Not found. |
| 12 | AI Co-founder (CRM context — natural language Q&A) | ✅ | Page AI assistant; "What's my conversion rate?" style via insights/dashboard data. |
| 13 | AI Summary on Contact Page | ⚠️ | `AIAssistCard` / summary; one-paragraph summary not confirmed. |
| 14 | AI Forecasting (AI-adjusted revenue forecast) | ✅ | `lib/ai/revenue-forecast`; combined forecast with scenarios. |

---

## 8. Segmentation & Views

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Create segments (saved filtered lists) | ✅ | `app/api/crm/segments/route.ts` (criteria-based). |
| 2 | Dynamic segments (auto-update) | ✅ | Segments use criteria; re-run gives current count. |
| 3 | Static segments (snapshot, manual) | ⚠️ | Not explicit; segments are criteria-based. |
| 4 | Segment by: tag, stage, owner, source, custom field, score, last activity, geography | ✅ | Segment criteria (field, operator, value); filters support these. |
| 5 | Use segments for: bulk email, sequence enrollment, reporting, export | ⚠️ | Segments used in UI; bulk email/sequence from segment not fully verified. |
| 6 | Personal views vs shared team views | ✅ | `SavedFilter.userId` (null = shared); `app/api/crm/saved-filters/route.ts`. |
| 7 | Pin views to top bar | ❌ | No pin-to-top-bar for views. |

---

## 9. Territories & Teams

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Define territories (geography, industry, account size) | ❌ | No territory model/API. |
| 2 | Assign users to territories | ❌ | No. |
| 3 | Auto-assign leads/deals by territory | ❌ | No. |
| 4 | Sales teams (group users, team target) | ❌ | No team model; SalesRep exists per user. |
| 5 | Team-level reporting | ❌ | No. |
| 6 | Manager view (see all reps' pipelines) | ⚠️ | Dashboard shows pipeline; role-based "manager" view not confirmed. |

---

## 10. Forms & Lead Capture

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Form builder (drag and drop fields) | ✅ | `app/crm/[tenantId]/Forms/page.tsx`, `FormBuilder`; `app/api/forms`; `lib/forms/form-builder`. |
| 2 | Embed code for website | ⚠️ | Form has slug; embed code generation not confirmed. |
| 3 | Form → auto-create lead in CRM | ⚠️ | FormSubmission exists; mapping to Contact/lead to verify. |
| 4 | Field mapping (form field → CRM field) | ⚠️ | Not confirmed. |
| 5 | Thank you page / redirect after submit | ✅ | Form settings: `redirectUrl`, `successMessage`. |
| 6 | Spam protection (honeypot or CAPTCHA) | ⚠️ | Settings have gdprConsent; honeypot/CAPTCHA not confirmed. |
| 7 | Form submission notifications (email to owner) | ❌ | Not found. |
| 8 | Multi-step forms | ⚠️ | FormBuilder has conditional logic; multi-step not confirmed. |
| 9 | Form analytics (views, submissions, conversion rate) | ⚠️ | Forms list has `_count.submissions`; full analytics not confirmed. |

---

## 11. Visitors & Web Tracking

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Website tracking script (embed on client site) | ❌ | No tracking script in CRM. |
| 2 | Identify known contacts visiting site | ⚠️ | `app/api/crm/visitors/route.ts` returns visitor insights with `contactId`/contact info; no script to identify. |
| 3 | Anonymous visitor tracking (company via IP) | ⚠️ | Visitors API has device, country, city; IP lookup not verified. |
| 4 | Page visit history per contact | ⚠️ | Visitor insight has pages array; linked to contact when identified. |
| 5 | Alert when high-value contact visits pricing page | ❌ | No alert. |
| 6 | Traffic source attribution | ⚠️ | Visitor has referrer; campaign attribution not confirmed. |

---

## 12. Customer Success

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Customer health score (usage, support, payment, engagement) | ✅ | `Account.healthScore`; `app/api/crm/analytics/health-scores/route.ts`; `HealthScoreVisualization`, `AccountHealthWidget`. |
| 2 | Onboarding checklist per customer | ❌ | Not found. |
| 3 | Success milestones tracking | ❌ | Not found. |
| 4 | Renewal tracking (renewal date, renewal deal) | ❌ | No renewal entity. |
| 5 | Upsell / cross-sell opportunity tracking | ✅ | `app/api/crm/analytics/upsell-opportunities/route.ts`; `UpsellOpportunityCard`; `lib/ai/upsell-detector.ts`. |
| 6 | NPS survey (send and track) | ❌ | No NPS in CRM. |
| 7 | CSAT survey | ❌ | No CSAT. |
| 8 | Customer success owner assignment | ❌ | No CS owner field. |
| 9 | At-risk customer alerts | ✅ | Churn risk API and UI. |

---

## 13. Churn Management

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Churn prediction model (AI score) | ✅ | `app/api/crm/analytics/churn-risk/route.ts`, `lib/ai/churn-predictor`; `app/api/crm/churn/dashboard/route.ts`. |
| 2 | Churn reasons catalog | ⚠️ | Lost reason on deals; no dedicated churn-reason catalog. |
| 3 | Churned customer list | ⚠️ | Can filter by status/stage; no dedicated "churned" list. |
| 4 | Win-back campaign trigger (re-engagement sequence) | ❌ | No win-back automation. |
| 5 | Churn rate metric (monthly, quarterly, by segment) | ⚠️ | Churn dashboard API; rate by period/segment not confirmed. |
| 6 | Revenue at risk calculation | ⚠️ | Churn risk returns high-risk customers; revenue at risk not confirmed. |

---

## 14. Reports & Analytics

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Pre-built reports: Pipeline by stage, Won/lost, Lead conversion, Activity, Forecast, Quota, Source performance | ✅ | `app/crm/[tenantId]/Reports/page.tsx`; `app/api/crm/dashboard/stats`, `analytics/summary`, `analytics/metrics`, `deals/pipeline-snapshot`. |
| 2 | Custom report builder (object, fields, filters, grouping, chart type) | ⚠️ | `app/api/crm/dashboard/custom/route.ts`; AdvancedAnalytics; full builder not confirmed. |
| 3 | Chart types: Bar, Line, Pie, Funnel, Table, Scorecard | ✅ | Dashboard and Reports use charts. |
| 4 | Date range filters | ✅ | Filters in dashboard and utils. |
| 5 | Report scheduling (email every Monday) | ❌ | No scheduling. |
| 6 | Dashboard (pin multiple reports as widgets) | ✅ | Home dashboard; `DashboardCustomizer`; custom dashboard API. |
| 7 | Multiple dashboards (Sales, Management, SDR) | ⚠️ | Custom dashboard API; multiple named dashboards not confirmed. |
| 8 | Dashboard sharing (team or public link) | ❌ | No sharing. |
| 9 | Export reports to CSV / PDF | ⚠️ | Contact export; report export not confirmed. |
| 10 | Goal tracking widget (actual vs target) | ❌ | No quota/goal widget. |
| 11 | Cohort analysis | ❌ | Not found. |
| 12 | Activity leaderboard report | ⚠️ | Activity feed; leaderboard not confirmed. |

---

## 15. Settings & Configuration

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Custom fields per object (Contacts, Deals, Leads, Accounts) | ⚠️ | Contact has customFields (JSON); field-layouts API; no full custom field admin for all objects. |
| 2 | Field types: Text, Number, Date, Dropdown, Multi-select, Checkbox, Currency, URL, Email, Phone, Formula | ⚠️ | Layout/config; not all types as configurable custom fields. |
| 3 | Required field rules | ❌ | Not in CRM settings. |
| 4 | Page layout customization (fields, order) | ✅ | `app/api/crm/field-layouts/route.ts`, `app/crm/[tenantId]/Settings/Field-Configuration/page.tsx`. |
| 5 | Pipeline stage customization | ✅ | `app/api/crm/pipelines/custom/route.ts`; `DealPipelineCustomizer.tsx`. |
| 6 | Deal lost reasons (configurable list) | ❌ | Lost reason is free text; no configurable list. |
| 7 | Lead disqualification reasons (configurable list) | ❌ | No. |
| 8 | Contact roles (decision maker, influencer, etc.) | ❌ | No. |
| 9 | Email template library management | ✅ | Templates in lib/crm; TemplateSelector; API render. |
| 10 | WhatsApp template management | ✅ | `app/api/crm/whatsapp-templates/route.ts`. |
| 11 | Notification preferences (per user) | ⚠️ | `app/api/crm/notifications/route.ts`; preferences not confirmed. |
| 12 | Role-based permissions (Admin, Manager, Sales Rep, Read-only) | ⚠️ | Auth/role in middleware; CRM-specific RBAC not verified. |
| 13 | Field-level access control | ❌ | No. |
| 14 | Audit log (who changed what and when) | ❌ | No CRM audit log. |
| 15 | Data import history | ❌ | No. |
| 16 | Module enable/disable | ⚠️ | License/module access in middleware; enable/disable per tenant in UI not confirmed. |

---

## 16. Integrations (Built-in)

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Finance module — quote → invoice, invoice status on deal, payment status in CRM | ⚠️ | Quote model exists; convert to invoice and deal-page invoice status not in CRM. Finance has invoices; link from deal to invoice not confirmed. |
| 2 | Marketing module — campaigns, engagement on timeline | ⚠️ | Campaigns/nurture exist; campaign enrollment on contact timeline not verified. |
| 3 | Support module — open tickets on contact page | ❌ | No support module integration in CRM. |
| 4 | HR module — assign from HR employee list | ⚠️ | SalesRep/User; HR employee list as source not confirmed. |
| 5 | Projects module — create project from won deal | ❌ | Not found. |
| 6 | Inventory module — products for CPQ | ❌ | CPQ products are stub; no inventory link. |
| 7 | Communication module — emails, WhatsApp, SMS in timeline | ✅ | Timeline shows interactions; email/WhatsApp from communication. |
| 8 | PayAid Payments — payment link from CRM, status on deal/contact | ⚠️ | Invoice payment links exist in Finance; CRM payment link not confirmed. |
| 9 | AI Studio — CRM AI powered by AI Studio agents | ⚠️ | AI features use lib/ai and APIs; AI Studio integration not verified. |

---

## 17. Mobile & Accessibility

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Responsive design (mobile browser) | ✅ | Tailwind responsive; layout rules (unified-layout) target mobile. |
| 2 | PWA (add to home screen, offline cached views) | ❌ | No manifest/service worker in app root found. |
| 3 | Mobile-optimized contact detail page | ✅ | Layout is responsive; EntityPageLayout. |
| 4 | Quick actions on mobile (call, log note, change stage) | ✅ | QuickActionsCard; call, note, stage. |
| 5 | Mobile notifications (push via PWA) | ❌ | No PWA push. |

---

## 18. India-Specific Must-Haves

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | GST number field on contacts and accounts | ⚠️ | Contact has `gstin`; Account model has no gstin/pan. |
| 2 | PAN number field | ❌ | Not on Contact/Account; other modules have PAN. |
| 3 | State field (for CGST/SGST vs IGST in CPQ) | ✅ | Contact/Account have `state`; CPQ tax logic not implemented. |
| 4 | WhatsApp as first-class channel | ✅ | WhatsApp templates, timeline, NextBestActionCard. |
| 5 | INR default currency with ₹ | ✅ | formatINR / ₹ in UI (Deals, exports, etc.). |
| 6 | Indian date format (DD/MM/YYYY) | ⚠️ | date-fns used; locale for IN not confirmed everywhere. |
| 7 | Indian phone format validation (+91) | ⚠️ | Phone validation in shared API (regex); +91 not enforced. |
| 8 | Public holidays calendar (task due date warnings) | ❌ | Not found. |
| 9 | Multi-language (Hindi + regional) | ❌ | Not in CRM. |
| 10 | Tally integration (via Finance) | ⚠️ | `lib/integrations/tally/sync` exists; CRM→Tally not direct. |

---

## 19. Security & Compliance

| # | Item | Status | File paths / Notes |
|---|------|--------|--------------------|
| 1 | Row-level security (users see only own or team records) | ⚠️ | Tenant-scoped APIs; assignedToId filtering not enforced on all list APIs. |
| 2 | Role-based access control (Admin, Manager, Sales Rep, Read-only) | ⚠️ | `requireModuleAccess`, roles in auth; CRM-specific RBAC not verified. |
| 3 | Field-level access control | ❌ | No. |
| 4 | Data export restrictions (e.g. only admins bulk export) | ⚠️ | Export API uses requireModuleAccess; admin-only not confirmed. |
| 5 | Audit trail (create/update/delete logged) | ❌ | No audit log. |
| 6 | Session management (active sessions, force logout) | ⚠️ | Auth/JWT; session list and force logout not confirmed. |
| 7 | IP allowlisting (admin setting) | ❌ | Not found. |
| 8 | GDPR/DPDP compliance (consent, right to erasure) | ⚠️ | Form gdprConsent; no consent logging or erasure flow in CRM. |
| 9 | Data retention policies | ❌ | Not found. |

---

## Mock-Only or Hardcoded CRM Routes

The following routes exist but return stub or empty data (no real data wiring):

| Route | Issue |
|-------|--------|
| `GET/POST /api/crm/cpq/quotes` | Returns `{ quotes: [] }`; no Quote persistence in handler. Prisma has Quote model but API does not use it. |
| `GET /api/crm/cpq/products` | Returns sample/hardcoded product list; no catalog from DB. |
| `GET /api/crm/visitors` | Returns computed visitor insights; depends on external tracking data — may be mock if no tracking script is deployed. |

Other CRM API routes under `app/api/crm/*` are wired to Prisma, shared modules, or lib (contacts, deals, tasks, segments, pipelines, analytics, dialer, etc.). Dashboard and report endpoints use real stats from the database.

---

**End of audit.** Use this document to prioritize missing or incomplete features and to fix stub APIs (e.g. CPQ quotes and products).

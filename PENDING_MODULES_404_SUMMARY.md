# Pending Items, Modules Without Dashboard/Landing, and 404 Behavior

**Generated:** Summary of current codebase state  
**Working doc:** Use the checklist below to track progress.

---

## ✅ Done

| Item | Status |
|------|--------|
| **`/dashboard/[tenantId]/stats` blank page** | ✅ Fixed – `app/dashboard/[tenantId]/stats/page.tsx` added; redirects to `stats/contacts`. |

---

## 1. What’s Pending (from roadmaps)

### HR module (advanced – Phase 1 & 2)
- **Phase 1 (next 3 months):** Flight Risk Prediction (ML), WhatsApp Bot, Auto-Payroll Processing, Biometric Integration, Advanced Reports.
- **Phase 2 (4–6 months):** Mobile App, Resume Screening AI, Tally Integration, Compliance Automation.
- **Quick wins:** WhatsApp Leave Bot, Auto-Payroll Validation, Advanced Report Builder, Flight Risk Alerts, Resume Matching Score.

### Finance & accounting
- **Critical SMB:** TDS Management, E-Invoicing & E-Way Bill, Bank Reconciliation (full), Credit/Debit Notes (done), Advance Payments & Receipts.
- **Core accounting:** Journal Entries, Trial Balance, Balance Sheet (enhanced), P&L (enhanced), Multi-Currency.
- **CA Assistant:** Currently stubbed (GST automation, bank reconciliation, expense classification).

### General
- API completion: many modules have more API routes than the “completed” counts in older audits; HR/Finance have the main gaps called out above.

---

## 2. Modules and dashboards/landing pages

**Architecture:** After login, users go to `/home/[tenantId]` (module grid). Each module entry (e.g. `/crm`, `/finance`) redirects to `/module/[tenantId]/Home/`.

**All of these modules have a physical `[tenantId]/Home/page.tsx` (dashboard/landing):**

- **Core:** CRM, Sales, Marketing, Finance, Projects, HR, Inventory  
- **Productivity:** Docs, Drive, Meet, PDF, Slides, Spreadsheet  
- **AI:** AI Studio, AI Co-founder, AI Chat, AI Insights, Knowledge RAG, Logo Generator, Website Builder  
- **Other:** Analytics, Communication, Appointments, Workflow Automation, Industry Intelligence  
- **Industry:** Wholesale, Events, Financial Services, Legal, Hospitality, Automotive, Beauty, Construction, Agriculture, Logistics, Real Estate, Professional Services, Asset Management, Field Service, E-commerce, Restaurant, Retail, Education, Manufacturing, Healthcare  
- **Other features:** LMS, Help Center, Contracts, Compliance, Voice Agents  

So **no module is missing a dashboard/landing page** in the sense of a missing `Home` route; every entry that redirects to `.../Home/` has a corresponding `Home/page.tsx`.

**Note:** The **main “dashboard”** is the **module-selection page** at `/home/[tenantId]` (not a single monolithic dashboard). `/dashboard` redirects to `/home`.

---

## 3. Features that show 404 or blank behavior

### A. App-level 404 (intentional `notFound()`)

These show the global **404 - Page Not Found** (`app/not-found.tsx`) when conditions aren’t met:

| Route / feature | When 404 is shown |
|-----------------|-------------------|
| **Admin tenant modules** | `app/admin/tenants/[tenantId]/modules/page.tsx` – when tenant not found |
| **Sites (subdomain)** | `app/sites/[subdomain]/page.tsx` and `[...path]/page.tsx` – website not found, not published, or page path not found |
| **Blog** | `app/blog/[slug]/page.tsx` – post not found for slug |
| **Features** | `app/features/[slug]/page.tsx` – feature not found for slug |

### B. Blank / broken route (bug)

| Route | Issue | Status |
|-------|--------|--------|
| **`/dashboard/[tenantId]/stats`** | Was: no `stats/page.tsx`, catch-all rendered null → blank page. | ✅ **Fixed** – redirect to `stats/contacts`. |

### C. API 404s (expected)

APIs return `404` for “resource not found” (e.g. employee, invoice, tenant). These are correct behavior, not missing pages. Examples: HR employees, attendance, assets, contractors, finance debit/credit notes, proposals, workflows, super-admin tenants/merchants, etc.

---

## 4. Summary

| Item | Status |
|------|--------|
| **Pending work** | HR Phase 1/2 (flight risk, WhatsApp bot, payroll, biometrics, reports, mobile, Tally, compliance); Finance (TDS, e-invoicing, bank recon, advances, journal entries, trial balance, reports, CA Assistant). |
| **Modules without dashboard/landing** | **None** – every module that redirects to `.../Home/` has a `Home/page.tsx`. |
| **Features that show 404** | **Intentional:** Admin tenant modules, Sites, Blog, Features. **Bug:** ~~`/dashboard/[tenantId]/stats`~~ → **Fixed.** |

---

## 5. What to work on next (priority order)

Pick one track and tick as you go.

### Option A – Quick wins (HR)
- [x] **WhatsApp Leave Bot** (2–3 weeks) – leave apply/balance via WhatsApp ✅
- [x] **Auto-Payroll Validation** (2 weeks) – validation + anomaly checks before run ✅
- [x] **Advanced Report Builder** (3–4 weeks) – custom HR reports, exports ✅
- [x] **Flight Risk Alerts** (1–2 weeks) – surface existing flight-risk API in UI ✅
- [x] **Resume Matching Score** (2–3 weeks) – show match score in Recruitment UI ✅

### Option B – Finance (critical SMB)
- [x] **TDS Management** – Due reminders (days left), Form 16A/26Q/24Q copy + Export/Prepare placeholders; TDS on payments noted in UI ✅
- [x] **E-Invoicing & E-Way Bill** – IRN/QR/e-way UI placeholders + “API coming soon” buttons; portal links ✅
- [x] **Bank Reconciliation (full)** – Multi-bank filter (by account), statement import placeholder + copy ✅
- [x] **Advance Payments & Receipts** – Adjust-against-invoice flow (modal + PATCH) ✅
- [x] **Journal Entries** – Numbering (JE-YYYY-NNNN), reversals (POST …/reverse + Reverse button) ✅

### Option C – 404/UX polish
- [x] **Admin tenant modules** – `app/admin/tenants/[tenantId]/not-found.tsx` – friendly “Tenant not found” + links ✅
- [x] **Sites** – `app/sites/[subdomain]/not-found.tsx` – “Site or page not found” + CTA ✅
- [x] **Blog / Features** – `app/blog/not-found.tsx` and `app/features/not-found.tsx` – post/feature not found copy and CTA ✅

### Follow-up (next steps completed)
- [x] **TDS reminders** – `GET /api/finance/tds/reminders?days=7`; in-app warning banner on TDS page when a return is due within 7 days ✅
- [x] **Bank statement upload (stub)** – `POST /api/finance/bank-reconcile/import` accepts CSV/TXT/OFX; returns message + line count; Bank Reconciliation page has file input and shows result toast ✅

---

**Next step (suggested):** HR Phase 2 deliverables (mobile app, resume screening AI, Tally integration, compliance automation). See **docs/NEXT_STEPS_ROADMAP.md** for the full roadmap.

**Recently completed:** Trial Balance (API + Reports UI), Enhanced P&L and Balance Sheet (real data + breakdowns), CA Assistant (real links + TDS reminders + bank recon summary).

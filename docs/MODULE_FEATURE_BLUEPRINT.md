# PayAid V3 – Module × Feature Blueprint

**Purpose:** Single reference for which module owns which feature, where to access it (URL + UI), and how the structure could be improved.

**Route pattern (decoupled):** `/{module}/{tenantId}/{Feature}/`  
**Entry:** Module Switcher (top bar) → pick module → lands on `/{module}/{tenantId}/Home/`. Module top bar (or sidebar) lists features.

---

## 1. Module × Feature Map (Decoupled Routes)

### 1.1 CRM  
**Entry:** Module Switcher → CRM → `/crm/{tenantId}/Home/`  
**Nav source:** `lib/crm/crm-top-bar-items.ts` (single source of truth)

| Feature | URL | Access |
|--------|-----|--------|
| Home | `/crm/{tenantId}/Home` | Top bar: Home |
| Prospects (Leads) | `/crm/{tenantId}/Leads` | Top bar: Prospects |
| Contacts | `/crm/{tenantId}/Contacts` | Top bar: Contacts |
| Customers | `/crm/{tenantId}/AllPeople?stage=customer` | Top bar: Customers |
| Deals | `/crm/{tenantId}/Deals` | Top bar: Deals |
| Tasks | `/crm/{tenantId}/Tasks` | Top bar: Tasks |
| All People | `/crm/{tenantId}/AllPeople` | Top bar: All People |
| Meetings | `/crm/{tenantId}/Meetings` | Top bar: Meetings |
| CPQ | `/crm/{tenantId}/CPQ` | Top bar: CPQ |
| Agents | `/crm/{tenantId}/Agents` | Top bar: Agents |
| Churn | `/crm/{tenantId}/Churn` | Top bar: Churn |
| Metrics | `/crm/{tenantId}/Metrics` | Top bar: Metrics |
| Sales Automation | `/crm/{tenantId}/SalesAutomation` | Top bar: Sales Automation |
| Sales Enablement | `/crm/{tenantId}/SalesEnablement` | Top bar: Sales Enablement |
| Dialer | `/crm/{tenantId}/Dialer` | Top bar: Dialer |
| Customer Success | `/crm/{tenantId}/CustomerSuccess` | Top bar: Customer Success |
| Visitors | `/crm/{tenantId}/Visitors` | Top bar: Visitors |
| Reports | `/crm/{tenantId}/Reports` | Top bar: Reports |

*Also present in app but not in top bar (or nested):* Contacts/New, Contacts/[id], Contacts/[id]/Edit, Deals/New, Deals/[id], Deals/[id]/Edit, Leads/New, Tasks/new, Tasks/[id], Accounts, Territories, Quotes, Forms, Settings/Field-Configuration.

---

### 1.2 Sales  
**Entry:** Module Switcher → Sales → `/sales/{tenantId}/Home/`  
**Nav source:** In layout files (e.g. `app/sales/[tenantId]/Home/layout.tsx`)

| Feature | URL | Access |
|--------|-----|--------|
| Home | `/sales/{tenantId}/Home` | Top bar: Home |
| Landing Pages | `/sales/{tenantId}/Landing-Pages` | Top bar: Landing Pages |
| Checkout Pages | `/sales/{tenantId}/Checkout-Pages` | Top bar: Checkout Pages |
| Orders | `/sales/{tenantId}/Orders` | Top bar: Orders |

*Nested:* Orders/New, Orders/[id].

---

### 1.3 Marketing  
**Entry:** Module Switcher → Marketing → `/marketing/{tenantId}/Home/`  
**Nav source:** In layout files (e.g. `app/marketing/[tenantId]/Home/layout.tsx`)

| Feature | URL | Access |
|--------|-----|--------|
| Home | `/marketing/{tenantId}/Home` | Top bar: Home |
| Campaigns | `/marketing/{tenantId}/Campaigns` | Top bar: Campaigns |
| Sequences | `/marketing/{tenantId}/Sequences` | Top bar: Sequences |
| Ads | `/marketing/{tenantId}/Ads` | Top bar: Ads |
| Creative Studio | `/marketing/{tenantId}/Creative-Studio` | Top bar: Creative Studio |
| Social Listening | `/marketing/{tenantId}/SocialListening` | Top bar: Social Listening |
| Analytics | `/marketing/{tenantId}/Analytics` | Top bar: Analytics |
| Segments | `/marketing/{tenantId}/Segments` | Top bar: Segments |
| Social | `/marketing/{tenantId}/Social-Media` | Top bar: Social |

*Creative Studio sub-features:* Product Studio, Model Studio, Image Ads, Ad Insights (under Creative-Studio).  
*Social sub-features:* Create Post, Create Image, Schedule.  
*Other:* AI-Influencer, AI-Influencer/New, Campaigns/New, Campaigns/[id], Email, WhatsApp (pages exist).

---

### 1.4 Finance  
**Entry:** Module Switcher → Finance → `/finance/{tenantId}/Home/`  
**Nav source:** `app/finance/[tenantId]/layout.tsx`

| Feature | URL | Access |
|--------|-----|--------|
| Home | `/finance/{tenantId}/Home` | Top bar: Home |
| Invoices | `/finance/{tenantId}/Invoices` | Top bar: Invoices |
| Credit Notes | `/finance/{tenantId}/Credit-Notes` | Top bar: Credit Notes |
| Debit Notes | `/finance/{tenantId}/Debit-Notes` | Top bar: Debit Notes |
| Accounting | `/finance/{tenantId}/Accounting` | Top bar: Accounting |
| Purchase Orders | `/finance/{tenantId}/Purchase-Orders` | Top bar: Purchase Orders |
| GST Reports | `/finance/{tenantId}/GST` | Top bar: GST Reports |
| TDS | `/finance/{tenantId}/TDS` | Top bar: TDS |
| E-Invoicing | `/finance/{tenantId}/E-Invoicing` | Top bar: E-Invoicing |
| Bank Reconciliation | `/finance/{tenantId}/Bank-Reconciliation` | Top bar: Bank Reconciliation |
| Advances | `/finance/{tenantId}/Advances` | Top bar: Advances |
| Tally Export | `/finance/{tenantId}/Tally-Export` | Top bar: Tally Export |
| CA Assistant | `/finance/{tenantId}/ca-assistant` | Top bar: CA Assistant |

*Accounting sub-features:* Expenses, Journal-Entries, Reports (Revenue, Expenses).  
*GST sub-features:* GSTR-1, GSTR-3B.  
*Other:* Billing, Recurring-Billing, Vendors, Invoices/[id], Invoices/[id]/Edit, etc.

---

### 1.5 HR  
**Entry:** Module Switcher → HR → `/hr/{tenantId}/Home/`  
**Nav source:** `app/hr/[tenantId]/layout.tsx`

| Feature | URL | Access |
|--------|-----|--------|
| Dashboard | `/hr/{tenantId}/Home` | Top bar: Dashboard |
| Employees | `/hr/{tenantId}/Employees` | Top bar: Employees |
| Contractors | `/hr/{tenantId}/Contractors` | Top bar: Contractors |
| Recruitment | `/hr/{tenantId}/Recruitment` | Top bar: Recruitment |
| Onboarding | `/hr/{tenantId}/Onboarding` | Top bar: Onboarding |
| Offboarding | `/hr/{tenantId}/Offboarding` | Top bar: Offboarding |
| Payroll Runs | `/hr/{tenantId}/Payroll-Runs` | Top bar: Payroll Runs |
| Salary Structures | `/hr/{tenantId}/Salary-Structures` | Top bar: Salary Structures |
| Attendance | `/hr/{tenantId}/Attendance` | Top bar: Attendance |
| Leaves & Holidays | `/hr/{tenantId}/Leave` | Top bar: Leaves & Holidays |
| Performance | `/hr/{tenantId}/Performance` | Top bar: Performance |
| Payslips & Forms | `/hr/{tenantId}/Payslips` | Top bar: Payslips & Forms |
| Reimbursements | `/hr/{tenantId}/Reimbursements` | Top bar: Reimbursements |
| Assets | `/hr/{tenantId}/Assets` | Top bar: Assets |
| Compliance | `/hr/{tenantId}/Statutory-Compliance` | Top bar: Compliance |
| Documents | `/hr/{tenantId}/Documents` | Top bar: Documents |
| Insurance & Benefits | `/hr/{tenantId}/Insurance` | Top bar: Insurance & Benefits |
| Reports & Analytics | `/hr/{tenantId}/Reports` | Top bar: Reports & Analytics |
| Settings | `/hr/{tenantId}/Settings` | Top bar: Settings |

*Note:* Hiring (Job Requisitions, Candidates, Interviews, Offers) lives under `/hr/{tenantId}/Hiring/` but top bar label is “Recruitment” → points to Recruitment. Payroll (Cycles, Salary-Structures, Reports) lives under `/hr/{tenantId}/Payroll/` while top bar has “Payroll Runs” and “Salary Structures” as separate items (Payroll-Runs vs Payroll/*). Attendance has Calendar, Check-In, Mark. Leave has Apply, Requests, Balances.

---

### 1.6 Projects  
**Entry:** Module Switcher → Projects → `/projects/{tenantId}/Home/`  
**Nav source:** In layout files (e.g. `app/projects/[tenantId]/Home/layout.tsx`)

| Feature | URL | Access |
|--------|-----|--------|
| Home | `/projects/{tenantId}/Home` | Top bar: Home |
| All Projects | `/projects/{tenantId}/Projects` | Top bar: All Projects |
| Tasks | `/projects/{tenantId}/Tasks` | Top bar: Tasks |
| Time Tracking | `/projects/{tenantId}/Time` | Top bar: Time Tracking |
| Gantt Chart | `/projects/{tenantId}/Gantt` | Top bar: Gantt Chart |
| Reports | `/projects/{tenantId}/Reports` | Top bar: Reports |

*Nested:* Projects/new, Projects/[id], Tasks/new, Tasks/[id].

---

### 1.7 Inventory  
**Entry:** Module Switcher → Inventory → `/inventory/{tenantId}/Home/`  
**Nav source:** In layout files (e.g. `app/inventory/[tenantId]/Home/layout.tsx`)

| Feature | URL | Access |
|--------|-----|--------|
| Home | `/inventory/{tenantId}/Home` | Top bar: Home |
| Products | `/inventory/{tenantId}/Products` | Top bar: Products |
| Warehouses | `/inventory/{tenantId}/Warehouses` | Top bar: Warehouses |
| Stock Movements | `/inventory/{tenantId}/StockMovements` | Top bar: Stock Movements |
| Reports | `/inventory/{tenantId}/Reports` | Top bar: Reports |

*Not in top bar:* Stock-Alerts (`/inventory/{tenantId}/Stock-Alerts`) — has layout/page but no top-bar link.  
*Nested:* Products/[id], Products/[id]/Edit, StockMovements/new, Warehouses/new.

---

### 1.8 Industry Intelligence  
**Entry:** Module Switcher → Industry Intelligence → `/industry-intelligence/{tenantId}/Home/`  
**Nav source:** In layout files.

| Feature | URL | Access |
|--------|-----|--------|
| Home | `/industry-intelligence/{tenantId}/Home` | Top bar (minimal) |

---

### 1.9 AI Studio (and standalone AI modules)  
**Entry:** Not in ModuleSwitcher as “AI Studio”; `modules.config.ts` has `/ai-studio`.  
**AI Studio nav source:** `app/ai-studio/[tenantId]/Home/layout.tsx`

| Feature | URL | Access |
|--------|-----|--------|
| Home | `/ai-studio/{tenantId}/Home` | Top bar: Home |
| AI Co-founder | `/ai-studio/{tenantId}/Cofounder` | Top bar: AI Co-founder |
| AI Chat | `/ai-studio/{tenantId}/Chat` | Top bar: AI Chat |
| AI Insights | `/ai-studio/{tenantId}/Insights` | Top bar: AI Insights |
| Websites | `/ai-studio/{tenantId}/Websites` | Top bar: Websites |
| Logos | `/ai-studio/{tenantId}/Logos` | Top bar: Logos |
| Knowledge | `/ai-studio/{tenantId}/Knowledge` | Top bar: Knowledge |

*Standalone AI (in modules.config, not in ModuleSwitcher):* ai-cofounder, ai-chat, ai-insights, website-builder, logo-generator, knowledge-rag, voice-agents — each has own route (e.g. `/ai-chat/{tenantId}/Home`, `/knowledge-rag/{tenantId}/Home`).

---

### 1.10 Other decoupled modules (no or limited Module Switcher entry)

| Module | Entry / URL pattern | Features (summary) |
|--------|----------------------|--------------------|
| **Communication** | `/communication/{tenantId}/Home` | Home (config has Email, WhatsApp, SMS — routes may vary). |
| **Analytics** | `/analytics/{tenantId}/Home` | Home, Reports, Dashboards. |
| **Productivity** | `/productivity/{tenantId}/` | Tabs: Sheets, Docs, Drive, Meet, PDF, etc. (single top bar for productivity). |
| **Spreadsheet** | `/spreadsheet/{tenantId}/` | Home, Spreadsheets (create, [id], new). |
| **Docs / Drive / Meet / PDF / Slides** | `/docs/`, `/drive/`, `/meet/`, `/pdf/`, `/slides/` with `{tenantId}` | Each has own layout; often reached via Productivity. |
| **Appointments** | `/appointments/{tenantId}/Home` | Home. |
| **Contracts** | `/contracts/{tenantId}/Home` | Home. |
| **Compliance** | `/compliance/{tenantId}/Home` | Home. |
| **LMS** | `/lms/{tenantId}/Home` | Home. |
| **Workflow Automation** | `/workflow-automation/{tenantId}/Home` | Home. |
| **Support** | `/support/{tenantId}/Tickets`, `/support/{tenantId}/Chat` | Tickets, Chat. |
| **Help Center** | `/help-center/{tenantId}/Home` | Home. |
| **Voice Agents** | `/voice-agents/{tenantId}/Home` | Home. |

---

## 2. Where features live vs where they’re accessed

- **Module Switcher** (top bar) currently shows: CRM, Projects, Sales, Inventory, Finance, Marketing, HR, Industry Intelligence.  
- **modules.config.ts** lists many more (AI Studio, AI Co-founder, AI Chat, Analytics, Appointments, Productivity, Industry, etc.); some point to `/dashboard/...` (monolithic), some to decoupled `/{module}/{tenantId}/...`.  
- **moduleRegistry.ts** defines a different set (CRM, HR, accounting, communication, reports, payments, workflow, analytics) and uses paths like `/accounting/...` (no “finance”) and no sales/marketing/projects/inventory.  
- **FEATURES_AND_MODULES_GUIDE.md** documents the **monolithic** `/dashboard/...` structure (deprecated per DECOUPLED_ARCHITECTURE_GUIDE.md).

So: **decoupled app routes** are the source of truth for “what exists”; **ModuleSwitcher** and **per-module top bars** are the source of truth for “where users access it.” Config and docs are partially out of sync.

---

## 3. Structural issues (why “structure seems a little off”)

1. **Two route systems**  
   - Decoupled: `/{module}/{tenantId}/{Feature}/`.  
   - Monolithic: `/dashboard/...` (deprecated but still in docs and possibly some links).  
   Confusion when features are documented under dashboard but implemented under module routes.

2. **Multiple config sources**  
   - Module list: ModuleSwitcher (8) vs modules.config.ts (40+) vs moduleRegistry (8, different ids/paths).  
   - Nav items: CRM uses shared `lib/crm/crm-top-bar-items.ts`; Finance/HR use inline arrays in layout; Marketing/Sales/Projects/Inventory use inline arrays in multiple layout files. Duplication and risk of drift (e.g. Marketing top bar repeated in many layouts).

3. **AI placement**  
   - AI Studio is a full module (Co-founder, Chat, Insights, Websites, Logos, Knowledge) but not in ModuleSwitcher.  
   - Standalone AI apps (ai-chat, ai-insights, website-builder, logo-generator, knowledge-rag, voice-agents) exist in modules.config but not in the main switcher.  
   Users may not know whether to go to “AI Studio” or a specific AI app.

4. **HR naming and hierarchy**  
   - Top bar: “Recruitment” vs route: “Hiring” (Job Requisitions, Candidates, Interviews, Offers).  
   - “Payroll Runs” (Payroll-Runs) vs “Payroll” (Cycles, Salary-Structures, Reports) — two different path trees, both in top bar.

5. **Inventory**  
   - Stock-Alerts has a page but no top bar link; Reports is in top bar.  
   - Minor: “Reports” might be better grouped or renamed for clarity.

6. **Marketing**  
   - “Social” points to Social-Media; sub-features (Create Post, Create Image, Schedule) live under that route.  
   - Email and WhatsApp exist as pages but may not be clearly surfaced in the same nav pattern as Campaigns/Sequences.

7. **Features in modules.config pointing to dashboard**  
   - Analytics → `/dashboard/analytics`, Industry Intelligence → `/dashboard/news`, Appointments → `/dashboard/appointments`, etc.  
   If those features are also (or only) under decoupled routes, links should point to decoupled URLs for consistency.

8. **Productivity**  
   - One “Productivity” entry that aggregates Sheets, Docs, Drive, Meet, PDF.  
   - Some of those also exist as standalone app roots (`/spreadsheet/`, `/docs/`, etc.).  
   Clear “single entry = Productivity” vs “direct links to Sheets/Docs” policy would help.

---

## 4. Recommendations for placement and accessibility

1. **Single source of truth per module**  
   - Like CRM’s `lib/crm/crm-top-bar-items.ts`, introduce a single nav config per module (e.g. `lib/finance/finance-top-bar-items.ts`, `lib/marketing/marketing-top-bar-items.ts`, `lib/hr/hr-top-bar-items.ts`).  
   - Use it in the module’s single `[tenantId]/layout.tsx` so all nested layouts inherit the same top bar.  
   - Stops duplication and keeps “where to access” consistent.

2. **Align ModuleSwitcher with decoupled routes**  
   - Decide which modules are “primary” and list only those in the switcher (e.g. CRM, Sales, Marketing, Finance, HR, Projects, Inventory, AI Studio, Industry Intelligence).  
   - Other modules (Analytics, Appointments, Communication, Compliance, Contracts, LMS, Support, Help Center, Workflow, Voice Agents, Productivity) can be:  
     - Under a “More” or “Tools” submenu, or  
     - Reached from Home/dashboard links, or  
     - Replaced by a single “AI” entry that opens AI Studio (and from there to Co-founder, Chat, Insights, etc.).  
   - Update ModuleSwitcher and modules.config so the same list is used or derived from one config.

3. **Sync moduleRegistry with decoupled modules**  
   - Either make moduleRegistry the source for “which modules exist” and their base paths (e.g. finance not accounting), or retire moduleRegistry in favor of modules.config + decoupled routes.  
   - Use one place for “module id → path → permissions” so backend and frontend agree.

4. **HR: naming and hierarchy**  
   - Rename “Recruitment” to “Hiring” in the top bar (or keep “Recruitment” and make it redirect to `/hr/{tenantId}/Hiring`).  
   - Consider one “Payroll” top-level item that expands or links to a Payroll hub (Cycles, Runs, Salary Structures, Reports) instead of two separate items “Payroll Runs” and “Salary Structures.”

5. **Inventory**  
   - Add “Stock Alerts” to the inventory top bar (or fold it into Reports as a sub-view).  
   - Ensure “Reports” and “Stock Alerts” are both discoverable.

6. **Marketing**  
   - Ensure Email and WhatsApp have explicit top bar or sub-nav entries if they are first-class features.  
   - Keep Creative Studio as one entry with sub-features (Product Studio, Model Studio, etc.) as today.

7. **Documentation**  
   - Update FEATURES_AND_MODULES_GUIDE.md to prefer decoupled URLs and point to this blueprint for “module × feature × URL.”  
   - Add a short “Where do I find X?” section that maps feature names to module + top bar label + URL.

8. **Deprecate dashboard routes gradually**  
   - For any feature that exists in decoupled form, link and redirect from `/dashboard/...` to `/{module}/{tenantId}/...`.  
   - Then remove or redirect dashboard routes so one path = one feature.

---

## 5. Quick reference: “Where do I find X?”

| Looking for… | Module | Top bar / entry | URL pattern |
|--------------|--------|------------------|-------------|
| Leads / prospects | CRM | Prospects | `/crm/{tenantId}/Leads` |
| Deals, pipeline | CRM | Deals | `/crm/{tenantId}/Deals` |
| Contacts, people | CRM | Contacts / All People | `/crm/{tenantId}/Contacts`, `/crm/{tenantId}/AllPeople` |
| Landing / checkout pages | Sales | Landing Pages, Checkout Pages | `/sales/{tenantId}/Landing-Pages`, `.../Checkout-Pages` |
| Orders (sales) | Sales | Orders | `/sales/{tenantId}/Orders` |
| Campaigns, sequences, ads | Marketing | Campaigns, Sequences, Ads | `/marketing/{tenantId}/Campaigns`, etc. |
| Creative Studio (Product/Model Studio, etc.) | Marketing | Creative Studio | `/marketing/{tenantId}/Creative-Studio` |
| Social posts, scheduling | Marketing | Social | `/marketing/{tenantId}/Social-Media` |
| Invoices, accounting, GST | Finance | Invoices, Accounting, GST Reports | `/finance/{tenantId}/Invoices`, `.../Accounting`, `.../GST` |
| Purchase orders, vendors | Finance | Purchase Orders (Vendors under) | `/finance/{tenantId}/Purchase-Orders`, `.../Vendors` |
| Employees, payroll, attendance, leave | HR | Employees, Payroll Runs, Attendance, Leaves & Holidays | `/hr/{tenantId}/Employees`, `.../Payroll-Runs`, etc. |
| Hiring (reqs, candidates, interviews) | HR | Recruitment | `/hr/{tenantId}/Hiring/` (or Recruitment) |
| Projects, tasks, Gantt, time | Projects | All Projects, Tasks, Time Tracking, Gantt Chart | `/projects/{tenantId}/Projects`, etc. |
| Products, warehouses, stock | Inventory | Products, Warehouses, Stock Movements, Reports | `/inventory/{tenantId}/Products`, etc. |
| AI Co-founder, Chat, Insights, Websites, Logos, Knowledge | AI Studio | (Not in ModuleSwitcher; use /ai-studio or config) | `/ai-studio/{tenantId}/Cofounder`, `.../Chat`, etc. |
| Industry news / trends | Industry Intelligence | (Module Switcher) | `/industry-intelligence/{tenantId}/Home` |

---

*This blueprint is the recommended reference for feature placement and accessibility. When adding or moving a feature, update the relevant module nav config and this doc.*

# PAYAID V3 USER GUIDE v4.0

## Hero + pricing placeholders

One login. **[X modules]**. **[₹X/mo] – [₹X/mo]**. Turn on modules as you grow—no bloat.

> Note: This guide intentionally uses placeholders (e.g. `[₹X/mo]`, `[X modules]`). Your Pricing page will contain final numbers.

## Get Started (visual flow)

```
Login
  |
  v
/app resolver checks eligible modules
  |
  v
If 1 eligible module: auto-redirect to module dashboard
  |
  v
If multiple: module picker page
  |
  v
If none: "No modules assigned" screen
  |
  v
Dashboard/workspace (modules you own)
  |
  v
Tap a module card → full-screen workspace
  |
  v
Use global search to jump (e.g. “Invoices”, “Leads”)
  |
  v
Do the daily workflow
  |
  v
Ask AI in-context (only your tenant/company data)
```

Mobile quick tips:
- Use bottom navigation for the big 4 (CRM, Finance, Communication, Tasks)
- Swipe between lists → detail → actions (call, WhatsApp, invoice, follow-up)

Post-login routing note:
- `/app` is the default post-login target system-wide.
- `/launch` is a permanent alias that redirects to `/app`.

## Naming in this Guide (important)

- `CRM` means **PayAid CRM (EspoCRM)**, your core customer hub.
- `Sales Studio` means **Sales Studio (Frappe)**, focused on pipeline, sequences, and forecasting.

## Core 11 Modules (all 11)

### 1. CRM – Your Customer Hub (Leads → Customers)

Daily flow:
```
Prospects → Add lead (QR scan / auto-capture)
Contacts → WhatsApp history + notes
Deals → Drag pipeline → AI suggests “Next action: Call?”
Tasks → Auto-assign + reminders
```

AI examples:
- “Score these 50 leads” → prioritized list
- “Draft a WhatsApp follow-up for this contact” → message + next-step

Mobile tip: open a contact → tap Call or WhatsApp from the same page.

---

### 2. Sales Studio – Revenue Engine (Rep quotas + forecasting)

Daily flow:
```
Pipeline → Kanban stages
Sequences → “Day 1 WA → Day 3 Email”
Playbooks → “₹[X] objection handling”
Leaderboards → Top rep performance
```

AI examples:
- “Optimize sequence for restaurant leads”
- “What should I do next for this pipeline stage?”

Entitlement: available on selected plans (e.g. `[Plan name]`+) or as an add-on.

---

### 3. Marketing Studio – Campaigns Studio (Leads at scale)

Daily flow:
```
Audiences → CSV or CRM sync
AI Content → “Reel for GST tool”
Channels → FB / IG / WA / Email
Launch → Schedule + A/B
```

AI examples:
- “Write 10 WhatsApp intros for retail owners”
- “Turn this offer into a short ad set”

Standalone usage: CSV upload → WhatsApp broadcasts.

---

### 4. Finance – GST-Ready Accounting (Cashflow control)

Daily flow:
```
Invoices → GST auto-fill → Razorpay link
POs → Vendor tracking
Expenses → Photo receipt → categorize
GSTR exports → export-ready output
```

AI examples:
- “Remind top 5 overdue invoices” → reminder workflow
- “Summarize invoice status for this week”

---

### 5. HR – People Ops (Team management)

Daily flow:
```
Leave → Apply/approve (self-service)
Attendance → GPS check-in
Payroll → exclusions + reimbursements
Hiring → pipeline + interview notes
```

---

### 6. Communication

What it does:
- Inbox: Email + WhatsApp + SMS unified

Workflow:
```
Contact → Message → Reply logged in CRM
```

Mobile tip: open `Inbox` → tap a thread → reply; the conversation stays attached to the contact.

---

### 7. AI Studio

What it does:
- Agents: “Write proposal” → creates a Doc + attaches it

Workflow:
```
Ask → Generate → Review → Use
```

Mobile tip: use voice dictation for “Ask”, then edit the final draft before sending.

---

### 8. Analytics

What it does:
- Dashboards: revenue trends + funnel

Workflow:
```
“Weekly sales” → Auto-email PDF
```

Mobile tip: favorite 2–3 dashboards so they open first.

---

### 9. Invoicing

What it does:
- Standalone: quote → invoice → payment

Workflow:
```
Deal won → Auto-invoice
```

Mobile tip: generate an invoice link on the spot and send via WhatsApp from the same screen.

---

### 10. Accounting

What it does:
- Books: expenses → P&L → balance sheet

Workflow:
```
Receipt photo → Categorized
```

Mobile tip: snap the receipt immediately; the app will remind you to confirm category later.

---

### 11. Inventory

What it does:
- Stock: products → stock levels → reorder

Workflow:
```
Low stock → PO auto-create
```

Mobile tip: scan items during receiving; inventory updates instantly.

## Productivity Suite (selected plans)

Common workflows:
- Docs: proposals → share → e-sign
- Spreadsheet: P&L → charts → team edits
- Slides: pitch decks → present
- Drive: attach files to CRM records
- Meet: record calls without leaving PayAid
- PDF tools: merge invoices, compress PDFs

AI Boost:
- “Summarize Q1 P&L” → insights + suggested charts

## AI Services (Examples You Can Actually Use)

- AI Co-founder: “Fix cashflow crunch” → 5 concrete steps
- AI Insights: “Churn risks” → “Follow up Rajesh” (with rationale from your data)
- Website Builder: “Restaurant site” → live URL
- Logo Generator: 20 variants → download SVG
- Knowledge AI: “GST rules” → your docs cited
- Voice Agents: “Book demo?” → creates/updates a CRM lead (handoff to your workflow)

## 19 Industry Packs (Vertical Magic)

Industry packs give you pre-built screens and workflows. Typical examples:
- Restaurant: tables, KDS, menu, delivery
- Retail: POS, loyalty, stock, cashier workflows
- Ecom: Shopify sync, fulfillment, dropship tooling
- Healthcare: patients, appointments, pharmacy
- Real Estate: properties, leads, documents

Activate: `Dashboard` → `App Store` → install pack → your module screens appear.

## “I Want To…” Cheat Sheet

- `Invoice` → `Finance` → `New` → send Razorpay link
- `Lead` → `CRM` → `Prospects` → WhatsApp intro
- `Campaign` → `Marketing Studio` → `New` → AI reel → schedule
- `Project` → `Projects`


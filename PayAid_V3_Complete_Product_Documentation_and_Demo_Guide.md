# PayAid V3 — Complete Product Documentation & Demo Guide

**Version:** 3.0  
**Last Updated:** February 2026  
**Audience:** Demos, sales, internal use

---

## 1. Executive Summary

**PayAid V3** is a **SaaS Business Operating System** that gives Indian and global SMBs one platform for CRM, finance, HR, projects, marketing, AI tools, and 19+ industry modules. It streamlines payments, invoicing, operations, and analytics so teams can run the business from a single place instead of juggling multiple tools. The platform is built for businesses that need **payment automation**, **operations consolidation**, **GST-compliant invoicing**, **AI-powered insights**, and **modular licensing** (pay only for the modules you use). PayAid V3 is developed on **Cursor** using **Next.js 16**, **React 19**, **Prisma**, **PostgreSQL** (Supabase), **Zustand**, and **Tailwind CSS**, with JWT-based auth, multi-tenant isolation, and role-based access control.

---

## 2. Core Features & Platform Capabilities

Implemented features are grouped below with short descriptions and where they live in the codebase.

### Payment & Finance

| Feature | Description | Key Files / APIs |
|--------|-------------|-------------------|
| **Invoicing** | GST-compliant invoices, multi-currency, PDF, email delivery, payment links | `app/finance/[tenantId]/Invoices/`, `app/api/invoices/route.ts`, `lib/currency/converter.ts` |
| **Payment processing** | PayAid gateway, webhooks, Razorpay integration | `app/api/payments/webhook/route.ts`, `app/api/integrations/razorpay/` |
| **Multi-currency** | Currencies, exchange rates, conversion, reporting | `app/api/currencies/`, `app/api/currencies/rates/`, `app/dashboard/settings/currencies/` |
| **Tax engine** | Tax rules, per-item tax, GST/VAT, exemptions, reporting | `app/api/tax/`, `app/dashboard/settings/tax/`, `lib/tax/` |
| **Purchase orders & vendors** | PO creation, approval, vendor management | `app/finance/[tenantId]/Purchase-Orders/`, `app/finance/[tenantId]/Vendors/` |
| **Recurring billing** | Recurring invoices and expenses | `app/finance/[tenantId]/Recurring-Billing/`, `app/api/expenses/recurring/` |
| **Payment reminders** | Overdue reminders, smart reminders, merge suggestions | `app/api/invoices/[id]/send-reminder/`, `app/api/invoices/[id]/smart-reminder/`, `app/api/invoices/merge-suggestions/`, `app/api/invoices/merge/` |
| **Cash flow & finance dashboard** | Cash flow, finance stats, alerts | `app/api/finance/cash-flow/`, `app/api/finance/dashboard/stats/`, `components/finance/` |

### CRM & Sales

| Feature | Description | Key Files / APIs |
|--------|-------------|-------------------|
| **Contacts & leads** | Contact DB, lead pipeline, segmentation, custom fields | `app/crm/[tenantId]/Contacts/`, `app/api/contacts/`, `app/api/crm/` |
| **Deals & pipeline** | Kanban pipeline, custom stages, deal tracking | `app/crm/[tenantId]/Deals/`, `app/api/deals/`, `app/api/crm/pipelines/custom/` |
| **AI lead scoring** | Multi-factor scoring, conversion probability, auto-update | `app/api/crm/leads/[id]/score/`, `lib/ai/lead-scoring/` |
| **Customer insights** | Health score, churn prediction, LTV | `app/api/crm/contacts/[id]/insights/`, `lib/ai/customer-health-scoring.ts`, `lib/ai/churn-predictor.ts` |
| **Proposals** | Create, send, accept/reject, public view | `app/api/proposals/`, `app/api/proposals/public/[token]/` |
| **CRM dashboard** | Stats, activity feed, custom widgets | `app/api/crm/dashboard/stats/`, `app/crm/[tenantId]/Home/` |
| **Notifications** | CRM notifications, read/unread, read-all | `app/api/crm/notifications/` |

### AI & Analytics

| Feature | Description | Key Files / APIs |
|--------|-------------|-------------------|
| **AI insights** | Business analysis, revenue insights, risk, recommendations | `app/api/ai/insights/`, `components/ai/SmartInsights.tsx` |
| **AI form suggestions** | Field and form suggestions | `app/api/ai/form-suggestions/` |
| **NL report generator** | Natural language → reports/charts | `app/api/ai/analytics/nl-query/`, `app/dashboard/analytics/ai-query/` |
| **Scenario / what-if** | Scenario planning, what-if analysis | `app/api/ai/analytics/scenario/`, `app/dashboard/analytics/scenario/`, `app/dashboard/what-if/` |
| **AI co-worker** | Suggestions and commands | `app/api/ai/co-worker/` |
| **Email AI** | Analyze, suggest reply, extract tasks | `app/api/email/analyze/`, `app/api/email/suggest-reply/`, `app/api/email/extract-tasks/` |
| **Invoice AI** | Generate from deal, suggest items, smart merge/reminders | `app/api/invoices/merge-suggestions/`, `app/api/invoices/[id]/smart-reminder/` |
| **AI governance** | Policies, audit trail | `app/api/ai/governance/`, `app/dashboard/developer/ai-governance/` |
| **Currency reporting** | Multi-currency analytics | `app/api/analytics/currency-reporting/` |

### Projects & Productivity

| Feature | Description | Key Files / APIs |
|--------|-------------|-------------------|
| **Projects & tasks** | Projects, tasks, assignments, Gantt | `app/projects/[tenantId]/`, `app/api/projects/`, `app/api/productivity/tasks/` |
| **Time tracking** | Log time, timesheets | `app/projects/[tenantId]/Time/` |
| **Workflows** | Visual builder, triggers, run, executions | `app/dashboard/workflows/`, `app/api/workflows/`, `app/api/workflows/[id]/run/`, `app/api/cron/run-workflows/` |
| **Goals** | Goals, progress updates | `app/api/goals/`, `app/api/goals/[id]/update-progress/` |
| **Custom dashboards** | Build and save custom dashboards | `app/api/dashboards/custom/`, `components/dashboard/CustomDashboardBuilder.tsx` |

### HR

| Feature | Description | Key Files / APIs |
|--------|-------------|-------------------|
| **HR dashboard** | HR stats and overview | `app/hr/[tenantId]/Home/`, `app/api/hr/dashboard/stats/` |
| **Leave** | Apply, balances, requests, policies | `app/hr/[tenantId]/Leave/`, `app/api/` (leave-related) |
| **Attendance** | Check-in, records | `app/hr/[tenantId]/Attendance/` |
| **Hiring & onboarding** | Hiring pipeline, employee onboarding | `app/hr/[tenantId]/Hiring/`, `app/hr/[tenantId]/Onboarding/` |
| **HR AI analytics** | AI-driven HR analytics | `app/api/hr/ai/analytics/` |

### Marketing & Communication

| Feature | Description | Key Files / APIs |
|--------|-------------|-------------------|
| **Marketing home** | Campaigns, segments, channels | `app/marketing/[tenantId]/Home/` |
| **Email** | Gmail/Outlook auth, connect, templates | `app/api/email/connect/`, `app/api/email/gmail/auth/`, `app/api/email/outlook/auth/` |
| **Calls & telephony** | Calls, FAQs, recordings, transcripts | `app/api/calls/`, `app/api/calls/faqs/` |
| **Voice agents** | AI voice agents, calls | `app/api/v1/voice-agents/[id]/calls/`, `app/dashboard/voice-demo/` |

### Admin & Platform

| Feature | Description | Key Files / APIs |
|--------|-------------|-------------------|
| **Multi-tenant** | Tenant isolation, subdomain, licensed modules | `prisma/schema.prisma` (Tenant), `lib/utils/tenant-routes.ts` |
| **Auth** | Login, register, JWT, refresh, RBAC, 2FA, Google OAuth | `app/api/auth/login/`, `app/api/auth/register/`, `app/api/auth/2fa/`, `app/api/auth/oauth/google/`, `app/login/`, `app/signup/`, `lib/auth/jwt.ts`, `lib/stores/auth.ts` |
| **Module gating** | License check, redirect if unlicensed | `components/modules/ModuleGate.tsx`, `lib/hooks/use-payaid-auth.ts` |
| **Developer portal** | API keys, webhooks, scopes, docs, sandbox | `app/dashboard/developer/`, `app/api/developer/` |
| **Marketplace** | Apps, install, reviews | `app/dashboard/marketplace/`, `app/api/marketplace/` |
| **Demo/seed data** | Seed demo business, ensure demo data | `app/api/admin/seed-demo-data/`, `prisma/seeds/demo/` |
| **Health** | Health and DB checks | `app/api/health/route.ts`, `app/api/health/db/` |

### Industry & Vertical

| Feature | Description | Key Files / APIs |
|--------|-------------|-------------------|
| **Restaurant** | Menu, orders, reservations, tables | `app/api/industries/restaurant/`, restaurant pages |
| **19+ industry modules** | Real estate, logistics, agriculture, construction, beauty, automotive, hospitality, legal, financial services, events, wholesale, healthcare, education, etc. | `lib/modules.config.ts`, `app/[industry]/[tenantId]/` routes |

---

## 3. User Benefits

- **Finance:** One place for GST invoices, multi-currency, tax rules, and payment links — less manual work and fewer errors; smart reminders and merge suggestions improve collection.
- **CRM:** Single view of contacts, leads, and deals with AI lead scoring and customer insights to prioritize follow-ups and reduce churn risk.
- **Operations:** Projects, tasks, time, and workflows in one platform so teams spend less time switching tools and more time executing.
- **AI:** NL reports, scenario planning, email assist, and invoice suggestions speed up decisions and routine tasks.
- **Scalability:** Module-based licensing and multi-tenant design let you start small and add CRM, HR, or industry modules as you grow.
- **India-first:** GST, INR default, and PayAid/Razorpay fit local payment and compliance needs.

**Use cases:** Services company (projects + invoicing + CRM); agency (deals, proposals, invoices); retail/restaurant (industry modules + POS/reservations); SMB consolidating spreadsheets and multiple apps into one Business OS.

---

## 4. User Registration & Onboarding

### Step-by-step

1. **Landing** — User visits `/` (landing). Can choose industry and/or tier; “Get Started” links to `/signup` (with optional `?industry=...&modules=...&tier=...`).
2. **Sign-up** — `/signup` (`app/signup/page.tsx`). Form: name, email, password, tenant name, subdomain. Subdomain: lowercase letters, numbers, hyphens only. Submit calls `register()` from `lib/stores/auth.ts`, which POSTs to `/api/auth/register` and stores token + user + tenant.
3. **Post-registration** — If URL had `industry` and/or `modules`, the app can call `/api/ai/analyze-industry` for recommended modules and enable selected modules for the tenant.
4. **First login** — User is logged in with token; redirect typically to `/home/[tenantId]` (tenant home).
5. **Tenant home** — `/home/[tenantId]` shows “All-in-One Business Platform”, tenant name, and a **Module Grid** of licensed/available modules (from `lib/modules.config.ts`). User clicks a module (e.g. CRM, Finance) to open that module’s home (e.g. `/crm/[tenantId]/Home/`).
6. **Module access** — Each module route is wrapped with `ModuleGate` (or equivalent). If the module isn’t licensed, user is redirected to `/home/[tenantId]` (or upgrade path).
7. **Discovery** — Optional feature tips (e.g. email sync, lead scoring, deal rot, workflows) via `FeatureDiscovery` component; state can be stored in `localStorage` (“dismissed-feature-tips”).

### UI elements (from code)

- Login: email, password, “Forgot password?”, link to Sign up (`/signup`).
- Signup: name, email, password, tenant name, subdomain; industry pre-fill when coming from landing with `?industry=`.
- Tenant home: header, welcome text, module grid (cards with icon, name, description), news sidebar.

Email verification is not implemented in the analyzed flow; account setup is “sign up → tenant + user created → redirect to home”.

---

## 5. User Flows & Workflows

### New user: first invoice and payment

1. Login (`/login`) → 2. Tenant home (`/home/[tenantId]`) → 3. Open Finance → 4. Invoices → 5. New Invoice (currency, line items, tax) → 6. Save/Send → 7. Optional: payment link / record payment → 8. View in Finance dashboard or Reports.

### CRM: lead to deal to proposal

1. Login → 2. CRM → 3. Leads → 4. Add/import lead (scoring can run via `POST /api/crm/leads/[id]/score`) → 5. Deals → 6. Create deal from lead, move stages in pipeline → 7. Proposals → 8. Create proposal, send, client views public link → 9. Accept/reject → 10. Optional: convert to invoice.

### Admin: enable module and manage tenant

1. Login as admin → 2. Tenant home or settings → 3. Module/license management (enable module for tenant) → 4. Users see new module in grid; `ModuleGate` allows access when licensed.

### Authentication and errors

- **Auth:** JWT in cookie/localStorage; refresh token supported (`lib/auth/jwt.ts`). Middleware or guards read token and set user/tenant; invalid/expired → redirect to `/login`. Optional `?redirect=` for post-login redirect.
- **Permissions:** RBAC: `getUserRoles`, `getUserPermissions` used on login (`app/api/auth/login/route.ts`). Permissions can gate API and UI by role (e.g. admin vs employee).
- **Errors:** Login returns 4xx/5xx with JSON `{ error, message }`; timeout (e.g. 5s prod) returns 504. Client shows message; signup shows validation errors (e.g. subdomain format).

### Roles (conceptual)

- **Admin/Owner:** Full tenant and module access, billing, developer portal, marketplace.
- **Employee:** Access to licensed modules and permitted features (contacts, deals, projects, etc.) per RBAC.
- **Client:** Typically external: proposal public link, payment link, portal views if implemented.

---

## 6. Technical Setup & Pending Items

### Current integrations (from codebase and env)

| Integration | Purpose | Env / config |
|------------|---------|-------------|
| **PostgreSQL / Supabase** | Primary DB | `DATABASE_URL` |
| **PayAid Payments** | Platform payments, webhooks | `PAYAID_*` (API key, salt, optional encryption, webhook secret) |
| **Razorpay** | Payment links | `app/api/integrations/razorpay/` (keys in env or tenant config) |
| **SendGrid** | Transactional email | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` |
| **Gmail / Outlook** | Email connect, sync | OAuth via `app/api/email/gmail/auth/`, `app/api/email/outlook/auth/` |
| **WATI** | WhatsApp | `WATI_API_KEY`, `WATI_BASE_URL` |
| **Exotel** | Telephony/SMS | `EXOTEL_*` |
| **AI: Groq / OpenAI / Hugging Face / Gemini / Ollama** | Chat, insights, NL, suggestions | `GROQ_API_KEY`, `OPENAI_API_KEY`, `HUGGINGFACE_*`, `GEMINI_API_KEY`, `OLLAMA_*` |
| **Bhashini / IndicParler** | TTS (e.g. voice) | `BHASHINI_API_KEY`, `INDICPARLER_TTS_URL` |
| **Tally** | Sync | `app/api/integrations/tally/` |
| **Redis** | Cache / rate limit (optional) | `REDIS_URL` |
| **Sentry** | Errors | `SENTRY_DSN` |
| **Upstash** | Rate limiting | Used in API routes |

### What you need to provide

- **Required:** `DATABASE_URL`, `JWT_SECRET` (and `JWT_REFRESH_SECRET` in production), `NEXT_PUBLIC_APP_URL` (and `APP_URL`).
- **Payments:** PayAid merchant keys/salt (and webhook URL + secret if using webhooks); Razorpay keys if using payment links.
- **Email:** SendGrid (or other provider) API key and from-address for invoices and notifications.
- **AI:** At least one of: Groq, OpenAI, Hugging Face, or Gemini for AI features; optionally Ollama for local.
- **Optional:** WATI (WhatsApp), Exotel (calls/SMS), Tally, Redis, Sentry, cron secret (`CRON_SECRET` for workflow cron), Bhashini/IndicParler for voice.

Copy `.env.example` to `.env` and fill the variables you need. Do not commit `.env`.

### Deployment

- **Local:** `npm install` → `npx prisma generate` → set `DATABASE_URL` → `npx prisma migrate dev` (or `db push`) → `npm run db:seed` (optional) → `npm run dev`. App: `http://localhost:3000`.
- **Production:** Set env in hosting (e.g. Vercel); run `prisma migrate deploy` (or equivalent); `npm run build` and `npm run start`. Use `NEXT_PUBLIC_APP_URL` and `APP_URL` for canonical URL and callbacks.
- **Demo data:** `GET/POST /api/admin/seed-demo-data` (with auth) or script `npm run seed:demo-business` to create demo tenant and data for demos.

---

## 7. Demo Guide

### 5–10 minute script

1. **Intro (1 min)** — “PayAid V3 is a single Business OS: CRM, finance, projects, HR, AI, and industry modules. We’ll log in and walk through CRM, one invoice, and AI insights.”
2. **Login & home (1 min)** — Open `/login`, sign in with demo account (e.g. seed user). Land on `/home/[tenantId]`. “This is the tenant home; every card is a module. Access is controlled by license.”
3. **CRM (2 min)** — Open CRM → Contacts: show list and a contact. Open Deals: show pipeline, move a deal. Optional: show lead scoring or customer insights if data exists. “Leads and deals in one place; AI scores leads and highlights risk.”
4. **Finance (2 min)** — Open Finance → Invoices. Create invoice: pick currency, add line items, tax. Save/send. “GST-ready, multi-currency; we can send payment links or record payments.”
5. **AI (2 min)** — Open AI Insights or Dashboard → show insights panel / NL query / scenario. “You can ask questions in plain language and run what-if scenarios.”
6. **Wrap (1 min)** — Back to tenant home. “Modules like HR, Projects, Workflows, and industry packs follow the same pattern. We can enable more modules per tenant.”

### Preparation

- **Seed data:** Run demo seed so tenant has contacts, deals, and optional invoices. Use `seed-demo-data` API or `seed:demo-business` script.
- **Test account:** One known email/password for demo (e.g. `admin@demo.com` from README).
- **Stable env:** Ensure DB and key env vars (especially `DATABASE_URL`, `JWT_SECRET`) are set so login and modules load.

### Pitfalls and Q&A

- **Timeout on login:** Increase server timeout in dev or reduce cold start (e.g. keep DB connection warm). Show “Try again” if 504.
- **Module not visible or “not licensed”:** Confirm tenant’s `licensedModules` includes that module; show ModuleGate redirect and explain licensing.
- **“How do we add users?”** — Today: admin creates users (or via seed); SSO/OAuth is referenced for future.
- **“Pricing?”** — Point to plan/tier on landing and “per-module” messaging; exact pricing is commercial.
- **“Data residency / security?”** — Data in your DB (e.g. Supabase region); JWT, RBAC, and webhook verification in place; refer to security checklist if available.

---

## 8. Pitching & Explaining the Platform

### Elevator pitch (30 seconds)

“PayAid V3 is a single Business OS for SMBs: CRM, invoicing, payments, projects, HR, and AI in one place. You choose the modules you need, get GST and multi-currency out of the box, and use AI for insights and automation. It’s built to replace spreadsheets and multiple tools so you can run the business from one dashboard.”

### Sales narrative (2–3 paragraphs)

**Problem:** Teams waste time switching between CRM, billing, projects, and support tools. Invoicing and tax are manual; payments and reminders are scattered. Scaling means more apps and more complexity.

**Solution:** PayAid V3 is one platform: one login, one tenant, many modules. Finance is GST-aware and multi-currency; CRM has pipelines, lead scoring, and customer health; workflows and goals sit next to projects and time. AI powers natural-language reports, scenario planning, and smarter reminders and suggestions. You license only the modules you need and add more as you grow.

**ROI:** Less time on data entry and reconciliation, faster quotes and invoices, better collection with smart reminders, and one place for reporting and decisions. Implementation is fast (sign up, pick modules, start using) compared to integrating several standalone products.

### FAQ (from codebase)

- **Pricing:** Subscription/tier and per-module; see landing and plan selection (`app/page.tsx`).
- **Scalability:** Multi-tenant, Prisma/PostgreSQL; add tenants and modules; optional Redis for cache.
- **Security:** JWT + refresh, RBAC, webhook verification, bcrypt passwords; no secrets in client.
- **Customization:** Custom fields, custom dashboards, workflow builder, tenant-level settings (currency, tax, branding).
- **Integrations:** PayAid, Razorpay, SendGrid, Gmail/Outlook, WATI, Exotel, Tally; developer API and webhooks for more.

---

## 9. Next Steps & Roadmap

### Suggested improvements (from code analysis)

- **Auth:** Add email verification after sign-up and a proper “forgot password” flow (currently link may exist; backend flow to confirm).
- **Registration API:** Ensure `/api/auth/register` exists and is wired to the same schema as login (User, Tenant, password hash).
- **Proposals → Invoice:** Automate “accept proposal → create invoice” so it’s one click.
- **Recurring and reminders:** Run recurring expense generation and overdue reminder jobs via cron (`CRON_SECRET` + `/api/cron/run-workflows` or dedicated routes).
- **Customer insights migration:** Run `MANUAL_SQL_MIGRATION_CUSTOMER_INSIGHTS.sql` if not already applied so customer insights and churn features work against the DB.
- **E2E tests:** Use existing Playwright setup to add critical paths (login → home → CRM → create deal; create invoice; run workflow).
- **Docs:** Centralize env vars in one “Environment variables” doc; add a one-page “Roles and permissions” for sales/support.

### Scalability

- **DB:** Indexes on tenantId, userId, and frequently filtered fields; use connection pooling (e.g. Supabase pooler) in production.
- **API:** Rate limiting (Upstash) and caching (Redis) where needed; keep heavy AI or report jobs async or behind queue.
- **Frontend:** Module and route code-splitting (Next.js); lazy-load heavy components (e.g. Gantt, custom dashboard builder).

---

## Files to Check or Add for Completeness

| Item | Purpose |
|------|--------|
| `app/api/auth/register/route.ts` | Exists; confirm request/response matches `auth.store` `register()` and Prisma User/Tenant creation. |
| `.env.example` | Ensure it lists every variable used in the app (PayAid, Razorpay, SendGrid, AI, DB, JWT, cron, etc.) with short comments. |
| `LAUNCH_CHECKLIST.md` / `SECURITY_CHECKLIST.md` | Referenced in README; keep updated for go-live and security review. |
| `docs/ENVIRONMENT_VARIABLES.md` | Single reference of all env vars, required vs optional, and where to get keys. |
| `docs/ROLES_AND_PERMISSIONS.md` | One-pager on admin vs employee vs client and which modules/APIs each can use. |
| Demo seed script / doc | One-command or one-page “How to seed demo data for a tenant” for sales/QA. |
| Password reset flow | If “Forgot password?” exists in UI, ensure reset request and reset-complete APIs and pages exist. |

---

*End of document. Use this for demos, sales, and internal onboarding.*

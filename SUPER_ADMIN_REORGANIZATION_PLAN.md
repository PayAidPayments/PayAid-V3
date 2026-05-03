# Super Admin Console Reorganization Plan

## 🎯 Core Principle: "Simple but Deep"
- **6-8 top-level navigation groups** instead of 30+ sidebar items
- **Sub-tabs within pages** for related functionality
- **No metric duplication** - each metric appears in max 2 places
- **Clear purpose** - one-line description for each section

---

## 📋 New Navigation Structure

### 1. **Business & Merchants** (`/super-admin/business`)
**Purpose**: Everything about merchants, tenants, users, onboarding

**Sub-tabs:**
- **Tenants** - List, create, edit tenants
- **Merchants** - Merchant-specific views
- **Platform Users** - All users across tenants
- **Tenant Health** - Health monitoring dashboard
- **Onboarding** - Combined onboarding management
  - Queue
  - Applications
  - KYC Verification
  - Progress
  - Analytics
- **Communication** - Broadcast messages, system notices

---

### 2. **Revenue & Billing** (`/super-admin/revenue`)
**Purpose**: Money flowing through the platform and how you charge for it

**Sub-tabs:**
- **Revenue & Payments** - Platform-wide volume, fees, payout stats
- **Billing** - Plans/invoices for merchants
- **Plans & Modules** - Entitlements by plan
- **Merchant Analytics** - Revenue and usage by merchant
- **Reports & Exports** - Financial and operational CSV/PDF exports

---

### 3. **Configuration** (`/super-admin/configuration`)
**Purpose**: How the platform behaves: modules, flags, integrations

**Sub-tabs:**
- **Feature Flags** - Feature toggle management
- **Platform Settings** - Fees, trial length, branding, tax, defaults
- **Integrations & API** - WhatsApp provider, email provider, gateways, webhooks
- **API Key Oversight** - Global view of keys, last used, revoke actions
- **Mobile & WhatsApp** - Templates, policies, limits

---

### 4. **Risk & Security** (`/super-admin/risk-security`)
**Purpose**: Fraud, compliance, security controls

**Sub-tabs:**
- **Risk Assessment** - Merchant risk scoring, risk rules
- **Compliance** - KYC/KYB policies, regulator exports
- **Security & Compliance** - MFA adoption, suspicious logins, IP restrictions
- **Audit Log** - All super-admin and admin sensitive actions

---

### 5. **Operations** (`/super-admin/operations`)
**Purpose**: Health, infrastructure, jobs, AI, communications

**Sub-tabs:**
- **System Health** - API, queues, third-party services
- **Database & Backups** - Database management
- **AI & Automations** - AI usage/errors, automation jobs
- **Communication** - Status page messages, in-app notifications

---

### 6. **PayAid Payments** (`/super-admin/payaid-payments`)
**Purpose**: PayAid's own tenant data (separate section)

**Sub-tabs:**
- Open PayAid's own CRM/Billing/Admin dashboards directly

---

## 🚀 Missing Features to Add

### 1. **Global Search** ⚠️ HIGH PRIORITY
- Search bar visible on every super-admin page
- Search: merchants, users, transactions, invoices, contacts, tenants
- Quick results with direct links

### 2. **Bulk Actions** ⚠️ HIGH PRIORITY
- On every table: bulk select, bulk actions
- Examples: suspend merchants, resend emails, revoke keys
- Primary CTAs on important cards

### 3. **Risk-Scored Views** ⚠️ HIGH PRIORITY
- "At-risk merchants" list combining:
  - Chargebacks, failed payments, KYC issues, new location logins
- Tag merchants: "monitor", "freeze payouts"

### 4. **AI-Powered Admin Assistant** ⚠️ MEDIUM PRIORITY
- Panel on right/bottom
- Summarizes "what changed in last 24h"
- Answers questions: "Which merchants should I review today?"
- Cross-module intelligence

### 5. **Task/Operations Queue** ⚠️ MEDIUM PRIORITY
- Not just onboarding:
  - KYC to be reviewed
  - Plan change requests
  - Data export requests
  - Compliance tickets

### 6. **Per-Environment Controls** ⚠️ MEDIUM PRIORITY
- Separation: Production, Staging, Sandbox
- Manage test merchants distinctly

### 7. **Configuration Diff / Change History** ⚠️ HIGH PRIORITY
- In Plans, Feature Flags, Settings
- Show "who changed what and when"
- See previous values, rollback capability

---

## 🏠 Enhanced Landing Page Structure

### **Band 1 – Global KPIs + AI Summary**
- Total Merchants, Active Users, MRR, Churn
- **AI Summary Card**: "In the last 24h: 2 new merchants, 1 at-risk merchant, API errors increased by 14%, WhatsApp usage flat."

### **Band 2 – Revenue & Merchant Health**
- Revenue cards by channel (Card, Bank, WhatsApp)
- Merchant health cards (New, At Risk, High Volume, Failed Payments) - **clickable to drill down**

### **Band 3 – Platform Health & AI**
- API uptime, WhatsApp messages, AI calls, Critical alerts
- **Top 5 error types** (click to System Health)
- **Recent major changes** (plan changes, feature flags toggled)

### **Band 4 – Module Adoption & Funnels**
- Module adoption chart
- AI usage chart
- **Onboarding funnel** (applications → KYC started → approved → first payment)

### **Bottom – Recent Activity Timeline**
- Merchant X onboarded
- Tenant Y upgraded to Growth
- API key revoked for merchant Z
- Feature flag "new-dashboard" turned on

---

## 📝 Implementation Checklist

### Phase 1: Navigation Restructure
- [ ] Create new page structure with sub-tabs
- [ ] Update sidebar to show 6-8 main items
- [ ] Migrate existing pages to sub-tabs
- [ ] Update routing

### Phase 2: Missing Features
- [ ] Global search component
- [ ] Bulk actions on all tables
- [ ] Risk-scored merchant views
- [ ] Configuration change history
- [ ] Task/operations queue

### Phase 3: Enhanced Overview
- [ ] AI summary card
- [ ] Clickable health cards
- [ ] Top error types
- [ ] Recent changes feed
- [ ] Onboarding funnel chart
- [ ] Activity timeline

### Phase 4: Polish
- [ ] Environment separation
- [ ] AI admin assistant panel
- [ ] Documentation updates

---

## 🎯 Success Metrics

- **Navigation items**: Reduced from 30+ to 6-8
- **Time to find feature**: < 2 clicks
- **Metric duplication**: Max 2 places per metric
- **User satisfaction**: Clear, intuitive structure

---

## 📚 One-Line Purpose Statements

- **Business Management** → "Everything about merchants, tenants, users, onboarding."
- **Revenue & Billing** → "Money flowing through the platform and how you charge for it."
- **Configuration** → "How the platform behaves: modules, flags, integrations."
- **Risk & Security** → "Fraud, compliance, security controls."
- **Operations** → "Health, infrastructure, jobs, AI, communications."
- **PayAid Payments** → "Our own tenant data."

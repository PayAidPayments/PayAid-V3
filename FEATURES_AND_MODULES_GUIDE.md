# PayAid V3 - Complete Features & Modules Guide

**Last Updated:** December 29, 2025  
**Platform URL:** https://payaid-v3.vercel.app

---

## 📊 **Dashboard Overview**

**Location:** `/dashboard` or `/dashboard/[tenantId]`

The main dashboard provides:
- Real-time statistics (Contacts, Deals, Orders, Invoices, Tasks)
- Interactive charts (Sales Performance, Revenue Trends, Market Share)
- Clickable cards linking to detailed pages
- Business health metrics
- Recent activity feed

---

## 🎯 **8 Primary Modules**

### **1. CRM Module** (`crm`)

**Access:** Main navigation sidebar

#### **Contacts Management**
- **List View:** `/dashboard/contacts`
- **View Contact:** `/dashboard/contacts/[id]`
- **Edit Contact:** `/dashboard/contacts/[id]/edit`
- **New Contact:** `/dashboard/contacts/new`
- **Features:** Full CRUD, lead scoring, interaction history

#### **Deals Pipeline**
- **Kanban Board:** `/dashboard/deals`
- **View Deal:** `/dashboard/deals/[id]`
- **Edit Deal:** `/dashboard/deals/[id]/edit`
- **New Deal:** `/dashboard/deals/new`
- **Features:** Pipeline stages, deal tracking, conversion analytics

#### **Tasks**
- **Task List:** `/dashboard/tasks`
- **View Task:** `/dashboard/tasks/[id]`
- **New Task:** `/dashboard/tasks/new`
- **Features:** Task assignment, due dates, status tracking

#### **Products** (Shared with Sales)
- **Product Catalog:** `/dashboard/products`
- **View Product:** `/dashboard/products/[id]`
- **Edit Product:** `/dashboard/products/[id]/edit`
- **New Product:** `/dashboard/products/new`
- **Features:** Inventory tracking, GST rates, HSN codes

#### **Orders** (Shared with Sales)
- **Order List:** `/dashboard/orders`
- **View Order:** `/dashboard/orders/[id]`
- **New Order:** `/dashboard/orders/new`
- **Features:** Order tracking, fulfillment, GST calculation

---

### **2. Sales Module** (`sales`)

**Access:** Sales section in sidebar

#### **Landing Pages**
- **List:** `/dashboard/landing-pages`
- **View:** `/dashboard/landing-pages/[id]`
- **New:** `/dashboard/landing-pages/new`
- **Features:** Lead generation pages, conversion tracking

#### **Checkout Pages**
- **List:** `/dashboard/checkout-pages`
- **View:** `/dashboard/checkout-pages/[id]`
- **New:** `/dashboard/checkout-pages/new`
- **Features:** Payment integration, order processing

---

### **3. Marketing Module** (`marketing`)

**Access:** Marketing section in sidebar

#### **Campaigns**
- **Campaign List:** `/dashboard/marketing/campaigns`
- **View Campaign:** `/dashboard/marketing/campaigns/[id]`
- **Create Campaign:** `/dashboard/marketing/campaigns/new`
- **Features:** Email, WhatsApp, SMS campaigns, scheduling, analytics

#### **Social Media**
- **Social Hub:** `/dashboard/marketing/social`
- **Create Post:** `/dashboard/marketing/social/create-post`
- **Create Image:** `/dashboard/marketing/social/create-image`
- **Schedule Posts:** `/dashboard/marketing/social/schedule`
- **Features:** AI post generation, image generation, scheduling

#### **Email Templates**
- **Template List:** `/dashboard/email-templates`
- **View Template:** `/dashboard/email-templates/[id]`
- **New Template:** `/dashboard/email-templates/new`
- **Features:** Template editor, variable substitution

#### **Events**
- **Event List:** `/dashboard/events`
- **View Event:** `/dashboard/events/[id]`
- **New Event:** `/dashboard/events/new`
- **Features:** Event management, registration tracking

#### **WhatsApp Integration**
- **Setup:** `/dashboard/whatsapp/setup`
- **Accounts:** `/dashboard/whatsapp/accounts`
- **Inbox:** `/dashboard/whatsapp/inbox`
- **Sessions:** `/dashboard/whatsapp/sessions`
- **Features:** Message sending, template management, conversation tracking

---

### **4. Finance Module** (`finance`)

**Access:** Main navigation + Sales & Operations section

#### **Invoicing**
- **Invoice List:** `/dashboard/invoices`
- **View Invoice:** `/dashboard/invoices/[id]`
- **Edit Invoice:** `/dashboard/invoices/[id]/edit`
- **New Invoice:** `/dashboard/invoices/new`
- **Features:** GST-compliant invoices, payment links, auto GST calculation

#### **Accounting**
- **Accounting Hub:** `/dashboard/accounting`
- **Expenses:**
  - **List:** `/dashboard/accounting/expenses`
  - **New Expense:** `/dashboard/accounting/expenses/new`
  - **Reports:** `/dashboard/accounting/expenses/reports`
  - **Features:** Expense tracking, approval workflows, budget tracking
- **Reports:**
  - **Revenue Dashboard:** `/dashboard/accounting/reports/revenue`
  - **Expense Dashboard:** `/dashboard/accounting/reports/expenses`
  - **Reports Hub:** `/dashboard/accounting/reports`
  - **Features:** Interactive charts, breakdowns, trends

#### **GST Reports**
- **GSTR-1:** `/dashboard/gst/gstr-1` (Outward Supplies)
- **GSTR-3B:** `/dashboard/gst/gstr-3b` (Summary Return)
- **GST Hub:** `/dashboard/gst`
- **Features:** Excel export, GST filing data

---

### **5. HR Module** (`hr`)

**Access:** HR & Payroll section in sidebar

#### **Employee Management**
- **Employee List:** `/dashboard/hr/employees`
- **View Employee:** `/dashboard/hr/employees/[id]`
- **Features:** Employee profiles, salary structures, tax declarations

#### **Hiring**
- **Job Requisitions:**
  - **List:** `/dashboard/hr/hiring/job-requisitions`
  - **View:** `/dashboard/hr/hiring/job-requisitions/[id]`
  - **New:** `/dashboard/hr/hiring/job-requisitions/new`
- **Candidates:**
  - **List:** `/dashboard/hr/hiring/candidates`
  - **View:** `/dashboard/hr/hiring/candidates/[id]`
  - **New:** `/dashboard/hr/hiring/candidates/new`
- **Interviews:**
  - **List:** `/dashboard/hr/hiring/interviews`
  - **New:** `/dashboard/hr/hiring/interviews/new`
- **Offers:**
  - **List:** `/dashboard/hr/hiring/offers`
  - **New:** `/dashboard/hr/hiring/offers/new`

#### **Payroll**
- **Payroll Cycles:**
  - **List:** `/dashboard/hr/payroll/cycles`
  - **View:** `/dashboard/hr/payroll/cycles/[id]`
  - **New:** `/dashboard/hr/payroll/cycles/new`
- **Payroll Runs:**
  - **View:** `/dashboard/hr/payroll/runs/[id]`
- **Salary Structures:**
  - **List:** `/dashboard/hr/payroll/salary-structures`
  - **New:** `/dashboard/hr/payroll/salary-structures/new`
- **Reports:** `/dashboard/hr/payroll/reports`

#### **Leave Management**
- **Leave Requests:** `/dashboard/hr/leave/requests`
- **Leave Balances:** `/dashboard/hr/leave/balances`
- **Apply Leave:** `/dashboard/hr/leave/apply`

#### **Attendance**
- **Calendar View:** `/dashboard/hr/attendance/calendar`
- **Check-In:** `/dashboard/hr/attendance/check-in`

#### **Onboarding**
- **Templates:**
  - **List:** `/dashboard/hr/onboarding/templates`
  - **View:** `/dashboard/hr/onboarding/templates/[id]`
  - **New:** `/dashboard/hr/onboarding/templates/new`
- **Instances:** `/dashboard/hr/onboarding/instances`

#### **Tax Declarations**
- **List:** `/dashboard/hr/tax-declarations`
- **View:** `/dashboard/hr/tax-declarations/[id]`
- **New:** `/dashboard/hr/tax-declarations/new`

---

### **6. Communication Module** (`communication`)

**Access:** Communication section in sidebar

#### **Email**
- **Email Accounts:** `/dashboard/email/accounts`
- **Webmail:** `/dashboard/email/webmail`
- **Features:** Email integration, inbox management

#### **Team Chat**
- **Chat Hub:** `/dashboard/chat`
- **Features:** Real-time messaging, channels, workspaces

---

### **7. AI Studio Module** (`ai-studio`)

**Access:** AI Studio section in sidebar

#### **AI Co-founder**
- **Chat Interface:** `/dashboard/cofounder`
- **Features:** 22 specialist agents, conversation memory, action converter

#### **AI Chat**
- **Chat Interface:** `/dashboard/ai/chat`
- **Features:** Multi-provider AI (Groq, Ollama, Hugging Face)

#### **AI Insights**
- **Insights Dashboard:** `/dashboard/ai/insights`
- **Features:** Business analysis, revenue insights, risk warnings

#### **AI Test**
- **Test Interface:** `/dashboard/ai/test`
- **Features:** AI service testing, provider comparison

#### **Website Builder**
- **Website List:** `/dashboard/websites`
- **View Website:** `/dashboard/websites/[id]`
- **Builder:** `/dashboard/websites/[id]/builder`
- **Preview:** `/dashboard/websites/[id]/preview`
- **Page Preview:** `/dashboard/websites/[id]/pages/[pageId]/preview`
- **New Website:** `/dashboard/websites/new`
- **Features:** AI-powered component generation, templates, live preview

#### **Logo Generator**
- **Logo List:** `/dashboard/logos`
- **View Logo:** `/dashboard/logos/[id]`
- **Features:** AI logo generation, variations

#### **AI Calling Bot**
- **Call List:** `/dashboard/calls`
- **View Call:** `/dashboard/calls/[id]`
- **FAQs:** `/dashboard/calls/faqs`
- **Features:** AI-powered calling, conversation tracking

---

### **8. Analytics & Reporting Module** (`analytics`)

**Access:** Sales & Operations section + Reports & Tools section

#### **Analytics Dashboard**
- **Main Analytics:** `/dashboard/analytics`
- **Lead Sources:** `/dashboard/analytics/lead-sources`
- **Team Performance:** `/dashboard/analytics/team-performance`
- **Features:** Business metrics, performance tracking

#### **Custom Reports**
- **Report Builder:** `/dashboard/reports/custom`
- **Features:** Custom report creation, data visualization

#### **Custom Dashboards**
- **Dashboard Builder:** `/dashboard/dashboards/custom`
- **Features:** Custom dashboard creation, widget management

#### **Stats Drill-Down Pages**
- **Revenue:** `/dashboard/[tenantId]/stats/revenue` or `/dashboard/stats/revenue`
- **Pipeline:** `/dashboard/[tenantId]/stats/pipeline` or `/dashboard/stats/pipeline`
- **Contacts:** `/dashboard/[tenantId]/stats/contacts` or `/dashboard/stats/contacts`
- **Deals:** `/dashboard/[tenantId]/stats/deals` or `/dashboard/stats/deals`
- **Orders:** `/dashboard/[tenantId]/stats/orders` or `/dashboard/stats/orders`
- **Invoices:** `/dashboard/[tenantId]/stats/invoices` or `/dashboard/stats/invoices`
- **Tasks:** `/dashboard/[tenantId]/stats/tasks` or `/dashboard/stats/tasks`
- **Features:** Detailed breakdowns, calculation explanations, recent items

---

## 🏭 **Industry-Specific Modules**

**Access:** Industries section (when applicable)

### **Restaurant Module**
- **Kitchen Display:** `/dashboard/industries/restaurant/kitchen`
- **Menu Management:** `/dashboard/industries/restaurant/menu`
- **Orders:** `/dashboard/industries/restaurant/orders`
- **Features:** QR menu, kitchen display system, order management

### **Retail Module**
- **Products:** `/dashboard/industries/retail/products`
- **Features:** POS system, inventory management, barcode scanning

### **Industry Setup**
- **Industry Selection:** `/dashboard/setup/industry`
- **Industries Hub:** `/dashboard/industries`

---

## ⚙️ **Settings & Configuration**

**Access:** Settings (bottom of sidebar)

### **User Settings**
- **Profile:** `/dashboard/settings/profile`
- **Features:** Name, email, password, preferences

### **Business Settings**
- **Tenant Settings:** `/dashboard/settings/tenant`
- **Features:** Business name, address, GST number, API keys

### **Module Settings**
- **AI Integrations:** `/dashboard/settings/ai`
  - **Features:** Google AI Studio API key, encryption, image generation settings
- **Invoice Settings:** `/dashboard/settings/invoices`
- **Payment Gateway:** `/dashboard/settings/payment-gateway`
- **Sales Reps:** `/dashboard/settings/sales-reps`
- **KYC:** `/dashboard/settings/kyc`

---

## 👨‍💼 **Admin Features**

**Access:** Module Management (admin only)

### **Admin Panel**
- **Module Management:** `/dashboard/admin/modules`
  - **Features:** Enable/disable modules, license management
- **Tenant Management:**
  - **List:** `/dashboard/admin/tenants`
  - **View:** `/dashboard/admin/tenants/[tenantId]`
- **Revenue Dashboard:** `/dashboard/admin/revenue`

---

## 📱 **Additional Features**

### **Billing**
- **Billing Hub:** `/dashboard/billing`
- **Features:** Subscription management, payment history

### **Marketing Analytics**
- **Analytics Dashboard:** `/dashboard/marketing/analytics`
- **Features:** Campaign performance, ROI tracking

### **Marketing Segments**
- **Segment List:** `/dashboard/marketing/segments`
- **Features:** Customer segmentation, targeting

---

## 🔗 **Quick Access Links**

### **Most Used Features**
1. **Dashboard:** `/dashboard` or `/dashboard/[tenantId]`
2. **Contacts:** `/dashboard/contacts` or `/dashboard/[tenantId]/contacts`
3. **Deals:** `/dashboard/deals` or `/dashboard/[tenantId]/deals`
4. **Invoices:** `/dashboard/invoices` or `/dashboard/[tenantId]/invoices`
5. **AI Co-founder:** `/dashboard/cofounder` or `/dashboard/[tenantId]/cofounder`

### **New Features (Recently Added)**
1. **Expense Management:** `/dashboard/accounting/expenses`
2. **Revenue Dashboard:** `/dashboard/accounting/reports/revenue`
3. **Expense Dashboard:** `/dashboard/accounting/reports/expenses`
4. **Stats Drill-Down:** `/dashboard/[tenantId]/stats/[statType]`
5. **Image Generation:** `/dashboard/marketing/social/create-image`
6. **Media Library:** Integrated in social media post creation

---

## 📊 **Module Completion Status**

### ✅ **100% Complete**
- CRM Module
- E-commerce Module
- Invoicing Module
- Payment Integration
- AI Services
- Dashboard & Analytics
- Media Library
- Settings & Configuration

### 🟡 **Partially Complete (50-80%)**
- HR Module (Backend: 80%, Frontend: 40%)
- Marketing Module (Backend: 100%, Frontend: 60%)
- GST Reports (Backend: 100%, Frontend: 0%)
- Industry Modules (50-70%)

### ❌ **Not Yet Implemented**
- Project Management
- Purchase Orders & Vendor Management
- Advanced Reporting (Custom Report Builder)
- Subscription/Recurring Billing
- Mobile App

---

## 🎯 **How to Access Features**

1. **From Sidebar:** All modules are organized in the left sidebar navigation
2. **From Dashboard:** Click on any card to navigate to detailed pages
3. **Direct URL:** Use the URLs listed above (tenant-aware routing supported)
4. **Module Licensing:** Some features require module activation (see Admin > Module Management)

---

## 📝 **Notes**

- All routes support tenant-aware URLs: `/dashboard/[tenantId]/[path]`
- Module licensing controls access to specific features
- Admin users can manage modules from `/dashboard/admin/modules`
- Settings are always accessible regardless of module licensing

---

*For detailed feature documentation, see `PLATFORM_STATUS_REPORT.md`*


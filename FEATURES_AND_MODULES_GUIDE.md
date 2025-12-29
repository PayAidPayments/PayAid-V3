# PayAid V3 - Complete Features & Modules Guide

**Last Updated:** December 29, 2025  
**Platform URL:** https://payaid-v3.vercel.app  
**Version:** 3.0 (Latest)

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

#### **Projects** ✅ **NEW**
- **Project List:** `/dashboard/projects`
- **View Project:** `/dashboard/projects/[id]`
- **New Project:** `/dashboard/projects/new`
- **Features:**
  - Project tracking with status (Planning, In Progress, On Hold, Completed, Cancelled)
  - Task management with dependencies
  - Time tracking with billable hours
  - Budget vs actual cost tracking
  - Progress tracking (0-100%)
  - Team member management
  - Priority levels (Low, Medium, High, Urgent)

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

#### **Purchase Orders & Vendor Management** ✅ **NEW**
- **Vendors:**
  - **List:** `/dashboard/purchases/vendors`
  - **New Vendor:** `/dashboard/purchases/vendors/new`
  - **View Vendor:** `/dashboard/purchases/vendors/[id]`
  - **Features:** Vendor master, GSTIN, PAN, payment terms, ratings
- **Purchase Orders:**
  - **List:** `/dashboard/purchases/orders`
  - **New PO:** `/dashboard/purchases/orders/new`
  - **View PO:** `/dashboard/purchases/orders/[id]`
  - **Features:** PO creation, approval workflow, goods receipt tracking, GST calculation

#### **GST Reports**
- **GSTR-1:** `/dashboard/gst/gstr-1` (Outward Supplies)
- **GSTR-3B:** `/dashboard/gst/gstr-3b` (Summary Return)
- **GST Hub:** `/dashboard/gst`
- **Features:** Excel export, GST filing data, proper currency formatting

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

#### **Advanced Reporting** ✅ **NEW**
- **Report List:** `/dashboard/reports`
- **Create Report:** `/dashboard/reports/new`
- **View Report:** `/dashboard/reports/[id]`
- **Execute Report:** `/dashboard/reports/[id]/execute`
- **Features:**
  - Custom report builder with data source selection
  - Multiple data sources (Contacts, Deals, Invoices, Orders, Expenses)
  - Field selection and filtering
  - Export to JSON, CSV
  - Report templates (framework ready)
  - Scheduled reports (framework ready)
  - Public/private report sharing

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

### **Restaurant Module** ✅ **Enhanced**
- **Kitchen Display:** `/dashboard/industries/restaurant/kitchen`
- **Menu Management:** `/dashboard/industries/restaurant/menu`
- **Orders:** `/dashboard/industries/restaurant/orders`
- **Table Management:** `/dashboard/industries/restaurant/tables` ✅ **NEW**
- **Reservations:** `/dashboard/industries/restaurant/reservations` ✅ **NEW**
- **Features:**
  - QR menu generation
  - Kitchen display system
  - Order management
  - Table status tracking (Available, Occupied, Reserved, Out of Service)
  - Reservation system with customer details
  - Invoice generation from orders
  - Table assignment and conflict checking

### **Retail Module**
- **Products:** `/dashboard/industries/retail/products`
- **Features:** POS system, inventory management, barcode scanning

### **Manufacturing Module**
- **Production Orders:** `/dashboard/industries/manufacturing/production-orders`
- **Material Management:** `/dashboard/industries/manufacturing/materials`
- **BOM (Bill of Materials):** `/dashboard/industries/manufacturing/bom`
- **Quality Control:** `/dashboard/industries/manufacturing/quality`
- **Features:** Production tracking, material management, BOM, QC

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
1. **Project Management:** `/dashboard/projects` ✅ **NEW**
   - Project tracking, task management, time logging, budget tracking
2. **Purchase Orders:** `/dashboard/purchases/orders` ✅ **NEW**
   - Vendor management, PO workflow, goods receipt tracking
3. **Advanced Reporting:** `/dashboard/reports` ✅ **NEW**
   - Custom report builder, multiple data sources, export functionality
4. **Expense Management:** `/dashboard/accounting/expenses`
5. **Revenue Dashboard:** `/dashboard/accounting/reports/revenue`
6. **Expense Dashboard:** `/dashboard/accounting/reports/expenses`
7. **Stats Drill-Down:** `/dashboard/[tenantId]/stats/[statType]`
8. **Image Generation:** `/dashboard/marketing/social/create-image`
9. **Media Library:** Integrated in social media post creation
10. **Restaurant Tables:** `/dashboard/industries/restaurant/tables` ✅ **NEW**
11. **Restaurant Reservations:** `/dashboard/industries/restaurant/reservations` ✅ **NEW**

---

## 📊 **Module Completion Status**

### ✅ **100% Complete**
- **CRM Module** - Contacts, Deals, Tasks, Products, Orders
- **Sales Module** - Landing Pages, Checkout Pages
- **Marketing Module** - Campaigns, Social Media, Email Templates, WhatsApp Integration
- **Finance Module** - Invoicing, Accounting, Expenses, GST Reports
- **Project Management** ✅ **NEW** - Projects, Tasks, Time Tracking, Budget Management
- **Purchase Orders & Vendor Management** ✅ **NEW** - Vendors, POs, Goods Receipt, Ratings
- **Advanced Reporting** ✅ **NEW** - Custom Report Builder, Multiple Data Sources, Export
- **PDF Generation** - Invoice PDFs, Payslip PDFs, GST-compliant formatting
- **Payment Integration** - PayAid Payments Gateway
- **AI Services** - AI Co-founder, AI Chat, Image Generation, Website Builder
- **Dashboard & Analytics** - Real-time stats, interactive charts, drill-down pages
- **Media Library** - Image storage and management
- **Settings & Configuration** - User settings, tenant settings, module management
- **Restaurant Module** ✅ **Enhanced** - Complete with Tables, Reservations, Billing Integration

### 🟡 **Partially Complete (50-90%)**
- **HR Module** (Backend: 80%, Frontend: 100%) ✅ **Enhanced** - All pages functional
  - Employee Management ✅
  - Attendance Calendar ✅
  - Leave Requests ✅
  - Payroll Cycles ✅
  - Hiring Workflow ✅
- **Retail Module** (70%) - POS, Inventory, Barcode scanning
  - ⏳ Missing: Receipt printing, Loyalty program
- **Manufacturing Module** (70%) - Production orders, Materials, BOM, QC
  - ⏳ Missing: Advanced scheduling, Supplier management
- **Email Integration** (60%) - SendGrid configured
  - ⏳ Missing: Full Gmail API, bounce handling, template management UI
- **SMS Integration** (50%) - Twilio/Exotel placeholders
  - ⏳ Missing: Full implementation, delivery reports, opt-out management

### ❌ **Not Yet Implemented**
- **Subscription/Recurring Billing** - Auto-renewal, dunning management, churn prediction
- **Mobile App** - iOS/Android native apps
- **Advanced Inventory Management** - Multi-warehouse, stock transfers, forecasting
- **Contracts & Document Management** - E-signatures, version control
- **Field Service Management** - Technician scheduling, GPS tracking
- **Asset Management** - Asset tracking, depreciation
- **API & Integrations** - Zapier, Make.com, webhooks
- **Multi-currency & Localization** - Multi-currency, Hindi support
- **Advanced Workflow Automation** - Visual workflow builder
- **Knowledge Base & Help Center** - Wiki, help center, AI search

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


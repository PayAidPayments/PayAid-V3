# PayAid V3: Complete Business Operating System - Cursor Implementation Prompt

**Project Scope**: PayAid V3 is a comprehensive, industry-specific Business Operating System (BOS) designed for Indian SMBs. This is a production-grade SaaS platform built on Next.js/Vercel with modular architecture supporting 20+ industry verticals.

---

## 🎯 CRITICAL PROJECT PRINCIPLES

### 1. **Zero Competitor Mentions Policy**
- ❌ **STRICTLY FORBIDDEN**: Any mention of Shopify, Salesforce, Oracle, NetSuite, HubSpot, Zoho, Xero, Wave, or any competitor
- ❌ **FORBIDDEN**: Comparison tables, "like X but better" positioning, or feature parity claims vs competitors
- ❌ **FORBIDDEN**: Third-party SaaS pricing references or benchmarking
- ✅ **ALLOWED**: PayAid-specific terminology, proprietary features, unique capabilities
- ✅ **ALLOWED**: Generic industry practices ("invoicing is critical for service businesses") without competitor attribution
- **Implementation**: Search codebase for competitor names during code review; replace all instances with generic or PayAid-specific terminology

### 2. **Indian Rupee (₹) Only - Zero Multi-Currency**
- ✅ **REQUIRED**: All monetary values displayed with ₹ symbol (Unicode: `₹` or HTML entity `&#8377;`)
- ❌ **FORBIDDEN**: $ (USD), € (EUR), or any other currency symbols on any page/component/email
- ❌ **FORBIDDEN**: Currency conversion, multi-currency selection, or internationalization hints
- ✅ **REQUIRED**: Format: `₹ 45,000` (space between symbol and amount, Indian comma formatting: 45,00,000)
- ✅ **REQUIRED**: All form inputs, reports, exports, APIs use INR only
- ✅ **REQUIRED**: Database stores amounts as INR numeric values (no currency conversion logic)
- **Implementation**: 
  - Create global utility: `lib/currency.ts` with `formatINR()`, `parseINR()`, `INR_SYMBOL = '₹'`
  - All financial components import from this utility
  - Verify all number formatting in database migrations, API responses, and exports

### 3. **PayAid Payments Integration - Exclusive**
- ✅ **REQUIRED**: Use **ONLY** PayAid Payments as payment gateway
  - **API Docs**: https://payaidpayments.com/api-developer-kits/
  - **Integration Guide**: https://payaidpayments.com/wp-content/uploads/2023/05/Payment_Gateway_Integration_Guide.pdf
- ❌ **FORBIDDEN**: Stripe, Razorpay, PayPal, or any third-party payment gateway
- ❌ **FORBIDDEN**: Multiple payment processor selection/switching logic
- ✅ **REQUIRED**: PayAid Payments as hardcoded payment provider in:
  - Subscription/billing module
  - Service payment processing
  - Refund workflows
  - Invoice payment links
  - Recurring billing setup
- **Implementation**:
  - Create `lib/payments/payaid-gateway.ts` for all PayAid Payments API calls
  - Environment variables: `PAYAID_API_KEY`, `PAYAID_MERCHANT_ID`, `PAYAID_ENVIRONMENT` (sandbox/production)
  - No payment processor abstraction layer (no PaymentProvider interface supporting multiple gateways)
  - All payment-related components reference PayAid specifically in UI copy ("Pay via PayAid Payments")

### 4. **Vercel Deployment Requirements - Zero TypeScript Errors**
- ✅ **REQUIRED**: Strict TypeScript compilation (`tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`)
- ✅ **REQUIRED**: Zero `any` types - use proper type definitions or generics
- ✅ **REQUIRED**: All environment variables in `.env.local` and Vercel dashboard with proper types
- ✅ **REQUIRED**: No console errors, warnings during build
- ✅ **REQUIRED**: `npm run build` must complete with exit code 0
- ✅ **REQUIRED**: All API routes have proper error handling and response types
- ✅ **REQUIRED**: Database migrations must succeed before deployment
- **Pre-deployment checklist**:
  ```bash
  npm run type-check  # Full TypeScript check
  npm run lint        # ESLint check
  npm run build       # Next.js production build
  ```
- **Build will FAIL if any TypeScript errors exist** - this is non-negotiable

### 5. **Modular Industry-First Architecture**
- ✅ **REQUIRED**: Each industry gets dedicated module folder: `modules/[industry]/`
- ✅ **REQUIRED**: Modules are NOT shared across industries initially (per industry customization)
- ✅ **REQUIRED**: Base modules (Finance, CRM, Marketing) are shared: `modules/shared/`
- ✅ **REQUIRED**: Each module has isolated schema, components, API routes, and business logic
- ✅ **REQUIRED**: Cross-module communication via events/hooks, not direct imports
- **Implementation**:
  ```
  modules/
  ├── shared/               # CRM, Finance, Marketing, Communication, HR, Analytics, Productivity
  ├── freelancer/           # + Service Businesses, Portfolio/Proposal
  ├── retail/               # + Omnichannel, Loyalty, Dynamic Pricing, CLV
  ├── restaurant/           # + KDS, Supplier Management, Delivery, Loyalty
  ├── healthcare/           # + EHR, Appointments, Prescriptions, Billing, Patient Portal, Compliance
  ├── education/            # + Student Management, LMS, Attendance, Grades, Behavior, Financial Aid
  ├── legal/                # + Case Management, Document, Expense, Client Portal, Compliance
  ├── realestate/           # + Lead Scoring, Property, Transaction, CMA, Channel Management
  ├── logistics/            # + Fleet Management, Driver Behavior, Maintenance, Route Optimization, Compliance
  ├── construction/         # + Project Management, Materials, Budget, Safety, Subcontractor, Site Supervision
  └── [... 10 more industries]
  ```

---

## 📋 BASE MODULES - Shared Across All Industries

### 1. **CRM (Customer/Client Relationship Management)**
**Scope**: Centralized customer database, interaction history, segmentation, lead pipeline

**Database Schema**:
```typescript
// types/crm.ts
interface Contact {
  id: string;
  organizationId: string;
  industryModule: IndustryType; // freelancer, retail, healthcare, etc.
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactType: 'lead' | 'customer' | 'supplier' | 'prospect';
  status: 'active' | 'inactive' | 'archived';
  tags: string[];
  customFields: Record<string, any>; // Industry-specific fields
  communicationHistory: Communication[];
  transactionHistory: Transaction[];
  notes: string;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  industrySpecificData?: Record<string, any>; // e.g., patientHistory for healthcare
}

interface Segment {
  id: string;
  organizationId: string;
  name: string;
  criteria: FilterCriteria[];
  contactCount: number;
  createdAt: Date;
}

interface LeadPipeline {
  id: string;
  organizationId: string;
  name: string;
  stages: PipelineStage[];
  currency: 'INR'; // Always INR
  totalValue: number; // In ₹
}
```

**API Endpoints**:
```
POST   /api/crm/contacts                 # Create contact
GET    /api/crm/contacts                 # List with filters, pagination
GET    /api/crm/contacts/:id             # Get single
PATCH  /api/crm/contacts/:id             # Update
DELETE /api/crm/contacts/:id             # Archive/delete
POST   /api/crm/segments                 # Create segment
POST   /api/crm/communications           # Log communication
GET    /api/crm/analytics/summary        # Dashboard metrics
```

**Frontend Components**:
- Contact List (searchable, filterable, sortable by last interaction, value)
- Contact Detail View (communication history, transactions, related module records)
- Lead Pipeline Kanban Board (drag-to-update stage, value-weighted lanes)
- Bulk Actions (add tags, change status, export to email campaign)
- Activity Timeline (chronological view of all interactions across platform)

**Key Features**:
- ✅ Communication history unified (Email, WhatsApp, SMS, in-app messages)
- ✅ Contact import/export (CSV)
- ✅ Smart contact de-duplication (email/phone matching)
- ✅ Relationship mapping (parent contact, related contacts)
- ✅ No-code field customization (industry-specific attributes)
- ✅ Activity feed (last contact date, next follow-up due)

---

### 2. **Finance (Invoicing, Accounting, GST Compliance)**
**Scope**: Multi-entity accounting, invoicing, expense tracking, tax compliance (GST/TDS), payment reconciliation

**Database Schema**:
```typescript
interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string; // Auto-generated: INV-YYYY-MM-XXXX
  invoiceDate: Date;
  dueDate: Date;
  customerId: string;
  lineItems: LineItem[];
  subtotalINR: number; // Always ₹
  taxBreakdown: TaxBreakdown; // GST slabs: 0%, 5%, 12%, 18%
  discountINR: number;
  totalINR: number;
  status: 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms: 'immediate' | 'net15' | 'net30' | 'net45' | 'custom';
  paymentMethod: 'payaid' | 'bank_transfer' | 'cash' | 'cheque' | 'upi';
  paymentLink?: string; // PayAid Payments hosted link
  payments: Payment[];
  notes: string;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'quarterly' | 'annual';
  industrySpecificFields?: Record<string, any>; // e.g., matterIdForLegal
  createdAt: Date;
  updatedAt: Date;
}

interface Expense {
  id: string;
  organizationId: string;
  description: string;
  amountINR: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  vendor?: string;
  receiptAttachment?: Attachment;
  isRecurring: boolean;
  allocationToInvoice?: string; // For service businesses (billable expense)
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: Date;
}

interface GSTReturn {
  id: string;
  organizationId: string;
  period: 'monthly' | 'quarterly'; // GSTR-1, GSTR-2, GSTR-3B
  filingDeadline: Date;
  invoicesSummary: {
    totalTaxableValue: number;
    totalGSTCollected: number;
    gstBreakdownBySlab: Record<string, number>;
  };
  expenseSummary: {
    totalInputGST: number;
  };
  netGSTPayableINR: number;
  filedAt?: Date;
  filedUrl?: string;
  status: 'pending' | 'filed' | 'paid';
}
```

**API Endpoints**:
```
POST   /api/finance/invoices             # Create invoice
GET    /api/finance/invoices             # List with filters
GET    /api/finance/invoices/:id         # Get single
PATCH  /api/finance/invoices/:id         # Update (only if draft)
POST   /api/finance/invoices/:id/send    # Send invoice (mark sent)
POST   /api/finance/invoices/:id/payment # Record payment
POST   /api/finance/invoices/:id/payaid-link # Generate PayAid payment link
GET    /api/finance/invoices/:id/pdf     # Generate PDF (with GST breakdown)
POST   /api/finance/expenses             # Create expense
GET    /api/finance/gst-returns          # Calculate GST returns for period
POST   /api/finance/gst-returns/:id/file # Generate GSTR file
GET    /api/finance/reports/P&L          # Profit & Loss statement
GET    /api/finance/reports/cashflow     # Cash flow projection
```

**Frontend Components**:
- Invoice Builder (drag-drop line items, tax calculation real-time, preview with GST breakdown)
- Invoice List (status badges, payment due indicators, bulk actions)
- Payment Collection Interface (PayAid Payments integration, payment confirmation webhook handler)
- Expense Tracker (receipt upload, category auto-suggestion, receipt OCR for amount)
- GST Dashboard (compliance calendar, pending returns, filing status)
- Financial Reports (P&L, Cash Flow, Invoice aging, Tax summary)
- Recurring Invoice Setup (auto-generate and send on schedule)

**Key Features**:
- ✅ GST-compliant invoicing (auto-calculate based on HSBC/SAC code)
- ✅ Multi-HSN/SAC codes per invoice (different tax rates)
- ✅ Payment reminders (automated emails before due date)
- ✅ Partial payment tracking
- ✅ Expense categorization with GST input tracking
- ✅ TDS (Tax Deducted at Source) tracking
- ✅ Zero mention of USD/other currencies
- ✅ PayAid Payments integration for payment links
- ✅ Invoice PDF with QR code (for UPI payment link)
- ✅ Recurring invoice automation (daily, weekly, monthly, quarterly, annual)

---

### 3. **Marketing & AI Content**
**Scope**: Email marketing, SMS campaigns, content generation (AI-powered), social media content, landing pages

**Database Schema**:
```typescript
interface EmailCampaign {
  id: string;
  organizationId: string;
  name: string;
  subject: string;
  htmlContent: string;
  aiGeneratedPrompt?: string; // Original prompt sent to Claude/GPT
  recipientSegments: string[]; // Segment IDs
  recipientCount: number;
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
  scheduledFor?: Date;
  sentAt?: Date;
  openRate: number;
  clickRate: number;
  conversionRate?: number;
  unsubscribeCount: number;
  metrics: {
    totalSent: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: Date;
}

interface AIContentRequest {
  id: string;
  organizationId: string;
  contentType: 'email' | 'social_post' | 'product_description' | 'landing_page_copy' | 'proposal' | 'case_study' | 'blog_post';
  prompt: string;
  industry: IndustryType;
  generatedContent: string;
  tone: 'professional' | 'casual' | 'technical' | 'creative';
  includesCallToAction: boolean;
  status: 'generating' | 'generated' | 'approved' | 'published';
  approvedAt?: Date;
  usageCount?: number; // Track how many times this content was used
  createdAt: Date;
}

interface SMSCampaign {
  id: string;
  organizationId: string;
  name: string;
  message: string; // Max 160 chars (single SMS)
  recipientSegments: string[];
  recipientCount: number;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledFor?: Date;
  sentAt?: Date;
  deliveryRate: number;
  createdAt: Date;
}
```

**API Endpoints**:
```
POST   /api/marketing/email-campaigns          # Create email
POST   /api/marketing/email-campaigns/:id/send # Send campaign
GET    /api/marketing/email-campaigns          # List campaigns
GET    /api/marketing/analytics/campaigns      # Campaign performance
POST   /api/marketing/ai-content               # Generate content (AI)
GET    /api/marketing/ai-content/:id           # Get generated content
POST   /api/marketing/sms-campaigns            # Create SMS
GET    /api/marketing/templates                # Email templates library
POST   /api/marketing/templates                # Save custom template
```

**Frontend Components**:
- Email Campaign Builder (drag-drop editor, template library, AI content generation)
- AI Content Generator (prompt input, tone selection, industry context, content preview)
- Segment Selector (visual preview of recipients, count)
- Campaign Performance Dashboard (open rate, click rate, conversion tracking)
- SMS Campaign Manager (character counter, preview, scheduling)
- Template Library (pre-built industry templates, customizable)
- Email Automation Flows (trigger-based sequences, behavior-based rules)

**Key Features**:
- ✅ AI-powered email copy generation (integrate Claude or LLM)
- ✅ Smart product descriptions from inventory
- ✅ Case study/testimonial generation
- ✅ Landing page copy optimization
- ✅ A/B testing (subject line, content variants)
- ✅ Scheduled send campaigns (timezone-aware)
- ✅ Email list segmentation (RFM, behavioral, custom)
- ✅ SMS integration (Twilio or equivalent for India)
- ✅ Automation workflows (trigger-based: abandoned cart, welcome series, re-engagement)
- ✅ Unsubscribe management
- ✅ Open and click tracking
- ✅ Landing page builder (no-code template-based)
- ✅ Social media content scheduling (integration with Meta Business Suite, LinkedIn)

---

### 4. **Communication (Unified Inbox)**
**Scope**: Centralized email, WhatsApp, SMS, in-app notifications. Single inbox for all customer touchpoints.

**Database Schema**:
```typescript
interface Communication {
  id: string;
  organizationId: string;
  channel: 'email' | 'whatsapp' | 'sms' | 'in_app';
  direction: 'inbound' | 'outbound';
  senderContactId: string;
  senderName: string;
  senderAddress: string; // email, phone, whatsapp number
  recipientContactId?: string;
  subject?: string; // For email
  message: string;
  attachments: Attachment[];
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  linkedTo?: {
    type: 'invoice' | 'project' | 'case' | 'order';
    id: string;
  };
  sentiment?: 'positive' | 'neutral' | 'negative'; // AI analysis
  aiSummary?: string; // Auto-summary for long emails
  responseTemplate?: string; // AI-suggested response
  createdAt: Date;
  readAt?: Date;
}

interface NotificationPreference {
  organizationId: string;
  channel: 'email' | 'whatsapp' | 'sms' | 'in_app';
  triggerEvent: string; // e.g., invoice_created, payment_received, appointment_reminder
  enabled: boolean;
  customTemplate?: string;
}
```

**API Endpoints**:
```
GET    /api/communication/inbox           # Unified inbox view
GET    /api/communication/threads/:id     # Conversation thread
POST   /api/communication/send            # Send message (channel agnostic)
GET    /api/communication/analytics       # Response times, volume by channel
POST   /api/communication/preferences     # Set notification rules
```

**Frontend Components**:
- Unified Inbox (filter by channel, contact, date, read/unread status)
- Conversation Thread (chronological view, all channels together)
- Quick Reply (AI-suggested responses, template selection)
- Bulk Communication (email/SMS/WhatsApp blast to segments)
- Notification Settings (per-channel, per-trigger configuration)

**Key Features**:
- ✅ Email integration (IMAP/SMTP setup)
- ✅ WhatsApp Business API integration
- ✅ SMS integration
- ✅ In-app notifications
- ✅ Auto-categorization (by type, sentiment)
- ✅ AI-powered response suggestions
- ✅ Message templates for quick responses
- ✅ Bulk assignment (assign multiple messages to team member)
- ✅ Do not reply to customer from competitor channels (e.g., Slack)

---

### 5. **HR (Staff Management, Payroll, Scheduling)**
**Scope**: Employee/contractor management, time tracking, salary/commission, shift scheduling, performance metrics

**Database Schema**:
```typescript
interface Employee {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'staff' | 'contractor';
  department?: string;
  designation: string;
  salaryINR?: number; // Monthly salary
  salaryType: 'fixed' | 'hourly' | 'commission' | 'hybrid';
  hourlyRateINR?: number;
  commissionStructure?: {
    type: 'percentage' | 'fixed_per_unit';
    rate: number;
    applicableTo: string[]; // e.g., ['service_sold', 'order_value']
  };
  bankAccount?: BankDetails; // For payroll
  panNumber?: string;
  aadharNumber?: string; // For India
  dateOfJoining: Date;
  dateOfLeaving?: Date;
  attendanceSettings?: {
    checkInRequired: boolean;
    shiftTiming: { startTime: string; endTime: string };
  };
  skills: string[];
  performanceMetrics?: Record<string, number>; // e.g., sales_count, average_rating
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  createdAt: Date;
}

interface TimeEntry {
  id: string;
  organizationId: string;
  employeeId: string;
  taskId?: string; // Links to project/invoice for billable hours
  startTime: Date;
  endTime: Date;
  duration: number; // In minutes
  isBillable: boolean;
  projectName?: string;
  description: string;
  status: 'submitted' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: Date;
}

interface Shift {
  id: string;
  organizationId: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  shiftType: 'morning' | 'afternoon' | 'night' | 'custom';
  status: 'scheduled' | 'working' | 'completed' | 'absent';
  actualCheckIn?: Date;
  actualCheckOut?: Date;
}

interface Payroll {
  id: string;
  organizationId: string;
  payrollMonth: string; // YYYY-MM
  employeeId: string;
  basicSalaryINR: number;
  allowancesINR: number;
  deductionsINR: number;
  commissionINR?: number;
  grossINR: number;
  taxINR?: number;
  netINR: number;
  status: 'draft' | 'approved' | 'processed' | 'paid';
  processedAt?: Date;
  paymentMethod: 'bank_transfer' | 'cash' | 'check';
  createdAt: Date;
}
```

**API Endpoints**:
```
POST   /api/hr/employees                  # Add employee
GET    /api/hr/employees                  # List staff
PATCH  /api/hr/employees/:id              # Update employee
POST   /api/hr/time-entries               # Log time
GET    /api/hr/time-entries               # List time entries (with approval workflows)
POST   /api/hr/shifts/schedule            # Create shift
GET    /api/hr/attendance/:employeeId     # Attendance report
POST   /api/hr/payroll/:month             # Generate payroll
GET    /api/hr/payroll/:id/report         # Payroll slip
```

**Frontend Components**:
- Employee Directory (searchable, role-based access)
- Shift Scheduler (calendar view, drag-drop shift assignments)
- Time Tracker (daily time entry, project/task selection, approval workflow)
- Attendance Dashboard (presence heatmap, leave tracking)
- Payroll Generator (auto-calculate, tax computation, export for bank transfer)
- Performance Dashboard (by employee: sales, commissions, ratings, projects completed)

**Key Features**:
- ✅ Employee on-boarding workflow
- ✅ Role-based access control (RBAC)
- ✅ Shift scheduling with calendar
- ✅ Attendance tracking (check-in/check-out or manual entry)
- ✅ Leave management (vacation, sick leave, personal leave balances)
- ✅ Time tracking (billable vs non-billable for service businesses)
- ✅ Commission calculation (auto-compute from sales/tasks)
- ✅ Salary slip generation and distribution
- ✅ Expense reimbursement workflow
- ✅ Performance review tracking (ratings, feedback)
- ✅ Department-wise analytics (headcount, cost, utilization)

---

### 6. **Analytics & Reporting**
**Scope**: Business dashboards, KPI tracking, forecasting, custom reports, data export

**Database Schema**:
```typescript
interface DashboardWidget {
  id: string;
  organizationId: string;
  dashboardId: string;
  widgetType: 'metric' | 'chart' | 'table' | 'gauge' | 'heatmap';
  title: string;
  dataSource: {
    module: string; // e.g., 'finance', 'crm', 'sales'
    metric: string; // e.g., 'total_revenue', 'active_leads'
    filters?: Record<string, any>;
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  };
  displayOptions?: {
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    currencyDisplay: 'INR'; // Always INR
    compareWith?: 'previous_period' | 'previous_year';
  };
  position: { x: number; y: number };
  size: { width: number; height: number };
  refreshInterval?: number; // seconds
}

interface Report {
  id: string;
  organizationId: string;
  reportName: string;
  reportType: 'financial' | 'sales' | 'operational' | 'compliance' | 'custom';
  createdBy: string;
  generatedAt: Date;
  dateRange: { startDate: Date; endDate: Date };
  sections: ReportSection[];
  exportFormats: ['pdf' | 'xlsx' | 'csv'][];
  scheduledGeneration?: {
    frequency: 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
  };
}
```

**API Endpoints**:
```
GET    /api/analytics/dashboard/:id       # Get dashboard
POST   /api/analytics/dashboard/:id/widgets # Add widget
GET    /api/analytics/metrics             # Real-time metrics
GET    /api/analytics/reports             # List reports
POST   /api/analytics/reports             # Generate custom report
GET    /api/analytics/reports/:id/export  # Export report (PDF/Excel)
GET    /api/analytics/forecasts           # Revenue, expense forecasts
```

**Frontend Components**:
- Executive Dashboard (KPIs, revenue trend, top customers, cash flow, forecast)
- Custom Reports Builder (drag-drop report builder, no-code)
- Analytics Dashboard (filterable, drill-down capability)
- Data Export (CSV, Excel, PDF with formatting)
- Real-time Metrics (revenue today, invoices pending, overdue payments, leads in pipeline)

**Key Features**:
- ✅ Real-time dashboard updates (WebSocket or polling)
- ✅ Industry-specific KPIs (different metrics for retail vs healthcare vs legal)
- ✅ Revenue forecasting (based on pipeline and historical data)
- ✅ Cohort analysis (by acquisition month, by product, by geography)
- ✅ Custom report builder
- ✅ Scheduled report generation and email distribution
- ✅ Drill-down capability (click on metric → detailed view)
- ✅ Export to Excel/PDF (formatted with branding)
- ✅ Data visualization (charts, tables, heatmaps)

---

### 7. **Productivity (Task Management, Project Management)**
**Scope**: Task tracking, project workflows, subtasks, team collaboration, deadline management

**Database Schema**:
```typescript
interface Task {
  id: string;
  organizationId: string;
  projectId?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
  assignedTo: string[]; // Employee IDs
  dueDate?: Date;
  estimatedHoursINR?: number; // For billable tasks
  actualHoursSpent?: number;
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  linkedTo?: { type: string; id: string }; // e.g., linkedTo invoice, project
  createdAt: Date;
  completedAt?: Date;
}

interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  clientId?: string; // From CRM
  startDate: Date;
  endDate?: Date;
  budgetINR?: number;
  actualCostINR?: number;
  tasks: Task[];
  milestones: Milestone[];
  team: string[]; // Employee IDs
  visibility: 'public' | 'team' | 'private';
  createdAt: Date;
}
```

**API Endpoints**:
```
POST   /api/productivity/tasks            # Create task
GET    /api/productivity/tasks            # List (filtered by status, assignee, due date)
PATCH  /api/productivity/tasks/:id        # Update task
POST   /api/productivity/tasks/:id/comment # Add comment
GET    /api/productivity/projects         # List projects
POST   /api/productivity/projects         # Create project
GET    /api/productivity/analytics        # Task velocity, burndown chart
```

**Frontend Components**:
- Task Board (Kanban with drag-drop, status columns)
- Task Detail (full context, subtasks, attachments, comments, time tracking)
- Calendar View (tasks by due date)
- Project Timeline (Gantt chart, milestone tracking)
- Team Workload (visual representation of assigned tasks per person)
- Time Tracking (integrated with HR module for billable hours)

**Key Features**:
- ✅ Kanban board with drag-drop
- ✅ Calendar view for deadline management
- ✅ Subtasks with individual tracking
- ✅ Recurring tasks (daily, weekly, monthly)
- ✅ Time tracking (billable hours for service businesses)
- ✅ Task dependencies (blocking, blocked by)
- ✅ Comments and collaboration
- ✅ File attachments
- ✅ Email notifications for assignments and updates
- ✅ Workload balancing view (see team capacity)

---

## 🏭 INDUSTRY-SPECIFIC MODULES

Each industry module extends base modules with specialized features. Document the specialized features here.

### **Freelancer / Solo Consultant**
**Additional Modules**:
- Service Portfolio Builder (showcase past work, testimonials, rates)
- Proposal Generator (AI-powered, project-specific proposals with scoping)
- Retainer Management (fixed-fee projects, monthly recurring)

**Key Fields**:
- Service categories and hourly/project rates
- Portfolio items with images/case studies
- Proposal templates (industry-specific)
- Client satisfaction ratings

---

### **Retail (Shop/Chain)**
**Additional Modules**:
- **POS Integration**: Point-of-sale system (inventory sync, real-time sales, payment processing via PayAid)
- **Omnichannel Sync**: Unified inventory across online store (Shopify/Ecwid) + physical POS
- **Loyalty Program**: Points system, tier-based rewards, referral tracking
- **Dynamic Pricing**: AI-driven pricing by location, season, demand
- **Customer Segmentation**: RFM, behavioral clustering
- **Stock Alerts**: Low-stock notifications, reorder automation

**Key Integrations**:
- Shopify store sync (inventory, orders, customer data)
- Physical POS (receipt capture, stock updates)
- Payment: PayAid Payments (in-store and online)

---

### **Restaurant / Café**
**Additional Modules**:
- **Kitchen Display System (KDS)**: Order routing to kitchen, queue management
- **Recipe Management**: Ingredient lists, costing, waste tracking
- **Supplier Management**: Purchase orders, delivery tracking, supplier ratings
- **Reservation System**: Online booking, auto-reminders, no-show tracking
- **Table Management**: Seating chart, table status (available/occupied/reserved)
- **Multi-outlet**: Centralized menu, pricing, inventory across locations
- **Delivery Integration**: Swiggy, Zomato, Dunzo order aggregation

**Key Integrations**:
- POS for dine-in and delivery
- Supplier ordering system
- Payment: PayAid Payments
- SMS reminders (reservations)

---

### **Healthcare (Clinic, Medical Practice)**
**Additional Modules**:
- **Patient Management & EHR**: Digital health records, medical history, allergy management
- **Appointment Scheduling**: Online booking, automated reminders, calendar sync
- **Prescription Management**: E-prescribing, pharmacy integration (if applicable)
- **Billing & Insurance Claims**: Automated claim generation, payment processing, denial management
- **Patient Portal**: Lab results access, messaging with provider, appointment history
- **Compliance**: HIPAA-equivalent for India (NDHM compliance for digital records)
- **Doctor Availability**: Multi-doctor scheduling, specialization management

**Key Integrations**:
- Patient portal for self-service
- Payment: PayAid Payments
- SMS/WhatsApp appointment reminders
- Lab/diagnostic integration (if applicable)

---

### **Education (School, College, Training Institute)**
**Additional Modules**:
- **Student Management**: Enrollment, transcript management, withdrawal tracking
- **Learning Management System (LMS)**: Course delivery, assignments, quizzes
- **Attendance Tracking**: Biometric or manual, parent notifications
- **Grade Management**: Report card generation, parent access
- **Behavior Tracking**: Incident logs, discipline tracking, parent alerts
- **Financial Aid**: Scholarship applications, fund allocation
- **Alumni Management**: Career outcomes, donation tracking

**Key Integrations**:
- Student information system (SIS)
- Parent notification system (SMS/email)
- Payment: PayAid Payments (fee collection)

---

### **Legal (Law Firm, Legal Services)**
**Additional Modules**:
- **Case/Matter Management**: Document control, deadline tracking, court dates
- **Time Tracking**: Billable hours with passive tracking (auto-timer)
- **Document Management**: Template library, automated document assembly, version control
- **Client Portal**: Case status, document access, secure messaging
- **Expense Tracking**: Receipt capture, client reimbursement, matter allocation
- **Billing & Invoicing**: Matter-based billing, retainer tracking, trust accounting
- **Compliance & Audit**: Time entry review, engagement letters, ethics management

**Key Integrations**:
- Document automation (e-signature)
- Payment: PayAid Payments
- Email system for client communication

---

### **Real Estate (Agency, Developer, Property Management)**
**Additional Modules**:
- **Lead Scoring**: Behavioral lead scoring, auto-follow-ups
- **Property Management**: Listing sync with portals, rental management
- **Transaction Management**: Document management, e-signatures, closing workflows
- **CMA Tool**: AI-powered valuation, market trend analysis
- **Property Portal**: Client access to listings, property updates
- **Commission Tracking**: By agent, by property type, transaction-based

**Key Integrations**:
- Real estate portals (99acres, MagicBricks, local portals)
- Payment: PayAid Payments
- WhatsApp for client communication

---

### **Logistics / Transportation**
**Additional Modules**:
- **Fleet Management**: Real-time GPS tracking, geofencing, vehicle maintenance
- **Route Optimization**: Multi-stop routing, fuel cost minimization
- **Driver Behavior Monitoring**: Speeding, harsh braking alerts
- **Compliance**: AIS 140 tracking (India requirement), hours-of-service
- **Shipment Tracking Portal**: Customer shipment status, proof of delivery

**Key Integrations**:
- GPS/telematics system
- Payment: PayAid Payments
- SMS tracking for customers

---

### **Manufacturing**
**Additional Modules**:
- **Production Planning & MRP**: Demand forecasting, bill of materials, capacity planning
- **Supply Chain Visibility**: Supplier lead times, order status
- **Quality Control (QC)**: Inspection workflows, defect tracking
- **Equipment Maintenance**: Preventive maintenance scheduling, downtime tracking
- **Shop Floor Tracking**: Real-time job status, labor allocation

**Key Integrations**:
- ERP-style production scheduling
- Supplier ordering system
- Payment: PayAid Payments

---

### **Construction**
**Additional Modules**:
- **Project Management**: Gantt charts, critical path, resource allocation
- **Materials Tracking**: Barcode tracking, asset transfers
- **Budget & Cost Control**: Cost codes, change order management
- **Safety & Compliance**: Incident reporting, inspection logs
- **Subcontractor Management**: Payment tracking, performance history
- **Site Supervision**: Photo documentation, field notes, progress reporting

**Key Integrations**:
- Project scheduling
- Payment: PayAid Payments
- Document management

---

### **Beauty / Salon**
**Additional Modules**:
- **Appointment Scheduling**: 24/7 online booking, auto-reminders, no-show reduction
- **Service Catalog**: Service listing with duration and stylist assignment
- **Loyalty Program**: Points-based rewards, referral tracking, packages
- **Staff Commission**: By service type, performance metrics
- **Service History**: Treatment details, stylist preferences, follow-up scheduling

**Key Integrations**:
- Google Calendar integration
- Payment: PayAid Payments
- SMS reminders

---

### **Automotive (Dealership, Service Center)**
**Additional Modules**:
- **Service Management**: Work orders, job queue, technician tracking
- **Parts Inventory**: VIN-level compatibility, supplier ordering
- **Service History**: Vehicle maintenance records, recall tracking
- **Warranty Management**: Coverage tracking, claim processing
- **Technician Commission**: By labor type, parts sales

**Key Integrations**:
- VIN decoder (for parts compatibility)
- Payment: PayAid Payments

---

### **Hospitality (Hotel, Resort)**
**Additional Modules**:
- **Revenue Management System (RMS)**: Dynamic pricing, demand forecasting
- **Central Reservation System (CRS)**: Booking engine, OTA sync
- **Property Management System (PMS)**: Front desk, housekeeping, billing
- **Guest Experience Portal**: Booking changes, messaging, loyalty program
- **F&B Management**: Restaurant POS, banquet management

**Key Integrations**:
- OTA channels (Booking.com, Agoda, etc.)
- Payment: PayAid Payments
- PMS for room status

---

### **Financial Services (Wealth Management, Advisory)**
**Additional Modules**:
- **Client Management**: Household relationships, goals tracking
- **Portfolio Tracking**: Performance reporting, rebalancing workflows
- **Compliance**: Regulatory tracking, suitability documentation
- **Document Management**: Engagement letters, account agreements
- **Client Portal**: Account access, performance reports

**Key Integrations**:
- Portfolio management platforms (if applicable)
- Payment: PayAid Payments

---

### **Event Management**
**Additional Modules**:
- **Event Planning**: Gantt charts, milestone tracking, resource allocation
- **Budget Management**: Fixed/variable costs, spending alerts
- **Vendor Management**: RFP workflows, contract tracking, payments
- **Ticketing & Registration**: Ticket sales, check-in, QR codes
- **Event Portal**: Attendee information, agenda, networking directory
- **Post-Event Reporting**: Analytics, feedback collection, ROI calculation

**Key Integrations**:
- Ticketing system
- Payment: PayAid Payments

---

### **Wholesale Distribution (B2B Distributor)**
**Additional Modules**:
- **B2B Portal**: Self-service ordering, customer-specific pricing, order history
- **Purchase Order Management**: Supplier ordering, auto-replenishment
- **Supplier Performance**: Quality metrics, on-time delivery, cost trends
- **Multi-Warehouse Inventory**: Real-time visibility, inter-warehouse transfers
- **Customer Segmentation**: VIP management, pricing tiers, bulk discounts

**Key Integrations**:
- B2B ordering portal
- Payment: PayAid Payments (for invoicing)

---

### **Agriculture**
**Additional Modules**:
- **Crop & Farm Management**: Crop calendar, planting dates, yield forecasting
- **Supply Chain**: Supplier management, market demand forecasting
- **Risk Management**: Weather alerts, pest tracking, contract management
- **Traceability**: Farm-to-table tracking, certification management
- **Market Intelligence**: Price monitoring, buyer demand forecasting

**Key Integrations**:
- Weather API
- Market price APIs (if available for India)
- Payment: PayAid Payments

---

## 🏗️ ARCHITECTURE REQUIREMENTS

### 1. **Technology Stack**
```
Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS
Backend: Next.js API Routes (or separate Node.js if needed)
Database: Supabase (PostgreSQL) or Firebase
Authentication: NextAuth.js v5 (credential-based or OAuth)
File Storage: Supabase Storage (AWS S3 equivalent)
Payment: PayAid Payments only
Deployment: Vercel
Environment: Node.js 18+
Package Manager: pnpm (for monorepo efficiency)
```

### 2. **Project Structure**
```
payaid-v3/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Auth layout (login, signup, forgot password)
│   ├── (dashboard)/          # Protected routes (after login)
│   │   ├── dashboard/
│   │   ├── crm/
│   │   ├── finance/
│   │   ├── marketing/
│   │   └── [industry]/       # Dynamic industry module routes
│   ├── api/                  # API routes
│   │   ├── auth/
│   │   ├── crm/
│   │   ├── finance/
│   │   ├── payments/         # PayAid Payments endpoints
│   │   └── webhooks/         # PayAid webhook handlers
│   ├── layout.tsx
│   └── page.tsx              # Marketing landing page
├── components/               # Reusable components
│   ├── crm/
│   ├── finance/
│   ├── shared/               # Common UI components
│   └── layouts/
├── modules/                  # Module-specific logic (Tier-1 folder structure)
│   ├── shared/               # Base modules (CRM, Finance, etc.)
│   ├── freelancer/
│   ├── retail/
│   ├── restaurant/
│   ├── healthcare/
│   ├── education/
│   ├── legal/
│   ├── realestate/
│   ├── logistics/
│   ├── construction/
│   ├── beauty/
│   ├── automotive/
│   ├── hospitality/
│   ├── financial/
│   ├── event/
│   ├── wholesale/
│   └── agriculture/
├── lib/                      # Utilities and helpers
│   ├── api-client.ts
│   ├── auth.ts
│   ├── currency.ts           # ₹ formatting, INR utilities
│   ├── payments/payaid-gateway.ts  # PayAid Payments integration
│   ├── db.ts                 # Database client (Supabase)
│   └── hooks/
├── types/                    # TypeScript type definitions
│   ├── crm.ts
│   ├── finance.ts
│   ├── common.ts
│   └── index.ts
├── middleware.ts             # NextAuth/auth middleware
├── tsconfig.json            # Strict TypeScript
├── next.config.js
├── tailwind.config.js
├── package.json
└── .env.local               # Environment variables
```

### 3. **Database Schema (PostgreSQL on Supabase)**

All tables must include:
- `id` (UUID primary key)
- `organization_id` (for multi-tenancy)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `created_by` (user ID)
- `is_deleted` (soft delete flag)

**Key Tables**:
```sql
-- Multi-tenancy
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry_type VARCHAR(50),
  country_code CHAR(2) DEFAULT 'IN',
  currency VARCHAR(3) DEFAULT 'INR',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  subscription_plan VARCHAR(50),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts (CRM)
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  contact_type VARCHAR(50),
  status VARCHAR(50),
  tags TEXT[], -- Array of tags
  industry_specific_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Invoices (Finance)
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  invoice_number VARCHAR(50) UNIQUE,
  customer_id UUID,
  invoice_date DATE,
  due_date DATE,
  subtotal_inr NUMERIC(15, 2),
  tax_inr NUMERIC(15, 2),
  discount_inr NUMERIC(15, 2),
  total_inr NUMERIC(15, 2),
  status VARCHAR(50),
  payment_method VARCHAR(50),
  payaid_payment_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employees (HR)
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50),
  designation VARCHAR(100),
  salary_inr NUMERIC(15, 2),
  salary_type VARCHAR(50),
  date_of_joining DATE,
  date_of_leaving DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Time Entries (HR + Productivity)
CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  task_id UUID,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_minutes INT,
  is_billable BOOLEAN,
  description TEXT,
  status VARCHAR(50),
  approved_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks (Productivity)
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  project_id UUID,
  title VARCHAR(255),
  description TEXT,
  priority VARCHAR(50),
  status VARCHAR(50),
  assigned_to UUID[],
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email Campaigns (Marketing)
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  name VARCHAR(255),
  subject VARCHAR(255),
  html_content TEXT,
  ai_generated_prompt TEXT,
  recipient_segments UUID[],
  status VARCHAR(50),
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  open_rate NUMERIC(5, 2),
  click_rate NUMERIC(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Communications (Unified Inbox)
CREATE TABLE communications (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  channel VARCHAR(50),
  direction VARCHAR(50),
  sender_contact_id UUID,
  subject VARCHAR(255),
  message TEXT,
  status VARCHAR(50),
  sentiment VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. **API Response Format (Standardized)**

All API responses must follow this format:

```typescript
// lib/api-response.ts
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    pagination?: { page: number; pageSize: number; total: number };
    timestamp: string;
  };
}

// Usage in API route:
export async function GET(req: Request) {
  try {
    const data = await fetchData();
    return Response.json({
      success: true,
      statusCode: 200,
      data,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
    return Response.json({
      success: false,
      statusCode: 500,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
}
```

### 5. **Authentication & Authorization**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*']
};
```

```typescript
// lib/auth.ts
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Validate against Supabase
        const user = await validateCredentials(credentials);
        return user || null;
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  callbacks: {
    async session({ session, token }) {
      session.user.organizationId = token.organizationId;
      return session;
    }
  }
};
```

### 6. **TypeScript Configuration (Strict Mode)**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## 💰 PAYAID PAYMENTS INTEGRATION (MANDATORY)

### 1. **Setup Environment Variables**
```env
NEXT_PUBLIC_PAYAID_MERCHANT_ID=your_merchant_id
PAYAID_API_KEY=your_api_key
PAYAID_ENVIRONMENT=production  # or sandbox
PAYAID_WEBHOOK_SECRET=your_webhook_secret
```

### 2. **Gateway Integration Module**

```typescript
// lib/payments/payaid-gateway.ts
import axios from 'axios';

const PAYAID_API_BASE = process.env.PAYAID_ENVIRONMENT === 'production'
  ? 'https://api.payaidpayments.com'
  : 'https://sandbox.payaidpayments.com';

interface PayAidPaymentRequest {
  amount: number; // In ₹ (paise as per API)
  currency: 'INR';
  merchantId: string;
  transactionId: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
}

export async function createPaymentLink(request: PayAidPaymentRequest) {
  try {
    const response = await axios.post(
      `${PAYAID_API_BASE}/v1/payments/create`,
      {
        ...request,
        merchantId: process.env.NEXT_PUBLIC_PAYAID_MERCHANT_ID,
        currency: 'INR'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYAID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      paymentLink: response.data.payment_link,
      transactionId: response.data.transaction_id,
      expiresAt: response.data.expires_at
    };
  } catch (error) {
    console.error('PayAid Payment Link Creation Error:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyPaymentStatus(transactionId: string) {
  try {
    const response = await axios.get(
      `${PAYAID_API_BASE}/v1/payments/${transactionId}/status`,
      {
        headers: { 'Authorization': `Bearer ${process.env.PAYAID_API_KEY}` }
      }
    );

    return {
      success: true,
      status: response.data.status, // completed, pending, failed
      amount: response.data.amount,
      paidAt: response.data.paid_at
    };
  } catch (error) {
    console.error('PayAid Verification Error:', error);
    return { success: false, error: error.message };
  }
}

export async function refundPayment(transactionId: string, refundAmount?: number) {
  try {
    const response = await axios.post(
      `${PAYAID_API_BASE}/v1/payments/${transactionId}/refund`,
      { amount: refundAmount }, // Partial refund if amount specified
      {
        headers: { 'Authorization': `Bearer ${process.env.PAYAID_API_KEY}` }
      }
    );

    return { success: true, refundId: response.data.refund_id };
  } catch (error) {
    console.error('PayAid Refund Error:', error);
    return { success: false, error: error.message };
  }
}
```

### 3. **API Endpoint for Payment Link Generation**

```typescript
// app/api/finance/invoices/[id]/payaid-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentLink } from '@/lib/payments/payaid-gateway';
import { getInvoice, updateInvoice } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await getInvoice(params.id);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const paymentResult = await createPaymentLink({
      amount: Math.round(invoice.total_inr * 100), // Convert ₹ to paise
      currency: 'INR',
      merchantId: process.env.NEXT_PUBLIC_PAYAID_MERCHANT_ID!,
      transactionId: `INV-${invoice.id}`,
      customerEmail: invoice.customer_email,
      customerPhone: invoice.customer_phone,
      description: `Invoice ${invoice.invoice_number}`,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payaid`
    });

    if (paymentResult.success) {
      await updateInvoice(params.id, {
        payaid_payment_link: paymentResult.paymentLink,
        status: 'sent'
      });
    }

    return NextResponse.json(paymentResult);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 4. **Webhook Handler for PayAid**

```typescript
// app/api/webhooks/payaid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/payments/payaid-gateway';
import { updateInvoicePayment } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get('X-PayAid-Signature');

    // Verify webhook authenticity
    const isValid = verifyWebhookSignature(
      JSON.stringify(body),
      signature!,
      process.env.PAYAID_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle payment completion
    if (body.event === 'payment.completed') {
      const invoiceId = body.transaction_id.replace('INV-', '');
      await updateInvoicePayment(invoiceId, {
        payaid_transaction_id: body.transaction_id,
        status: 'paid',
        paid_at: new Date(body.paid_at),
        payment_amount_inr: body.amount / 100 // Convert paise to ₹
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🎨 LANDING PAGE REQUIREMENTS

**Critical Rules**:
- ❌ Zero competitor mentions (Shopify, Salesforce, etc.)
- ✅ Focus on Indian SMB pain points
- ✅ Industry-specific use cases with ₹ pricing
- ✅ Testimonials from Indian businesses
- ✅ PayAid Payments prominently mentioned

**Sections**:
1. **Hero Section**: "Complete Business Operating System for Indian SMBs"
2. **Problem Statement**: Fragmented tools, compliance headaches, scaling challenges
3. **Solution Overview**: 20+ industry modules, unified dashboard, AI automation
4. **Industry Showcases**: 3-4 industries with specific use cases (Retail, Healthcare, Legal, etc.)
5. **Features Highlight**: CRM, Finance (GST), Marketing (AI), HR, Analytics
6. **Pricing Tiers**: Free trial, Starter (₹X), Professional (₹Y), Enterprise
7. **Integrations**: PayAid Payments, WhatsApp, Email, SMS
8. **FAQ**: Compliance, data security, export options
9. **CTA**: "Start Free Trial" or "Book Demo"

---

## 🔐 COMPLIANCE & SECURITY

### 1. **Data Protection (India-Specific)**
- ✅ Compliance with Information Technology Act, 2000
- ✅ NDHM compliance for healthcare data
- ✅ GST compliance with audit trail
- ✅ Data localization (servers in India if possible or GDPR-equivalent)
- ✅ Encryption at rest and in transit (TLS 1.3)

### 2. **User Data Management**
- ✅ Explicit consent for data collection
- ✅ Right to export data (CSV/PDF)
- ✅ Account deletion workflow
- ✅ Audit logs for all sensitive operations

### 3. **Payment Security**
- ✅ No storage of card details (rely on PayAid Payments)
- ✅ PCI-DSS compliant (via PayAid)
- ✅ Webhook signature verification
- ✅ Rate limiting on payment endpoints

---

## 📊 SUGGESTED ENHANCEMENTS FOR SUPER SAAS

### 1. **AI-Powered Automation (Higher Tier)**
- **Workflow Automation**: Trigger-based automation (Invoice created → Send email + SMS)
- **Predictive Analytics**: Churn prediction, revenue forecasting, customer lifetime value
- **Smart Recommendations**: Suggest next action for sales, highlight overdue invoices
- **AI Co-pilot**: Conversational AI to answer platform questions

### 2. **Advanced Analytics & Business Intelligence**
- **Custom Dashboards**: No-code dashboard builder (drag-drop widgets)
- **Data Warehouse Integration**: Sync data to Looker Studio / Power BI
- **Predictive Metrics**: Forecasting revenue, inventory, cash flow
- **Benchmarking**: Compare metrics against industry averages (anonymized, India-specific)

### 3. **Integration Marketplace**
- **Pre-built Integrations**: Shopify, Xero, Payroll providers, shipping APIs
- **Zapier-style Automation**: Connect to 1000+ external apps
- **Custom Webhooks**: Customers build custom integrations

### 4. **Mobile Applications**
- **iOS/Android Apps**: Native apps for field teams (sales, delivery, support)
- **Offline Sync**: Works offline, syncs when online
- **Push Notifications**: Real-time alerts for order, payment, appointment updates

### 5. **Collaboration & Team Tools**
- **Team Messaging**: In-app chat with channels (by team, by project)
- **Approval Workflows**: Manager approvals for expenses, timesheets, invoices
- **Activity Feed**: Real-time updates on org-wide activities
- **File Sharing**: Centralized document storage (integrated with modules)

### 6. **White-Label Solution**
- **Reseller Program**: Agency partners can rebrand PayAid V3
- **Custom Branding**: Logo, colors, domain, email branding
- **Reseller Dashboard**: Manage client instances, billing, support

### 7. **Advanced Compliance**
- **GSTR Auto-filing**: Automated GST return filing (GSTN integration)
- **TDS Compliance**: Automated TDS calculation and reporting
- **Audit Trail**: Immutable logs for all data changes (for regulatory compliance)
- **Industry-Specific Compliance**: HIPAA equivalent for healthcare, SEBI compliance for financial advisors

### 8. **Performance Optimization**
- **Real-time Sync**: WebSocket-based live updates for shared data
- **Data Caching**: Redis caching for frequently accessed data
- **Background Jobs**: Queue system (Bull/Temporal) for heavy operations (invoice generation, email, PDF creation)
- **CDN**: Asset delivery network for fast loading

### 9. **Customer Success Features**
- **In-app Help**: Contextual help, video tutorials, screenshares
- **Onboarding Flows**: Step-by-step guided onboarding per industry
- **Template Library**: Pre-built workflows, email templates, report templates
- **Training Portal**: Video courses, certification for power users

### 10. **Extensibility**
- **Plugin System**: Custom modules via plugin architecture
- **API Access**: RESTful + GraphQL APIs for developers
- **Webhook System**: Custom events, third-party integrations
- **Scripting**: Low-code scripting for business logic

### 11. **Multi-currency Future** (Phase 2, not now)
- **Infrastructure Ready**: Currency stored separately, but enforced INR now
- **Easy Expansion**: When you're ready to scale to US/Singapore, just switch currencies

### 12. **Advanced Inventory Management**
- **Barcode Scanning**: QR/barcode scanning for stock in/out
- **Lot/Batch Tracking**: Expiry date management, recall capabilities
- **Serial Number Tracking**: For high-value items
- **Warehouse Management**: Multi-warehouse, inter-warehouse transfers

### 13. **Customer Portal**
- **Self-Service Portal**: Customers access own invoices, payments, orders, support tickets
- **White-labeled**: Matches your brand
- **Account Management**: Update payment method, subscription, contact info

### 14. **Advanced Reporting**
- **Custom Report Builder**: No-code report builder with filters, grouping, aggregation
- **Scheduled Reports**: Auto-generate and email reports daily/weekly/monthly
- **Data Export**: API for data export, BI tool integration
- **Benchmarking**: Compare against industry averages (aggregated data)

---

## 🚀 DEPLOYMENT CHECKLIST

**Pre-Deployment**:
- [ ] All TypeScript checks pass (`npm run type-check`)
- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables set in Vercel dashboard
- [ ] Database migrations executed
- [ ] PayAid Payments credentials verified
- [ ] SSL certificate valid
- [ ] Backup strategy in place

**Post-Deployment**:
- [ ] Smoke tests (login, create invoice, payment flow)
- [ ] Performance monitoring enabled (Vercel Analytics)
- [ ] Error tracking enabled (Sentry or similar)
- [ ] Logging configured
- [ ] DNS health checked
- [ ] HTTPS enforced

---

## 📝 CURSOR INSTRUCTIONS - FOLLOW STRICTLY

### Command Patterns:
1. **When implementing a module**: 
   ```
   "Build the [MODULE] module for [INDUSTRY] following the PayAid V3 spec. Include:
   - Database schema (strictly typed, no any types)
   - API endpoints (all error handling, input validation)
   - Frontend components (Tailwind CSS, no external UI libraries)
   - Use ₹ symbol, no other currencies
   - Use PayAid Payments for payment flows
   - Follow app/modules/[industry]/[module] structure"
   ```

2. **When fixing TypeScript errors**:
   ```
   "Fix all TypeScript errors with strict mode enabled. Use proper types, no any. Show the exact type definitions."
   ```

3. **When creating API endpoints**:
   ```
   "Create API route with:
   - Full TypeScript typing
   - Input validation (zod or similar)
   - Proper error handling with ApiResponse format
   - Environment variable usage (no hardcoded values)
   - PayAid integration if payment-related
   - Follows REST conventions"
   ```

### Critical Don'ts:
- ❌ Do NOT mention competitors or compare with other platforms
- ❌ Do NOT use $ or any currency other than ₹
- ❌ Do NOT use payment gateways other than PayAid Payments
- ❌ Do NOT use `any` type in TypeScript
- ❌ Do NOT hardcode API keys or sensitive values
- ❌ Do NOT create components without proper error boundaries
- ❌ Do NOT skip type definitions for database queries

### Build Command:
```bash
npm run build  # Must exit with code 0, zero errors
```

---

## 🎯 SUCCESS CRITERIA

✅ **Project is "Super SaaS" ready when**:
1. All 20 industries have base + specialized modules
2. Zero TypeScript errors, strict mode enforced
3. PayAid Payments integrated for all payment flows
4. ₹ displayed everywhere (no other currencies)
5. Competitor-free messaging (no mentions of Shopify, Salesforce, etc.)
6. Vercel deployment successful with no build errors
7. Multi-tenancy working (separate data per organization)
8. Compliance features in place (GST, data protection, audit trails)
9. Real-time collaboration features (shared data updates, activity feeds)
10. Mobile-responsive design across all modules
11. Performance optimized (< 3s page load, real-time syncs work smoothly)
12. Comprehensive API for integrations and custom extensions

---

## ❓ QUESTIONS FOR YOUR TEAM

1. **PayAid Payments**: Is the API fully documented? Any rate limits or quota restrictions?
2. **Authentication**: Should we support SSO (via Google Workspace, Microsoft 365) for enterprise?
3. **Multi-tenancy**: Do you want to support one organization per user account, or multiple orgs per user?
4. **Storage**: Should we use Supabase Storage for attachments, or AWS S3?
5. **Email Backend**: For transactional emails (invoice notifications, password resets), use SendGrid, AWS SES, or Resend?
6. **Compliance**: Do you have specific NDHM or GST compliance requirements documented?
7. **Go-Live Target**: What's the timeline for each industry module launch?

---

**FINAL NOTE**: This is a production-grade specification. Every line of code should be typed, tested, and deployment-ready. No shortcuts. No TODOs. Zero compromise on quality.

**Start with**: Shared base modules (CRM, Finance, Marketing, Communication) → One industry (suggest Freelancer or Retail as MVP) → Expand to remaining industries.

**Estimated Timeline**: 4-6 weeks for MVP (3-4 modules), 3-4 months for full 20-industry launch.

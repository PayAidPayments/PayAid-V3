# 📊 Phase 2: Codebase Analysis & Module Mapping

**Date:** December 2025  
**Status:** ✅ **COMPLETE**  
**Purpose:** Document all module-specific code for repository splitting

---

## 🎯 **Module Classification**

### **1. CRM Module** (`crm`)

#### **API Routes:**
- `/api/contacts/*` - Contact management
- `/api/deals/*` - Deal management
- `/api/leads/*` - Lead management
- `/api/sales-reps/*` - Sales rep management
- `/api/sequences/*` - Email sequences
- `/api/nurture/*` - Nurture campaigns
- `/api/products/*` - Product catalog (part of CRM/sales)
- `/api/orders/*` - Order management (part of CRM/sales)
- `/api/marketing/*` - Marketing campaigns
- `/api/email-templates/*` - Email templates
- `/api/social-media/*` - Social media management
- `/api/landing-pages/*` - Landing pages
- `/api/checkout-pages/*` - Checkout pages
- `/api/events/*` - Event management
- `/api/logos/*` - Logo generation
- `/api/websites/*` - Website builder
- `/api/chat/*` - Team chat
- `/api/chatbots/*` - Chatbots
- `/api/tasks/*` - Task management
- `/api/interactions/*` - Interaction tracking
- `/api/industries/*` - Industry-specific features

#### **Frontend Pages:**
- `/dashboard/contacts/*`
- `/dashboard/deals/*`
- `/dashboard/leads/*`
- `/dashboard/products/*`
- `/dashboard/orders/*`
- `/dashboard/marketing/*`
- `/dashboard/websites/*`
- `/dashboard/chat/*`
- `/dashboard/tasks/*`

#### **Prisma Models:**
- `Contact`
- `Deal`
- `Lead`
- `SalesRep`
- `Product`
- `Order`
- `OrderItem`
- `Campaign`
- `Segment`
- `NurtureTemplate`
- `NurtureEnrollment`
- `ScheduledEmail`
- `EmailTemplate`
- `SocialMediaAccount`
- `SocialMediaPost`
- `LandingPage`
- `CheckoutPage`
- `Event`
- `Logo`
- `Website`
- `ChatChannel`
- `ChatChannelMessage`
- `Chatbot`
- `Task`
- `Interaction`

#### **Shared Libraries:**
- `lib/sales-automation/*` - Lead allocation
- `lib/email-helpers/*` - Email linking
- `lib/chat-helpers/*` - Chat utilities
- `lib/marketing/*` - Marketing integrations

---

### **2. Invoicing Module** (`invoicing`)

#### **API Routes:**
- `/api/invoices/*` - Invoice CRUD
- `/api/invoices/[id]/pdf` - PDF generation
- `/api/invoices/[id]/generate-payment-link` - Payment links
- `/api/invoices/[id]/send-with-payment` - Send invoice

#### **Frontend Pages:**
- `/dashboard/invoices/*`

#### **Prisma Models:**
- `Invoice`
- `InvoiceItem`
- `Customer` (shared with CRM)

#### **Shared Libraries:**
- `lib/invoicing/*` - GST calculation, PDF generation
- `lib/payments/*` - Payment gateway integration

---

### **3. Accounting Module** (`accounting`)

#### **API Routes:**
- `/api/accounting/*` - Accounting reports
- `/api/gst/*` - GST reports (GSTR-1, GSTR-3B)

#### **Frontend Pages:**
- `/dashboard/accounting/*`
- `/dashboard/gst/*`

#### **Prisma Models:**
- `Expense`
- `Account` (if implemented)
- `Transaction` (if implemented)

#### **Shared Libraries:**
- `lib/invoicing/gst.ts` - GST calculations
- `lib/data/gst-rates.ts` - GST rate data

---

### **4. HR Module** (`hr`)

#### **API Routes:**
- `/api/hr/*` - All HR endpoints
  - `/api/hr/employees/*`
  - `/api/hr/payroll/*`
  - `/api/hr/attendance/*`
  - `/api/hr/leave/*`
  - `/api/hr/departments/*`
  - `/api/hr/designations/*`
  - `/api/hr/locations/*`
  - `/api/hr/job-requisitions/*`
  - `/api/hr/candidates/*`
  - `/api/hr/interviews/*`
  - `/api/hr/offers/*`
  - `/api/hr/onboarding/*`
  - `/api/hr/tax-declarations/*`

#### **Frontend Pages:**
- `/dashboard/hr/*`

#### **Prisma Models:**
- `Employee`
- `Department`
- `Designation`
- `Location`
- `PayrollCycle`
- `PayrollRun`
- `SalaryStructure`
- `AttendanceRecord`
- `LeaveType`
- `LeavePolicy`
- `LeaveRequest`
- `HolidayCalendar`
- `JobRequisition`
- `Candidate`
- `Interview`
- `Offer`
- `OnboardingTemplate`
- `OnboardingInstance`
- `ExitTemplate`
- `TaxDeclaration`
- `TaxDeclarationCategory`
- `PFConfig`
- `ESIConfig`
- `PTConfig`
- `Asset`
- `HRDocumentTemplate`

#### **Shared Libraries:**
- `lib/payroll/*` - Payroll calculation engine

---

### **5. WhatsApp Module** (`whatsapp`)

#### **API Routes:**
- `/api/whatsapp/*` - All WhatsApp endpoints
  - `/api/whatsapp/accounts/*`
  - `/api/whatsapp/sessions/*`
  - `/api/whatsapp/templates/*`
  - `/api/whatsapp/messages/*`
  - `/api/whatsapp/conversations/*`
  - `/api/whatsapp/analytics/*`
  - `/api/whatsapp/onboarding/*`
  - `/api/whatsapp/webhooks/*`

#### **Frontend Pages:**
- `/dashboard/whatsapp/*`

#### **Prisma Models:**
- `WhatsAppAccount`
- `WhatsAppSession`
- `WhatsAppTemplate`
- `WhatsAppConversation`
- `WhatsAppMessage`
- `WhatsAppAuditLog`

#### **Shared Libraries:**
- `lib/whatsapp/*` - Docker helpers, WAHA integration
- `lib/marketing/wati.ts` - WATI integration

---

### **6. Analytics Module** (`analytics`)

#### **API Routes:**
- `/api/analytics/*` - Analytics endpoints
  - `/api/analytics/dashboard`
  - `/api/analytics/health-score`
  - `/api/analytics/lead-sources`
  - `/api/analytics/team-performance`
  - `/api/analytics/track`
  - `/api/analytics/visit`
- `/api/ai/*` - AI features (part of analytics)
- `/api/reports/custom` - Custom reports
- `/api/dashboards/custom` - Custom dashboards

#### **Frontend Pages:**
- `/dashboard/ai/*`
- `/dashboard/analytics/*`
- `/dashboard/reports/*`
- `/dashboard/dashboards/*`

#### **Prisma Models:**
- `AIUsage`
- `LeadSource`
- `AnalyticsVisit` (if implemented)
- `AnalyticsEvent` (if implemented)

#### **Shared Libraries:**
- `lib/ai/*` - All AI integrations
- `lib/analytics/*` - Analytics tracking
- `lib/ai-helpers/*` - AI utilities

---

### **7. Core Module** (`core` - Auth + Billing + Admin)

#### **API Routes:**
- `/api/auth/*` - Authentication
- `/api/admin/*` - Admin endpoints
- `/api/settings/*` - Settings (profile, tenant, payment gateway)
- `/api/subscriptions/*` - Subscription management
- `/api/billing/*` - Billing (to be created in Phase 3)
- `/api/payments/*` - Payment processing (core)
- `/api/alerts/*` - Alerts system
- `/api/calls/*` - Call management
- `/api/upload/*` - File uploads
- `/api/dashboard/stats` - Dashboard stats

#### **Frontend Pages:**
- `/login`
- `/register`
- `/dashboard/admin/*`
- `/dashboard/settings/*`
- `/dashboard` (main dashboard)

#### **Prisma Models:**
- `User`
- `Tenant`
- `TenantMember`
- `Subscription`
- `ModuleDefinition`
- `OAuthIntegration`
- `Alert`
- `Call`
- `Upload`

#### **Shared Libraries:**
- `lib/auth/*` - JWT, password hashing
- `lib/middleware/*` - Auth, license, tenant middleware
- `lib/db/*` - Prisma client
- `lib/redis/*` - Redis client
- `lib/queue/*` - Bull queues
- `lib/stores/*` - Zustand stores
- `lib/utils/*` - General utilities
- `lib/monitoring/*` - Monitoring
- `lib/notifications/*` - Notifications
- `lib/encryption.ts` - Encryption utilities

---

## 📦 **Shared Code to Extract**

### **1. @payaid/auth Package**

**Files to Extract:**
- `lib/auth/jwt.ts` - JWT signing/verification
- `lib/auth/password.ts` - Password hashing
- `lib/middleware/auth.ts` - Auth middleware (legacy)
- `lib/middleware/license.ts` - License checking
- `lib/middleware/tenant.ts` - Tenant middleware
- `lib/hooks/use-payaid-auth.ts` - Auth hook

**Exports:**
```typescript
export { signToken, verifyToken, decodeToken } from './jwt'
export { hashPassword, comparePassword } from './password'
export { requireModuleAccess, checkModuleAccess, handleLicenseError } from './license'
export { usePayAidAuth } from './hooks'
```

---

### **2. @payaid/types Package**

**Files to Create:**
- `src/index.ts` - All TypeScript interfaces

**Exports:**
```typescript
export interface User { ... }
export interface Tenant { ... }
export interface Subscription { ... }
export interface ModuleDefinition { ... }
export interface JWTPayload { ... }
export interface LicenseInfo { ... }
// ... all shared types
```

---

### **3. @payaid/db Package**

**Files to Extract:**
- `lib/db/prisma.ts` - Prisma client
- `prisma/schema.prisma` - Core schema (User, Tenant, Subscription, ModuleDefinition only)

**Exports:**
```typescript
export { prisma } from './prisma'
export * from '@prisma/client'
```

---

### **4. @payaid/ui Package**

**Files to Extract:**
- `components/ui/*` - All UI components (button, card, input, table, etc.)
- `components/layout/*` - Layout components (header, sidebar)
- `components/modules/ModuleGate.tsx` - Module gate component
- `components/auth/protected-route.tsx` - Protected route

**Exports:**
```typescript
export { Button } from './ui/button'
export { Card } from './ui/card'
export { Input } from './ui/input'
export { Table } from './ui/table'
export { ModuleGate } from './modules/ModuleGate'
// ... all UI components
```

---

### **5. @payaid/utils Package**

**Files to Extract:**
- `lib/utils/cn.ts` - Class name utility
- `lib/utils/indian-states.ts` - Indian states data
- `lib/utils/tenant-routes.ts` - Tenant routing utilities
- `lib/encryption.ts` - Encryption utilities

**Exports:**
```typescript
export { cn } from './cn'
export { indianStates } from './indian-states'
export { getTenantRoute } from './tenant-routes'
export { encrypt, decrypt } from './encryption'
```

---

## 🔗 **Cross-Module Dependencies**

### **Dependencies Map:**

```
CRM Module:
├─ Depends on: Core (auth, db)
├─ Shares with: Invoicing (Customer model)
└─ No other dependencies

Invoicing Module:
├─ Depends on: Core (auth, db, payments)
├─ Shares with: CRM (Customer model)
└─ No other dependencies

Accounting Module:
├─ Depends on: Core (auth, db)
├─ Reads from: Invoicing (Invoice data for GST)
└─ No write dependencies

HR Module:
├─ Depends on: Core (auth, db)
└─ No other dependencies

WhatsApp Module:
├─ Depends on: Core (auth, db)
├─ Shares with: CRM (Contact model for conversations)
└─ No other dependencies

Analytics Module:
├─ Depends on: Core (auth, db)
├─ Reads from: CRM (contacts, deals, orders)
├─ Reads from: Invoicing (invoices)
├─ Reads from: HR (employees)
└─ READ-ONLY (no write operations)
```

---

## 📁 **Repository Structure Plan**

### **payaid-core/**
```
payaid-core/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── billing/ (Phase 3)
│   │   ├── settings/
│   │   ├── subscriptions/
│   │   └── payments/
│   ├── dashboard/
│   │   ├── admin/
│   │   ├── settings/
│   │   └── page.tsx (main dashboard)
│   ├── login/
│   ├── register/
│   └── app-store/ (Phase 3)
├── lib/
│   ├── auth/
│   ├── middleware/
│   ├── db/
│   └── utils/
├── prisma/
│   └── schema.prisma (core models only)
└── package.json
```

### **payaid-crm/**
```
payaid-crm/
├── app/
│   ├── api/
│   │   ├── contacts/
│   │   ├── deals/
│   │   ├── leads/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── marketing/
│   │   └── ... (all CRM routes)
│   └── dashboard/
│       ├── contacts/
│       ├── deals/
│       └── ... (all CRM pages)
├── components/
│   └── crm/ (CRM-specific components)
├── lib/
│   └── crm/ (CRM-specific utilities)
├── prisma/
│   └── schema.prisma (CRM models only)
└── package.json
```

### **payaid-invoicing/**
```
payaid-invoicing/
├── app/
│   ├── api/
│   │   └── invoices/
│   └── dashboard/
│       └── invoices/
├── components/
│   └── invoicing/
├── lib/
│   └── invoicing/
├── prisma/
│   └── schema.prisma (Invoice, InvoiceItem models)
└── package.json
```

### **payaid-accounting/**
```
payaid-accounting/
├── app/
│   ├── api/
│   │   ├── accounting/
│   │   └── gst/
│   └── dashboard/
│       ├── accounting/
│       └── gst/
├── components/
│   └── accounting/
├── lib/
│   └── accounting/
├── prisma/
│   └── schema.prisma (Expense, Account models)
└── package.json
```

### **payaid-hr/**
```
payaid-hr/
├── app/
│   ├── api/
│   │   └── hr/
│   └── dashboard/
│       └── hr/
├── components/
│   └── hr/
├── lib/
│   └── hr/
├── prisma/
│   └── schema.prisma (all HR models)
└── package.json
```

### **payaid-whatsapp/**
```
payaid-whatsapp/
├── app/
│   ├── api/
│   │   └── whatsapp/
│   └── dashboard/
│       └── whatsapp/
├── components/
│   └── whatsapp/
├── lib/
│   └── whatsapp/
├── prisma/
│   └── schema.prisma (WhatsApp models)
└── package.json
```

### **payaid-analytics/**
```
payaid-analytics/
├── app/
│   ├── api/
│   │   ├── analytics/
│   │   └── ai/
│   └── dashboard/
│       ├── analytics/
│       ├── ai/
│       ├── reports/
│       └── dashboards/
├── components/
│   └── analytics/
├── lib/
│   ├── ai/
│   └── analytics/
├── prisma/
│   └── schema.prisma (Analytics models only)
└── package.json
```

---

## 🔐 **OAuth2 SSO Architecture**

### **Flow:**
1. User logs in at `payaid.io` (core)
2. Core generates OAuth2 authorization code
3. User navigates to `crm.payaid.io`
4. CRM module redirects to core for auth
5. Core validates and returns JWT token
6. CRM module stores token in cookie
7. All subsequent requests use token

### **Implementation:**
- OAuth2 Authorization Code flow
- JWT tokens for stateless auth
- Shared cookie domain (`.payaid.io`)
- Token refresh mechanism

---

## 📊 **Statistics**

| Module | API Routes | Frontend Pages | Prisma Models | Estimated Size |
|--------|-----------|----------------|---------------|----------------|
| **Core** | ~15 | ~10 | ~10 | Small |
| **CRM** | ~50 | ~20 | ~25 | Large |
| **Invoicing** | ~5 | ~5 | ~3 | Small |
| **Accounting** | ~5 | ~5 | ~3 | Small |
| **HR** | ~40 | ~15 | ~30 | Large |
| **WhatsApp** | ~15 | ~5 | ~6 | Medium |
| **Analytics** | ~20 | ~10 | ~5 | Medium |

**Total:** ~150 API routes, ~70 frontend pages, ~82 Prisma models

---

## ✅ **Next Steps**

1. ✅ Codebase analysis complete
2. ⏳ Create shared packages structure
3. ⏳ Create module repository templates
4. ⏳ Implement OAuth2 SSO
5. ⏳ Create migration scripts

---

**Status:** ✅ **ANALYSIS COMPLETE**

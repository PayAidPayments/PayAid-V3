# 🔄 Monolithic to Decoupled Architecture Migration Plan

**Date:** January 2026  
**Status:** 📋 **Planning Phase**

---

## 📋 Summary

This document lists all pages still using the monolithic `/dashboard/` structure and provides a migration plan to move them to decoupled architecture with uniform top-bar components.

---

## 🎯 Migration Goals

1. **Move all pages from `/dashboard/` to module-specific routes**
2. **Ensure all decoupled pages have uniform top-bar with:**
   - Profile settings dropdown
   - Module switching options
   - Dark/light mode selector
   - Notification bell
   - News icon (admin-controlled)
   - Module-specific navigation

---

## 📊 Current Decoupled Modules

### ✅ Already Decoupled:
- **CRM**: `/crm/[tenantId]/...`
- **Sales**: `/sales/[tenantId]/...`
- **Finance**: `/finance/[tenantId]/...`
- **Marketing**: `/marketing/[tenantId]/...`
- **HR**: `/hr/[tenantId]/...`
- **Projects**: `/projects/[tenantId]/...`
- **Inventory**: `/inventory/[tenantId]/...`
- **AI Studio**: `/ai-studio/[tenantId]/...`
- **Voice Agents**: `/voice-agents/[tenantId]/...`

---

## 📝 Pages to Migrate (Categorized by Module)

### **1. Finance Module** (`/finance/[tenantId]/...`)

**Current Routes → New Routes:**
- `/dashboard/invoices` → `/finance/[tenantId]/Invoices`
- `/dashboard/invoices/[id]` → `/finance/[tenantId]/Invoices/[id]`
- `/dashboard/invoices/new` → `/finance/[tenantId]/Invoices/New`
- `/dashboard/invoices/[id]/edit` → `/finance/[tenantId]/Invoices/[id]/Edit`
- `/dashboard/accounting` → `/finance/[tenantId]/Accounting`
- `/dashboard/accounting/expenses` → `/finance/[tenantId]/Accounting/Expenses`
- `/dashboard/accounting/expenses/new` → `/finance/[tenantId]/Accounting/Expenses/New`
- `/dashboard/accounting/expenses/reports` → `/finance/[tenantId]/Accounting/Expenses/Reports`
- `/dashboard/accounting/reports` → `/finance/[tenantId]/Accounting/Reports`
- `/dashboard/accounting/reports/expenses` → `/finance/[tenantId]/Accounting/Reports/Expenses`
- `/dashboard/accounting/reports/revenue` → `/finance/[tenantId]/Accounting/Reports/Revenue`
- `/dashboard/purchases/orders` → `/finance/[tenantId]/Purchase-Orders`
- `/dashboard/purchases/orders/[id]` → `/finance/[tenantId]/Purchase-Orders/[id]`
- `/dashboard/purchases/orders/new` → `/finance/[tenantId]/Purchase-Orders/New`
- `/dashboard/purchases/vendors` → `/finance/[tenantId]/Vendors`
- `/dashboard/purchases/vendors/new` → `/finance/[tenantId]/Vendors/New`
- `/dashboard/gst` → `/finance/[tenantId]/GST`
- `/dashboard/gst/gstr-1` → `/finance/[tenantId]/GST/GSTR-1`
- `/dashboard/gst/gstr-3b` → `/finance/[tenantId]/GST/GSTR-3B`
- `/dashboard/billing` → `/finance/[tenantId]/Billing`
- `/dashboard/recurring-billing` → `/finance/[tenantId]/Recurring-Billing`

### **2. Sales Module** (`/sales/[tenantId]/...`)

**Current Routes → New Routes:**
- `/dashboard/orders` → `/sales/[tenantId]/Orders`
- `/dashboard/orders/[id]` → `/sales/[tenantId]/Orders/[id]`
- `/dashboard/orders/new` → `/sales/[tenantId]/Orders/New`
- `/dashboard/checkout-pages` → `/sales/[tenantId]/Checkout-Pages` (Already exists)
- `/dashboard/checkout-pages/[id]` → `/sales/[tenantId]/Checkout-Pages/[id]` (Already exists)
- `/dashboard/checkout-pages/new` → `/sales/[tenantId]/Checkout-Pages/New`
- `/dashboard/landing-pages` → `/sales/[tenantId]/Landing-Pages` (Already exists)
- `/dashboard/landing-pages/[id]` → `/sales/[tenantId]/Landing-Pages/[id]` (Already exists)
- `/dashboard/landing-pages/new` → `/sales/[tenantId]/Landing-Pages/New`
- `/dashboard/quotes` → `/sales/[tenantId]/Quotes` (if exists)

### **3. Inventory Module** (`/inventory/[tenantId]/...`)

**Current Routes → New Routes:**
- `/dashboard/inventory` → `/inventory/[tenantId]/Home` (Already exists)
- `/dashboard/inventory/stock-alerts` → `/inventory/[tenantId]/Stock-Alerts`
- `/dashboard/products` → `/inventory/[tenantId]/Products` (Already exists)
- `/dashboard/products/[id]` → `/inventory/[tenantId]/Products/[id]`
- `/dashboard/products/[id]/edit` → `/inventory/[tenantId]/Products/[id]/Edit`
- `/dashboard/products/new` → `/inventory/[tenantId]/Products/New`

### **4. Projects Module** (`/projects/[tenantId]/...`)

**Current Routes → New Routes:**
- `/dashboard/projects` → `/projects/[tenantId]/Projects` (Already exists)
- `/dashboard/projects/[id]` → `/projects/[tenantId]/Projects/[id]` (Already exists)
- `/dashboard/projects/new` → `/projects/[tenantId]/Projects/New`
- `/dashboard/projects/gantt` → `/projects/[tenantId]/Gantt` (Already exists)
- `/dashboard/projects/kanban` → `/projects/[tenantId]/Kanban`
- `/dashboard/tasks` → `/projects/[tenantId]/Tasks` (Already exists)
- `/dashboard/tasks/[id]` → `/projects/[tenantId]/Tasks/[id]`
- `/dashboard/tasks/new` → `/projects/[tenantId]/Tasks/New`

### **5. HR Module** (`/hr/[tenantId]/...`)

**Current Routes → New Routes:**
- `/dashboard/hr/employees` → `/hr/[tenantId]/Employees` (Already exists)
- `/dashboard/hr/employees/[id]` → `/hr/[tenantId]/Employees/[id]`
- `/dashboard/hr/payroll` → `/hr/[tenantId]/Payroll`
- `/dashboard/hr/payroll/cycles` → `/hr/[tenantId]/Payroll/Cycles`
- `/dashboard/hr/payroll/cycles/[id]` → `/hr/[tenantId]/Payroll/Cycles/[id]`
- `/dashboard/hr/payroll/cycles/new` → `/hr/[tenantId]/Payroll/Cycles/New`
- `/dashboard/hr/payroll/runs/[id]` → `/hr/[tenantId]/Payroll/Runs/[id]`
- `/dashboard/hr/payroll/reports` → `/hr/[tenantId]/Payroll/Reports`
- `/dashboard/hr/payroll/salary-structures` → `/hr/[tenantId]/Payroll/Salary-Structures`
- `/dashboard/hr/payroll/salary-structures/new` → `/hr/[tenantId]/Payroll/Salary-Structures/New`
- `/dashboard/hr/leave/requests` → `/hr/[tenantId]/Leave/Requests`
- `/dashboard/hr/leave/apply` → `/hr/[tenantId]/Leave/Apply`
- `/dashboard/hr/leave/balances` → `/hr/[tenantId]/Leave/Balances`
- `/dashboard/hr/attendance/calendar` → `/hr/[tenantId]/Attendance/Calendar`
- `/dashboard/hr/attendance/check-in` → `/hr/[tenantId]/Attendance/Check-In`
- `/dashboard/hr/hiring/candidates` → `/hr/[tenantId]/Hiring/Candidates`
- `/dashboard/hr/hiring/candidates/[id]` → `/hr/[tenantId]/Hiring/Candidates/[id]`
- `/dashboard/hr/hiring/candidates/new` → `/hr/[tenantId]/Hiring/Candidates/New`
- `/dashboard/hr/hiring/interviews` → `/hr/[tenantId]/Hiring/Interviews`
- `/dashboard/hr/hiring/interviews/new` → `/hr/[tenantId]/Hiring/Interviews/New`
- `/dashboard/hr/hiring/job-requisitions` → `/hr/[tenantId]/Hiring/Job-Requisitions`
- `/dashboard/hr/hiring/job-requisitions/[id]` → `/hr/[tenantId]/Hiring/Job-Requisitions/[id]`
- `/dashboard/hr/hiring/job-requisitions/new` → `/hr/[tenantId]/Hiring/Job-Requisitions/New`
- `/dashboard/hr/hiring/offers` → `/hr/[tenantId]/Hiring/Offers`
- `/dashboard/hr/hiring/offers/new` → `/hr/[tenantId]/Hiring/Offers/New`
- `/dashboard/hr/onboarding/templates` → `/hr/[tenantId]/Onboarding/Templates`
- `/dashboard/hr/onboarding/templates/[id]` → `/hr/[tenantId]/Onboarding/Templates/[id]`
- `/dashboard/hr/onboarding/templates/new` → `/hr/[tenantId]/Onboarding/Templates/New`
- `/dashboard/hr/onboarding/instances` → `/hr/[tenantId]/Onboarding/Instances`
- `/dashboard/hr/tax-declarations` → `/hr/[tenantId]/Tax-Declarations`
- `/dashboard/hr/tax-declarations/[id]` → `/hr/[tenantId]/Tax-Declarations/[id]`
- `/dashboard/hr/tax-declarations/new` → `/hr/[tenantId]/Tax-Declarations/New`

### **6. Marketing Module** (`/marketing/[tenantId]/...`)

**Current Routes → New Routes:**
- `/dashboard/marketing` → `/marketing/[tenantId]/Home` (Already exists)
- `/dashboard/marketing/campaigns` → `/marketing/[tenantId]/Campaigns` (Already exists)
- `/dashboard/marketing/campaigns/[id]` → `/marketing/[tenantId]/Campaigns/[id]` (Already exists)
- `/dashboard/marketing/campaigns/new` → `/marketing/[tenantId]/Campaigns/New`
- `/dashboard/marketing/analytics` → `/marketing/[tenantId]/Analytics`
- `/dashboard/marketing/segments` → `/marketing/[tenantId]/Segments`
- `/dashboard/marketing/social` → `/marketing/[tenantId]/Social`
- `/dashboard/marketing/social/create-post` → `/marketing/[tenantId]/Social/Create-Post`
- `/dashboard/marketing/social/create-image` → `/marketing/[tenantId]/Social/Create-Image`
- `/dashboard/marketing/social/schedule` → `/marketing/[tenantId]/Social/Schedule`
- `/dashboard/marketing/ai-influencer` → `/marketing/[tenantId]/AI-Influencer`
- `/dashboard/marketing/ai-influencer/new` → `/marketing/[tenantId]/AI-Influencer/New`

### **7. CRM Module** (`/crm/[tenantId]/...`)

**Current Routes → New Routes:**
- `/dashboard/contacts` → `/crm/[tenantId]/Contacts` (Already exists)
- `/dashboard/contacts/[id]` → `/crm/[tenantId]/Contacts/[id]`
- `/dashboard/contacts/[id]/edit` → `/crm/[tenantId]/Contacts/[id]/Edit`
- `/dashboard/contacts/new` → `/crm/[tenantId]/Contacts/New`
- `/dashboard/deals` → `/crm/[tenantId]/Deals` (Already exists)
- `/dashboard/deals/[id]` → `/crm/[tenantId]/Deals/[id]`
- `/dashboard/deals/[id]/edit` → `/crm/[tenantId]/Deals/[id]/Edit`
- `/dashboard/deals/new` → `/crm/[tenantId]/Deals/New`

### **8. Core/Shared Features** (Keep in `/dashboard/` or create new module)

**Settings:**
- `/dashboard/settings` → Keep as `/dashboard/settings` (Global settings)
- `/dashboard/settings/profile` → Keep as `/dashboard/settings/profile`
- `/dashboard/settings/tenant` → Keep as `/dashboard/settings/tenant`
- `/dashboard/settings/payment-gateway` → Keep as `/dashboard/settings/payment-gateway`
- `/dashboard/settings/invoices` → Keep as `/dashboard/settings/invoices`
- `/dashboard/settings/ai` → Keep as `/dashboard/settings/ai`
- `/dashboard/settings/kyc` → Keep as `/dashboard/settings/kyc`
- `/dashboard/settings/sales-reps` → Keep as `/dashboard/settings/sales-reps`

**Admin:**
- `/dashboard/admin/modules` → Keep as `/dashboard/admin/modules`
- `/dashboard/admin/tenants` → Keep as `/dashboard/admin/tenants`
- `/dashboard/admin/tenants/[tenantId]` → Keep as `/dashboard/admin/tenants/[tenantId]`
- `/dashboard/admin/revenue` → Keep as `/dashboard/admin/revenue`

**Productivity Suite:**
- `/dashboard/pdf` → Keep as `/dashboard/pdf` (Productivity module)
- `/dashboard/pdf/reader` → Keep as `/dashboard/pdf/reader`
- `/dashboard/pdf/editor` → Keep as `/dashboard/pdf/editor`
- `/dashboard/pdf/merge` → Keep as `/dashboard/pdf/merge`
- `/dashboard/pdf/split` → Keep as `/dashboard/pdf/split`
- `/dashboard/pdf/compress` → Keep as `/dashboard/pdf/compress`
- `/dashboard/pdf/convert` → Keep as `/dashboard/pdf/convert`
- `/dashboard/spreadsheets` → Keep as `/dashboard/spreadsheets`
- `/dashboard/spreadsheets/[id]` → Keep as `/dashboard/spreadsheets/[id]`
- `/dashboard/spreadsheets/new` → Keep as `/dashboard/spreadsheets/new`
- `/dashboard/docs` → Keep as `/dashboard/docs`
- `/dashboard/docs/[id]` → Keep as `/dashboard/docs/[id]`
- `/dashboard/docs/new` → Keep as `/dashboard/docs/new`
- `/dashboard/slides` → Keep as `/dashboard/slides`
- `/dashboard/slides/[id]` → Keep as `/dashboard/slides/[id]`
- `/dashboard/slides/new` → Keep as `/dashboard/slides/new`
- `/dashboard/drive` → Keep as `/dashboard/drive`

**AI Features:**
- `/dashboard/cofounder` → `/ai-studio/[tenantId]/Cofounder` (Already exists)
- `/dashboard/ai/chat` → `/ai-studio/[tenantId]/Chat` (Already exists)
- `/dashboard/ai/insights` → `/ai-studio/[tenantId]/Insights` (Already exists)
- `/dashboard/ai/test` → Keep as `/dashboard/ai/test` (Testing)
- `/dashboard/websites` → `/ai-studio/[tenantId]/Websites` (Already exists)
- `/dashboard/websites/[id]` → `/ai-studio/[tenantId]/Websites/[id]`
- `/dashboard/websites/[id]/builder` → `/ai-studio/[tenantId]/Websites/[id]/Builder`
- `/dashboard/websites/[id]/preview` → `/ai-studio/[tenantId]/Websites/[id]/Preview`
- `/dashboard/websites/[id]/analytics` → `/ai-studio/[tenantId]/Websites/[id]/Analytics`
- `/dashboard/websites/[id]/analytics/heatmap` → `/ai-studio/[tenantId]/Websites/[id]/Analytics/Heatmap`
- `/dashboard/websites/[id]/pages/[pageId]/preview` → `/ai-studio/[tenantId]/Websites/[id]/Pages/[pageId]/Preview`
- `/dashboard/websites/new` → `/ai-studio/[tenantId]/Websites/New`
- `/dashboard/logos` → `/ai-studio/[tenantId]/Logos` (Already exists)
- `/dashboard/logos/[id]` → `/ai-studio/[tenantId]/Logos/[id]`
- `/dashboard/knowledge` → `/ai-studio/[tenantId]/Knowledge` (Already exists)
- `/dashboard/ai-calling` → `/voice-agents/[tenantId]/Home` (Already exists)
- `/dashboard/ai-calling/[id]/settings` → `/voice-agents/[tenantId]/Settings/[id]`
- `/dashboard/voice-agents` → `/voice-agents/[tenantId]/Home` (Already exists)
- `/dashboard/voice-agents/[id]/calls` → `/voice-agents/[tenantId]/Calls/[id]`
- `/dashboard/voice-agents/analytics` → `/voice-agents/[tenantId]/Analytics`
- `/dashboard/voice-agents/new` → `/voice-agents/[tenantId]/New`

**Communication:**
- `/dashboard/email/accounts` → Keep as `/dashboard/email/accounts` (Communication module)
- `/dashboard/email/webmail` → Keep as `/dashboard/email/webmail`
- `/dashboard/email-templates` → Keep as `/dashboard/email-templates`
- `/dashboard/email-templates/[id]` → Keep as `/dashboard/email-templates/[id]`
- `/dashboard/email-templates/new` → Keep as `/dashboard/email-templates/new`
- `/dashboard/whatsapp/accounts` → Keep as `/dashboard/whatsapp/accounts`
- `/dashboard/whatsapp/inbox` → Keep as `/dashboard/whatsapp/inbox`
- `/dashboard/whatsapp/sessions` → Keep as `/dashboard/whatsapp/sessions`
- `/dashboard/whatsapp/setup` → Keep as `/dashboard/whatsapp/setup`
- `/dashboard/calls` → Keep as `/dashboard/calls`
- `/dashboard/calls/[id]` → Keep as `/dashboard/calls/[id]`
- `/dashboard/calls/faqs` → Keep as `/dashboard/calls/faqs`
- `/dashboard/chat` → Keep as `/dashboard/chat`
- `/dashboard/meet` → Keep as `/dashboard/meet`
- `/dashboard/meet/[id]` → Keep as `/dashboard/meet/[id]`
- `/dashboard/meet/new` → Keep as `/dashboard/meet/new`

**Other Features:**
- `/dashboard/appointments` → Keep as `/dashboard/appointments` (Standalone feature)
- `/dashboard/appointments/[id]` → Keep as `/dashboard/appointments/[id]`
- `/dashboard/appointments/new` → Keep as `/dashboard/appointments/new`
- `/dashboard/news` → Keep as `/dashboard/news` (Industry Intelligence)
- `/dashboard/help-center` → Keep as `/dashboard/help-center`
- `/dashboard/help-center/new` → Keep as `/dashboard/help-center/new`
- `/dashboard/contracts` → Keep as `/dashboard/contracts`
- `/dashboard/contracts/[id]` → Keep as `/dashboard/contracts/[id]`
- `/dashboard/contracts/new` → Keep as `/dashboard/contracts/new`
- `/dashboard/workflows` → Keep as `/dashboard/workflows`
- `/dashboard/workflows/[id]` → Keep as `/dashboard/workflows/[id]`
- `/dashboard/workflows/new` → Keep as `/dashboard/workflows/new`
- `/dashboard/events` → Keep as `/dashboard/events`
- `/dashboard/events/[id]` → Keep as `/dashboard/events/[id]`
- `/dashboard/events/new` → Keep as `/dashboard/events/new`
- `/dashboard/competitors` → Keep as `/dashboard/competitors`
- `/dashboard/analytics` → Keep as `/dashboard/analytics`
- `/dashboard/analytics/advanced` → Keep as `/dashboard/analytics/advanced`
- `/dashboard/analytics/lead-sources` → Keep as `/dashboard/analytics/lead-sources`
- `/dashboard/analytics/team-performance` → Keep as `/dashboard/analytics/team-performance`
- `/dashboard/reports` → Keep as `/dashboard/reports`
- `/dashboard/reports/custom` → Keep as `/dashboard/reports/custom`
- `/dashboard/reports/new` → Keep as `/dashboard/reports/new`
- `/dashboard/reports/builder` → Keep as `/dashboard/reports/builder`
- `/dashboard/dashboards/custom` → Keep as `/dashboard/dashboards/custom`
- `/dashboard/locations` → Keep as `/dashboard/locations`
- `/dashboard/locations/[id]` → Keep as `/dashboard/locations/[id]`
- `/dashboard/locations/new` → Keep as `/dashboard/locations/new`
- `/dashboard/business-units` → Keep as `/dashboard/business-units`
- `/dashboard/resellers` → Keep as `/dashboard/resellers`
- `/dashboard/ondc` → Keep as `/dashboard/ondc`
- `/dashboard/pos` → Keep as `/dashboard/pos`
- `/dashboard/fssai` → Keep as `/dashboard/fssai`
- `/dashboard/field-service/work-orders` → Keep as `/dashboard/field-service/work-orders`
- `/dashboard/assets` → Keep as `/dashboard/assets`
- `/dashboard/integrations` → Keep as `/dashboard/integrations`
- `/dashboard/api-docs` → Keep as `/dashboard/api-docs`
- `/dashboard/setup/industry` → Keep as `/dashboard/setup/industry`
- `/dashboard/industry` → Keep as `/dashboard/industry`
- `/dashboard/modules` → Keep as `/dashboard/modules`
- `/dashboard/industries` → Keep as `/dashboard/industries` (Industry-specific features)

**Industry-Specific (Keep in `/dashboard/industries/...`):**
- All industry-specific routes under `/dashboard/industries/...` should remain as they are

---

## 🔧 Migration Steps

### **Step 1: Create Decoupled Route Structure**
For each module, create the new route structure:
```
app/
├── [module]/
│   └── [tenantId]/
│       └── [Feature]/
│           ├── layout.tsx (with ModuleTopBar)
│           ├── page.tsx
│           └── [id]/
│               ├── page.tsx
│               └── edit/
│                   └── page.tsx
```

### **Step 2: Move Page Files**
Move page files from `/dashboard/...` to module-specific routes.

### **Step 3: Add ModuleTopBar Layout**
Ensure each decoupled page has:
```tsx
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function FeatureLayout({ children }) {
  return (
    <>
      <ModuleTopBar
        moduleId="module-id"
        moduleName="Module Name"
        items={[
          { name: 'Home', href: '/module/[tenantId]/Home' },
          { name: 'Feature', href: '/module/[tenantId]/Feature' },
        ]}
      />
      {children}
    </>
  )
}
```

### **Step 4: Create Redirect Pages**
Create redirect pages in old locations:
```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

export default function OldRoutePage() {
  const router = useRouter()
  const { tenant } = useAuthStore()
  
  useEffect(() => {
    if (tenant?.id) {
      router.replace(`/module/${tenant.id}/NewRoute`)
    } else {
      router.replace('/login')
    }
  }, [tenant?.id, router])
  
  return null
}
```

### **Step 5: Update Navigation Links**
Update all navigation links, sidebar items, and module switcher to point to new routes.

---

## 📊 Migration Priority

### **Phase 1: High Priority (Core Modules)**
1. Finance Module (Invoices, Accounting, GST)
2. Sales Module (Orders, Checkout Pages, Landing Pages)
3. Inventory Module (Products, Stock Alerts)
4. Projects Module (Projects, Tasks, Gantt, Kanban)
5. HR Module (All HR features)

### **Phase 2: Medium Priority**
6. Marketing Module (Campaigns, Social, Analytics)
7. CRM Module (Contacts, Deals - remaining pages)

### **Phase 3: Low Priority (Keep in Dashboard)**
8. Settings, Admin, Productivity Suite, Communication, etc.

---

## ✅ Uniform Top-Bar Requirements

All decoupled pages must have `ModuleTopBar` with:
- ✅ Profile settings dropdown
- ✅ Module switching options
- ✅ Dark/light mode selector
- ✅ Notification bell
- ✅ News icon (admin-controlled)
- ✅ Module-specific navigation items

---

## 📝 Next Steps

1. Start with Phase 1 modules
2. Create route structures
3. Move pages
4. Add ModuleTopBar layouts
5. Create redirects
6. Test navigation
7. Update documentation

---

**Status:** Ready to begin migration

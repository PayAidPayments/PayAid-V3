# 📋 Complete List of Monolithic Pages to Migrate

**Date:** January 2026  
**Status:** 📋 **Comprehensive List**

---

## 🎯 Migration Strategy

All pages currently under `/dashboard/` need to be migrated to decoupled module routes with uniform `ModuleTopBar` components.

---

## 📊 Pages by Module

### **1. Finance Module** (`/finance/[tenantId]/...`)

**Status:** ⚠️ Partially decoupled (Home exists, but other pages still in `/dashboard/`)

**Pages to Migrate:**
1. `/dashboard/invoices` → `/finance/[tenantId]/Invoices`
2. `/dashboard/invoices/[id]` → `/finance/[tenantId]/Invoices/[id]`
3. `/dashboard/invoices/new` → `/finance/[tenantId]/Invoices/New`
4. `/dashboard/invoices/[id]/edit` → `/finance/[tenantId]/Invoices/[id]/Edit`
5. `/dashboard/accounting` → `/finance/[tenantId]/Accounting`
6. `/dashboard/accounting/expenses` → `/finance/[tenantId]/Accounting/Expenses`
7. `/dashboard/accounting/expenses/new` → `/finance/[tenantId]/Accounting/Expenses/New`
8. `/dashboard/accounting/expenses/reports` → `/finance/[tenantId]/Accounting/Expenses/Reports`
9. `/dashboard/accounting/reports` → `/finance/[tenantId]/Accounting/Reports`
10. `/dashboard/accounting/reports/expenses` → `/finance/[tenantId]/Accounting/Reports/Expenses`
11. `/dashboard/accounting/reports/revenue` → `/finance/[tenantId]/Accounting/Reports/Revenue`
12. `/dashboard/purchases/orders` → `/finance/[tenantId]/Purchase-Orders`
13. `/dashboard/purchases/orders/[id]` → `/finance/[tenantId]/Purchase-Orders/[id]`
14. `/dashboard/purchases/orders/new` → `/finance/[tenantId]/Purchase-Orders/New`
15. `/dashboard/purchases/vendors` → `/finance/[tenantId]/Vendors`
16. `/dashboard/purchases/vendors/new` → `/finance/[tenantId]/Vendors/New`
17. `/dashboard/gst` → `/finance/[tenantId]/GST`
18. `/dashboard/gst/gstr-1` → `/finance/[tenantId]/GST/GSTR-1`
19. `/dashboard/gst/gstr-3b` → `/finance/[tenantId]/GST/GSTR-3B`
20. `/dashboard/billing` → `/finance/[tenantId]/Billing`
21. `/dashboard/recurring-billing` → `/finance/[tenantId]/Recurring-Billing`

**Total:** 21 pages

---

### **2. Sales Module** (`/sales/[tenantId]/...`)

**Status:** ⚠️ Partially decoupled (Home, Landing Pages, Checkout Pages exist)

**Pages to Migrate:**
1. `/dashboard/orders` → `/sales/[tenantId]/Orders`
2. `/dashboard/orders/[id]` → `/sales/[tenantId]/Orders/[id]`
3. `/dashboard/orders/new` → `/sales/[tenantId]/Orders/New`
4. `/dashboard/checkout-pages/new` → `/sales/[tenantId]/Checkout-Pages/New` (if not exists)
5. `/dashboard/landing-pages/new` → `/sales/[tenantId]/Landing-Pages/New` (if not exists)

**Total:** 5 pages

---

### **3. Inventory Module** (`/inventory/[tenantId]/...`)

**Status:** ✅ Mostly decoupled (Home, Products, Warehouses, StockMovements exist)

**Pages to Migrate:**
1. `/dashboard/inventory/stock-alerts` → `/inventory/[tenantId]/Stock-Alerts`
2. `/dashboard/products/[id]` → `/inventory/[tenantId]/Products/[id]` (if not exists)
3. `/dashboard/products/[id]/edit` → `/inventory/[tenantId]/Products/[id]/Edit` (if not exists)
4. `/dashboard/products/new` → `/inventory/[tenantId]/Products/New` (if not exists)

**Total:** 4 pages

---

### **4. Projects Module** (`/projects/[tenantId]/...`)

**Status:** ✅ Mostly decoupled (Home, Projects, Tasks, Time, Gantt exist)

**Pages to Migrate:**
1. `/dashboard/projects/[id]` → `/projects/[tenantId]/Projects/[id]` (if not exists)
2. `/dashboard/projects/new` → `/projects/[tenantId]/Projects/New` (if not exists)
3. `/dashboard/projects/kanban` → `/projects/[tenantId]/Kanban`
4. `/dashboard/tasks/[id]` → `/projects/[tenantId]/Tasks/[id]` (if not exists)
5. `/dashboard/tasks/new` → `/projects/[tenantId]/Tasks/New` (if not exists)

**Total:** 5 pages

---

### **5. HR Module** (`/hr/[tenantId]/...`)

**Status:** ⚠️ Partially decoupled (Home, Employees exist)

**Pages to Migrate:**
1. `/dashboard/hr/employees/[id]` → `/hr/[tenantId]/Employees/[id]` (if not exists)
2. `/dashboard/hr/payroll` → `/hr/[tenantId]/Payroll`
3. `/dashboard/hr/payroll/cycles` → `/hr/[tenantId]/Payroll/Cycles`
4. `/dashboard/hr/payroll/cycles/[id]` → `/hr/[tenantId]/Payroll/Cycles/[id]`
5. `/dashboard/hr/payroll/cycles/new` → `/hr/[tenantId]/Payroll/Cycles/New`
6. `/dashboard/hr/payroll/runs/[id]` → `/hr/[tenantId]/Payroll/Runs/[id]`
7. `/dashboard/hr/payroll/reports` → `/hr/[tenantId]/Payroll/Reports`
8. `/dashboard/hr/payroll/salary-structures` → `/hr/[tenantId]/Payroll/Salary-Structures`
9. `/dashboard/hr/payroll/salary-structures/new` → `/hr/[tenantId]/Payroll/Salary-Structures/New`
10. `/dashboard/hr/leave/requests` → `/hr/[tenantId]/Leave/Requests`
11. `/dashboard/hr/leave/apply` → `/hr/[tenantId]/Leave/Apply`
12. `/dashboard/hr/leave/balances` → `/hr/[tenantId]/Leave/Balances`
13. `/dashboard/hr/attendance/calendar` → `/hr/[tenantId]/Attendance/Calendar`
14. `/dashboard/hr/attendance/check-in` → `/hr/[tenantId]/Attendance/Check-In`
15. `/dashboard/hr/hiring/candidates` → `/hr/[tenantId]/Hiring/Candidates`
16. `/dashboard/hr/hiring/candidates/[id]` → `/hr/[tenantId]/Hiring/Candidates/[id]`
17. `/dashboard/hr/hiring/candidates/new` → `/hr/[tenantId]/Hiring/Candidates/New`
18. `/dashboard/hr/hiring/interviews` → `/hr/[tenantId]/Hiring/Interviews`
19. `/dashboard/hr/hiring/interviews/new` → `/hr/[tenantId]/Hiring/Interviews/New`
20. `/dashboard/hr/hiring/job-requisitions` → `/hr/[tenantId]/Hiring/Job-Requisitions`
21. `/dashboard/hr/hiring/job-requisitions/[id]` → `/hr/[tenantId]/Hiring/Job-Requisitions/[id]`
22. `/dashboard/hr/hiring/job-requisitions/new` → `/hr/[tenantId]/Hiring/Job-Requisitions/New`
23. `/dashboard/hr/hiring/offers` → `/hr/[tenantId]/Hiring/Offers`
24. `/dashboard/hr/hiring/offers/new` → `/hr/[tenantId]/Hiring/Offers/New`
25. `/dashboard/hr/onboarding/templates` → `/hr/[tenantId]/Onboarding/Templates`
26. `/dashboard/hr/onboarding/templates/[id]` → `/hr/[tenantId]/Onboarding/Templates/[id]`
27. `/dashboard/hr/onboarding/templates/new` → `/hr/[tenantId]/Onboarding/Templates/New`
28. `/dashboard/hr/onboarding/instances` → `/hr/[tenantId]/Onboarding/Instances`
29. `/dashboard/hr/tax-declarations` → `/hr/[tenantId]/Tax-Declarations`
30. `/dashboard/hr/tax-declarations/[id]` → `/hr/[tenantId]/Tax-Declarations/[id]`
31. `/dashboard/hr/tax-declarations/new` → `/hr/[tenantId]/Tax-Declarations/New`

**Total:** 31 pages

---

### **6. Marketing Module** (`/marketing/[tenantId]/...`)

**Status:** ⚠️ Partially decoupled (Home, Campaigns exist)

**Pages to Migrate:**
1. `/dashboard/marketing/campaigns/[id]` → `/marketing/[tenantId]/Campaigns/[id]` (if not exists)
2. `/dashboard/marketing/campaigns/new` → `/marketing/[tenantId]/Campaigns/New` (if not exists)
3. `/dashboard/marketing/analytics` → `/marketing/[tenantId]/Analytics`
4. `/dashboard/marketing/segments` → `/marketing/[tenantId]/Segments`
5. `/dashboard/marketing/social` → `/marketing/[tenantId]/Social`
6. `/dashboard/marketing/social/create-post` → `/marketing/[tenantId]/Social/Create-Post`
7. `/dashboard/marketing/social/create-image` → `/marketing/[tenantId]/Social/Create-Image`
8. `/dashboard/marketing/social/schedule` → `/marketing/[tenantId]/Social/Schedule`
9. `/dashboard/marketing/ai-influencer` → `/marketing/[tenantId]/AI-Influencer`
10. `/dashboard/marketing/ai-influencer/new` → `/marketing/[tenantId]/AI-Influencer/New`

**Total:** 10 pages

---

### **7. CRM Module** (`/crm/[tenantId]/...`)

**Status:** ✅ Mostly decoupled (Home, Contacts, Deals, Leads, Accounts, Tasks exist)

**Pages to Migrate:**
1. `/dashboard/contacts/[id]` → `/crm/[tenantId]/Contacts/[id]` (if not exists)
2. `/dashboard/contacts/[id]/edit` → `/crm/[tenantId]/Contacts/[id]/Edit` (if not exists)
3. `/dashboard/contacts/new` → `/crm/[tenantId]/Contacts/New` (if not exists)
4. `/dashboard/deals/[id]` → `/crm/[tenantId]/Deals/[id]` (if not exists)
5. `/dashboard/deals/[id]/edit` → `/crm/[tenantId]/Deals/[id]/Edit` (if not exists)
6. `/dashboard/deals/new` → `/crm/[tenantId]/Deals/New` (if not exists)

**Total:** 6 pages

---

### **8. AI Studio Module** (`/ai-studio/[tenantId]/...`)

**Status:** ✅ Mostly decoupled (All main features exist)

**Pages to Migrate:**
1. `/dashboard/websites/[id]` → `/ai-studio/[tenantId]/Websites/[id]` (if not exists)
2. `/dashboard/websites/[id]/builder` → `/ai-studio/[tenantId]/Websites/[id]/Builder` (if not exists)
3. `/dashboard/websites/[id]/preview` → `/ai-studio/[tenantId]/Websites/[id]/Preview` (if not exists)
4. `/dashboard/websites/[id]/analytics` → `/ai-studio/[tenantId]/Websites/[id]/Analytics` (if not exists)
5. `/dashboard/websites/[id]/analytics/heatmap` → `/ai-studio/[tenantId]/Websites/[id]/Analytics/Heatmap` (if not exists)
6. `/dashboard/websites/[id]/pages/[pageId]/preview` → `/ai-studio/[tenantId]/Websites/[id]/Pages/[pageId]/Preview` (if not exists)
7. `/dashboard/websites/new` → `/ai-studio/[tenantId]/Websites/New` (if not exists)
8. `/dashboard/logos/[id]` → `/ai-studio/[tenantId]/Logos/[id]` (if not exists)
9. `/dashboard/ai-calling/[id]/settings` → `/voice-agents/[tenantId]/Settings/[id]`
10. `/dashboard/voice-agents/[id]/calls` → `/voice-agents/[tenantId]/Calls/[id]`
11. `/dashboard/voice-agents/analytics` → `/voice-agents/[tenantId]/Analytics`
12. `/dashboard/voice-agents/new` → `/voice-agents/[tenantId]/New` (if not exists)

**Total:** 12 pages

---

## 📊 Summary

| Module | Pages to Migrate | Priority |
|--------|------------------|----------|
| Finance | 21 | 🔴 High |
| HR | 31 | 🔴 High |
| Marketing | 10 | 🟡 Medium |
| Sales | 5 | 🟡 Medium |
| CRM | 6 | 🟡 Medium |
| Projects | 5 | 🟡 Medium |
| Inventory | 4 | 🟡 Medium |
| AI Studio | 12 | 🟢 Low |
| **TOTAL** | **94 pages** | |

---

## ✅ Pages to Keep in `/dashboard/` (Global Features)

These pages should remain in `/dashboard/` as they are global/shared features:
- Settings (`/dashboard/settings/*`)
- Admin (`/dashboard/admin/*`)
- Productivity Suite (`/dashboard/pdf/*`, `/dashboard/spreadsheets/*`, `/dashboard/docs/*`, `/dashboard/slides/*`, `/dashboard/drive`)
- Communication (`/dashboard/email/*`, `/dashboard/whatsapp/*`, `/dashboard/calls/*`, `/dashboard/chat`, `/dashboard/meet/*`)
- Standalone Features (`/dashboard/appointments/*`, `/dashboard/news`, `/dashboard/help-center/*`, `/dashboard/contracts/*`, `/dashboard/workflows/*`, `/dashboard/events/*`, `/dashboard/competitors`, `/dashboard/analytics/*`, `/dashboard/reports/*`, `/dashboard/dashboards/custom`, `/dashboard/locations/*`, `/dashboard/business-units`, `/dashboard/resellers`, `/dashboard/ondc`, `/dashboard/pos`, `/dashboard/fssai`, `/dashboard/field-service/*`, `/dashboard/assets`, `/dashboard/integrations`, `/dashboard/api-docs`, `/dashboard/setup/*`, `/dashboard/industry`, `/dashboard/modules`, `/dashboard/industries/*`)

---

## 🔧 Migration Steps for Each Page

1. **Create new route structure** with `[tenantId]` parameter
2. **Move page file** from `/dashboard/...` to module route
3. **Add `ModuleTopBar` layout** with uniform features
4. **Create redirect page** in old location
5. **Update navigation links** throughout the app
6. **Test navigation** and module switching

---

**Status:** Ready to begin migration

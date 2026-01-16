# Core Business Modules - Pending Tasks

**Date:** January 2026  
**Status:** 📋 **COMPREHENSIVE PENDING TASKS**

---

## 📊 **Module Status Overview**

| Module | Document Requirement | Current Status | Decoupled Structure | Module Switcher | Priority |
|--------|---------------------|----------------|---------------------|-----------------|----------|
| **CRM** | `crm.payaid.in` | ✅ **COMPLETE** | ✅ `/crm/[tenantId]/Home/` | ✅ | ✅ Done |
| **Sales** | `sales.payaid.in` | ✅ **COMPLETE** | ✅ `/sales/[tenantId]/Home/` | ✅ | ✅ Done |
| **Projects** | `projects.payaid.in` | ✅ **COMPLETE** | ✅ `/projects/[tenantId]/Home/` | ✅ | ✅ Done |
| **Inventory** | `inventory.payaid.in` | ✅ **COMPLETE** | ✅ `/inventory/[tenantId]/Home/` | ✅ | ✅ Done |
| **Finance** | `finance.payaid.in` | ⚠️ **PARTIAL** | ✅ `/finance/[tenantId]/Home/` | ❌ Missing | 🔴 High |
| **Marketing** | `marketing.payaid.in` | ❌ **NOT DECOUPLED** | ❌ `/dashboard/marketing/*` | ❌ | 🟡 Medium |
| **HR** | `hr.payaid.in` | ❌ **NOT DECOUPLED** | ❌ `/dashboard/hr/*` | ❌ | 🟡 Medium |

---

## 🔴 **PRIORITY 1: Complete Finance Module** (Quick - 1-2 days)

### **Current Status:**
- ✅ Finance module entry point exists (`/finance/page.tsx`)
- ✅ Finance dashboard exists (`/finance/[tenantId]/Home/page.tsx`)
- ✅ Finance API routes exist (`/api/finance/*`)
- ✅ Finance in Module Switcher (but URL points to old structure)
- ❌ **Missing:** Module Switcher on Finance pages
- ❌ **Missing:** Finance-specific pages (Invoices, Accounting, Purchase Orders, GST)
- ❌ **Missing:** Finance top bar navigation updated

### **Pending Tasks:**

1. **Add Module Switcher to Finance Dashboard**
   - File: `app/finance/[tenantId]/Home/page.tsx`
   - Add `<ModuleSwitcher currentModule="finance" />` to top bar

2. **Create Finance-Specific Pages:**
   - `/finance/[tenantId]/Invoices/page.tsx` - Move from `/dashboard/invoices`
   - `/finance/[tenantId]/Accounting/page.tsx` - Move from `/dashboard/accounting`
   - `/finance/[tenantId]/Purchase-Orders/page.tsx` - Move from `/dashboard/purchases/orders`
   - `/finance/[tenantId]/GST/page.tsx` - Move from `/dashboard/gst`
   - `/finance/[tenantId]/Reports/page.tsx` - Finance reports

3. **Update Finance Top Bar Navigation:**
   - Current: Points to `/dashboard/invoices`, `/dashboard/accounting`, etc.
   - Required: Points to `/finance/[tenantId]/Invoices`, `/finance/[tenantId]/Accounting`, etc.

4. **Update Finance Layout:**
   - File: `app/finance/[tenantId]/Home/layout.tsx` (create if missing)
   - Ensure no sidebar (decoupled architecture)

5. **Update Login Redirects:**
   - `/dashboard/invoices` → `/finance/[tenantId]/Invoices`
   - `/dashboard/accounting` → `/finance/[tenantId]/Accounting`
   - `/dashboard/purchases` → `/finance/[tenantId]/Purchase-Orders`
   - `/dashboard/gst` → `/finance/[tenantId]/GST`

6. **Verify Finance API Routes:**
   - Ensure all routes use `requireModuleAccess(request, 'finance')`
   - Check: `/api/finance/*`, `/api/invoices/*`, `/api/accounting/*`

---

## 🟡 **PRIORITY 2: Decouple Marketing Module** (Medium - 3-5 days)

### **Current Status:**
- ❌ Marketing pages in old structure: `/dashboard/marketing/*`
- ⚠️ Marketing API routes may exist but need verification
- ❌ No Marketing module structure
- ❌ Not in Module Switcher (or points to old structure)

### **Pending Tasks:**

1. **Create Marketing Module Structure:**
   ```
   app/marketing/
   ├── page.tsx (entry point)
   └── [tenantId]/
       ├── Home/
       │   ├── page.tsx (dashboard)
       │   └── layout.tsx
       ├── Campaigns/
       │   └── page.tsx
       ├── Email/
       │   └── page.tsx
       ├── Social-Media/
       │   └── page.tsx
       ├── WhatsApp/
       │   └── page.tsx
       ├── Analytics/
       │   └── page.tsx
       └── Segments/
           └── page.tsx
   ```

2. **Migrate Marketing Pages:**
   - From: `app/dashboard/marketing/campaigns/page.tsx`
   - To: `app/marketing/[tenantId]/Campaigns/page.tsx`
   - Similar migration for all Marketing pages

3. **Create Marketing Dashboard:**
   - KPI cards: Total Campaigns, Active Campaigns, Email Sent, Social Posts, WhatsApp Messages
   - Charts: Campaign Performance, Email Open Rates, Social Engagement
   - Recent campaigns, top performing campaigns

4. **Update Marketing Top Bar:**
   - Navigation: Home, Campaigns, Email, Social Media, WhatsApp, Analytics, Segments
   - Add Module Switcher
   - Remove sidebar

5. **Update Marketing API Routes:**
   - Verify all routes use `requireModuleAccess(request, 'marketing')`
   - Check: `/api/marketing/*`, `/api/campaigns/*`, `/api/email/*`

6. **Update Module Switcher:**
   - Change Marketing URL from `/dashboard/marketing/campaigns` to `/marketing`
   - Ensure it redirects to `/marketing/[tenantId]/Home/`

7. **Update Login Redirects:**
   - `/dashboard/marketing/*` → `/marketing/[tenantId]/Home/`

---

## 🟡 **PRIORITY 3: Decouple HR Module** (Medium - 3-5 days)

### **Current Status:**
- ❌ HR pages in old structure: `/dashboard/hr/*`
- ⚠️ HR API routes may exist but need verification
- ❌ No HR module structure
- ❌ Not in Module Switcher (or points to old structure)

### **Pending Tasks:**

1. **Create HR Module Structure:**
   ```
   app/hr/
   ├── page.tsx (entry point)
   └── [tenantId]/
       ├── Home/
       │   ├── page.tsx (dashboard)
       │   └── layout.tsx
       ├── Employees/
       │   └── page.tsx
       ├── Payroll/
       │   ├── page.tsx
       │   ├── Cycles/
       │   ├── Salary-Structures/
       │   └── Reports/
       ├── Leave/
       │   ├── page.tsx
       │   ├── Requests/
       │   └── Balances/
       ├── Attendance/
       │   ├── page.tsx
       │   └── Calendar/
       ├── Hiring/
       │   ├── page.tsx
       │   ├── Candidates/
       │   ├── Job-Requisitions/
       │   └── Interviews/
       ├── Onboarding/
       │   ├── page.tsx
       │   ├── Templates/
       │   └── Instances/
       └── Reports/
           └── page.tsx
   ```

2. **Migrate HR Pages:**
   - From: `app/dashboard/hr/employees/page.tsx`
   - To: `app/hr/[tenantId]/Employees/page.tsx`
   - Similar migration for all HR pages (Payroll, Leave, Attendance, Hiring, Onboarding)

3. **Create HR Dashboard:**
   - KPI cards: Total Employees, Active Employees, On Leave, Pending Payroll, Open Positions
   - Charts: Employee Growth, Leave Trends, Attendance Rate, Payroll Distribution
   - Recent hires, upcoming birthdays, leave requests

4. **Update HR Top Bar:**
   - Navigation: Home, Employees, Payroll, Leave, Attendance, Hiring, Onboarding, Reports
   - Add Module Switcher
   - Remove sidebar

5. **Update HR API Routes:**
   - Verify all routes use `requireModuleAccess(request, 'hr')`
   - Check: `/api/hr/*`, `/api/employees/*`, `/api/payroll/*`, `/api/leave/*`

6. **Update Module Switcher:**
   - Change HR URL from `/dashboard/hr/employees` to `/hr`
   - Ensure it redirects to `/hr/[tenantId]/Home/`

7. **Update Login Redirects:**
   - `/dashboard/hr/*` → `/hr/[tenantId]/Home/`

---

## 📋 **Additional Pending Tasks**

### **API Gateway Routes:**
- [ ] Contacts gateway (`/api/gateway/contacts`) - For Sales/Finance
- [ ] Deals gateway (`/api/gateway/deals`) - For Finance
- [ ] Accounts gateway (`/api/gateway/accounts`) - For Sales/Finance
- [ ] Invoices gateway (`/api/gateway/invoices`) - For CRM/Sales

### **Module Switcher Updates:**
- [ ] Add Marketing module (update URL)
- [ ] Add HR module (update URL)
- [ ] Verify Finance module (already added, but verify)

### **Login Redirects:**
- [ ] Finance: `/dashboard/invoices` → `/finance/[tenantId]/Invoices`
- [ ] Finance: `/dashboard/accounting` → `/finance/[tenantId]/Accounting`
- [ ] Finance: `/dashboard/purchases` → `/finance/[tenantId]/Purchase-Orders`
- [ ] Finance: `/dashboard/gst` → `/finance/[tenantId]/GST`
- [ ] Marketing: `/dashboard/marketing/*` → `/marketing/[tenantId]/Home/`
- [ ] HR: `/dashboard/hr/*` → `/hr/[tenantId]/Home/`

---

## 🎯 **Recommended Implementation Order**

### **Week 5: Complete Finance Module**
1. Add Module Switcher to Finance dashboard
2. Create Finance-specific pages (Invoices, Accounting, Purchase Orders, GST)
3. Update Finance top bar navigation
4. Update login redirects
5. Verify Finance API routes

**Estimated Time:** 1-2 days

### **Week 6: Decouple Marketing Module**
1. Create Marketing module structure
2. Migrate Marketing pages
3. Create Marketing dashboard
4. Update Marketing API routes
5. Update Module Switcher and login redirects

**Estimated Time:** 3-5 days

### **Week 7: Decouple HR Module**
1. Create HR module structure
2. Migrate HR pages
3. Create HR dashboard
4. Update HR API routes
5. Update Module Switcher and login redirects

**Estimated Time:** 3-5 days

---

## 📊 **Progress Summary**

**Completed Modules (4/7):** ✅
- CRM ✅
- Sales ✅
- Projects ✅
- Inventory ✅

**Partially Complete (1/7):** ⚠️
- Finance ⚠️ (70% - needs Module Switcher and pages)

**Not Decoupled (2/7):** ❌
- Marketing ❌
- HR ❌

**Overall Core Modules Progress:** 🟡 **~65% Complete**

---

## 🚀 **Next Steps**

**Immediate Actions:**
1. Complete Finance module (add Module Switcher, create pages)
2. Start Marketing module decoupling
3. Start HR module decoupling

**Estimated Total Time:** ~2 weeks to complete all core modules


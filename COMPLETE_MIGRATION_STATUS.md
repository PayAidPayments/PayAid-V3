# 🔄 Complete Monolithic to Decoupled Migration Status

**Date:** January 2026  
**Status:** 🚧 **In Progress** (2/94 pages completed)

---

## 📊 Executive Summary

**Total Pages to Migrate:** 94 pages  
**Pages Completed:** 2 pages  
**Pages Remaining:** 92 pages  
**Progress:** 2.1%

---

## ✅ Completed Migrations

### **Finance Module** (2/21 pages)

1. ✅ `/dashboard/invoices` → `/finance/[tenantId]/Invoices`
   - Created: `app/finance/[tenantId]/Invoices/layout.tsx` (with ModuleTopBar)
   - Created: `app/finance/[tenantId]/Invoices/page.tsx`
   - Updated: `app/dashboard/invoices/page.tsx` (redirect)
   - Status: ✅ Complete

2. ✅ `/dashboard/invoices/[id]` → `/finance/[tenantId]/Invoices/[id]`
   - Created: `app/finance/[tenantId]/Invoices/[id]/layout.tsx` (with ModuleTopBar)
   - Created: `app/finance/[tenantId]/Invoices/[id]/page.tsx`
   - Updated: `app/dashboard/invoices/[id]/page.tsx` (redirect)
   - Status: ✅ Complete

3. ✅ `/finance/[tenantId]/Home` - Updated to use ModuleTopBar
   - Created: `app/finance/[tenantId]/Home/layout.tsx` (with ModuleTopBar)
   - Updated: `app/finance/[tenantId]/Home/page.tsx` (removed custom header)
   - Status: ✅ Complete

---

## 🚧 Remaining Migrations by Module

### **1. Finance Module** (19 pages remaining)

**High Priority:**
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

### **2. HR Module** (31 pages)

**All `/dashboard/hr/*` pages:**
- Payroll (cycles, runs, reports, salary-structures)
- Leave (requests, apply, balances)
- Attendance (calendar, check-in)
- Hiring (candidates, interviews, job-requisitions, offers)
- Onboarding (templates, instances)
- Tax Declarations
- Employees detail/edit pages

### **3. Marketing Module** (10 pages)

- Campaigns detail/new
- Analytics, Segments
- Social (create-post, create-image, schedule)
- AI Influencer

### **4. Sales Module** (5 pages)

- Orders (list, detail, new)
- Checkout Pages new
- Landing Pages new

### **5. CRM Module** (6 pages)

- Contacts (detail, edit, new)
- Deals (detail, edit, new)

### **6. Projects Module** (5 pages)

- Projects detail/new
- Tasks detail/new
- Kanban view

### **7. Inventory Module** (4 pages)

- Stock Alerts
- Products detail/edit/new

### **8. AI Studio Module** (12 pages)

- Websites (detail, builder, preview, analytics, heatmap, pages preview, new)
- Logos detail
- Voice Agents (settings, calls, analytics, new)

---

## 🔧 Migration Pattern (Established)

### **Step 1: Create Layout with ModuleTopBar**

```tsx
// app/[module]/[tenantId]/[Feature]/layout.tsx
'use client'
import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function FeatureLayout({ children }) {
  const params = useParams()
  const tenantId = params.tenantId as string
  
  const topBarItems = [
    { name: 'Home', href: `/[module]/${tenantId}/Home` },
    { name: 'Feature', href: `/[module]/${tenantId}/Feature` },
    // ... other items
  ]
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="module-id"
          moduleName="Module Name"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### **Step 2: Move Page Content**

- Copy page from `/dashboard/...` to new location
- Update all internal links to use new routes with `tenantId`
- Replace `BackToApps` (handled by ModuleTopBar)
- Replace loading states with `PageLoading`
- Add dark mode classes where needed

### **Step 3: Create Redirect**

```tsx
// app/dashboard/[old-path]/page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function OldRoutePage() {
  const router = useRouter()
  const { tenant } = useAuthStore()
  
  useEffect(() => {
    if (tenant?.id) {
      router.replace(`/[module]/${tenant.id}/[new-route]`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])
  
  return <PageLoading message="Redirecting..." fullScreen={true} />
}
```

### **Step 4: Update Navigation**

- Update sidebar links
- Update module switcher
- Update any hardcoded links in components

---

## ✅ ModuleTopBar Features (All Implemented)

The `ModuleTopBar` component already includes:
- ✅ Profile settings dropdown (with link to `/dashboard/settings/profile`)
- ✅ Module switching options (ModuleSwitcher component)
- ✅ Dark/light mode selector (ThemeToggle component)
- ✅ Notification bell (NotificationBell component)
- ✅ News icon (admin-controlled, Newspaper icon)
- ✅ Module-specific navigation items

**No additional work needed** - ModuleTopBar is complete!

---

## 📋 Pages That Need ModuleTopBar Updates

### **Existing Decoupled Pages (Need Header Updates):**

These pages already exist but use custom headers instead of ModuleTopBar:

1. **CRM Module:**
   - `/crm/[tenantId]/Home/page.tsx` - Custom header (needs ModuleTopBar layout)
   - `/crm/[tenantId]/Contacts/page.tsx` - Custom header
   - `/crm/[tenantId]/Deals/page.tsx` - Custom header
   - `/crm/[tenantId]/Leads/page.tsx` - Custom header
   - `/crm/[tenantId]/Accounts/page.tsx` - Custom header
   - `/crm/[tenantId]/Tasks/page.tsx` - Custom header

2. **Finance Module:**
   - ✅ `/finance/[tenantId]/Home/page.tsx` - **UPDATED** (now uses ModuleTopBar)

3. **Projects Module:**
   - `/projects/[tenantId]/Home/page.tsx` - Custom header
   - `/projects/[tenantId]/Projects/page.tsx` - Custom header
   - `/projects/[tenantId]/Tasks/page.tsx` - Custom header
   - `/projects/[tenantId]/Time/page.tsx` - Custom header
   - `/projects/[tenantId]/Gantt/page.tsx` - Custom header

4. **Sales Module:**
   - `/sales/[tenantId]/Home/page.tsx` - Custom header
   - `/sales/[tenantId]/Landing-Pages/page.tsx` - Custom header
   - `/sales/[tenantId]/Checkout-Pages/page.tsx` - Custom header
   - `/sales/[tenantId]/Orders/page.tsx` - Custom header

5. **Inventory Module:**
   - `/inventory/[tenantId]/Home/page.tsx` - Custom header
   - `/inventory/[tenantId]/Products/page.tsx` - Custom header
   - `/inventory/[tenantId]/Warehouses/page.tsx` - Custom header
   - `/inventory/[tenantId]/StockMovements/page.tsx` - Custom header

6. **Marketing Module:**
   - `/marketing/[tenantId]/Home/page.tsx` - Custom header
   - `/marketing/[tenantId]/Campaigns/page.tsx` - Custom header

7. **HR Module:**
   - `/hr/[tenantId]/Home/page.tsx` - Custom header
   - `/hr/[tenantId]/Employees/page.tsx` - Custom header

---

## 🎯 Migration Priority

### **Phase 1: Update Existing Decoupled Pages** (High Priority)
Update all existing decoupled pages to use ModuleTopBar instead of custom headers:
- CRM (6 pages)
- Finance (1 page) ✅ Done
- Projects (5 pages)
- Sales (4 pages)
- Inventory (4 pages)
- Marketing (2 pages)
- HR (2 pages)

**Total:** 24 pages need header updates

### **Phase 2: Migrate Finance Module** (High Priority)
Complete Finance module migration (19 remaining pages)

### **Phase 3: Migrate HR Module** (High Priority)
Complete HR module migration (31 pages)

### **Phase 4: Migrate Remaining Modules** (Medium Priority)
- Marketing (10 pages)
- Sales (5 pages)
- CRM (6 pages)
- Projects (5 pages)
- Inventory (4 pages)
- AI Studio (12 pages)

---

## 📝 Next Steps

1. **Continue Finance module migration** (19 pages)
2. **Update existing decoupled pages** to use ModuleTopBar (24 pages)
3. **Migrate HR module** (31 pages)
4. **Migrate remaining modules** (42 pages)

---

## 🔍 How to Identify Pages Needing Migration

**Search for:**
- Files in `/app/dashboard/` directory
- Custom header implementations (not using ModuleTopBar)
- `BackToApps` component usage
- Links pointing to `/dashboard/...` routes

**Pattern to Replace:**
```tsx
// OLD: Custom header
<div className="bg-white/80 backdrop-blur-sm border-b...">
  <nav>...</nav>
  <ModuleSwitcher />
</div>

// NEW: ModuleTopBar in layout
<ModuleTopBar moduleId="..." moduleName="..." items={...} />
```

---

**Status:** Migration pattern established. Ready to continue with remaining pages.

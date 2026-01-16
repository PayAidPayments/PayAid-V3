# 🔄 Monolithic to Decoupled Migration Progress

**Date:** January 2026  
**Status:** 🚧 **In Progress**

---

## 📊 Migration Summary

**Total Pages to Migrate:** 94 pages  
**Pages Migrated:** 1 (Finance Invoices)  
**Pages Remaining:** 93 pages

---

## ✅ Completed Migrations

### **Finance Module**
1. ✅ `/dashboard/invoices` → `/finance/[tenantId]/Invoices`
   - Created: `app/finance/[tenantId]/Invoices/layout.tsx` (with ModuleTopBar)
   - Created: `app/finance/[tenantId]/Invoices/page.tsx`
   - Updated: `app/dashboard/invoices/page.tsx` (redirect)

---

## 🚧 In Progress

### **Finance Module** (20 more pages)
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

---

## 📋 Pending Migrations

### **HR Module** (31 pages)
- All `/dashboard/hr/*` pages → `/hr/[tenantId]/...`

### **Marketing Module** (10 pages)
- All `/dashboard/marketing/*` pages → `/marketing/[tenantId]/...`

### **Sales Module** (5 pages)
- `/dashboard/orders/*` → `/sales/[tenantId]/Orders/*`

### **CRM Module** (6 pages)
- `/dashboard/contacts/*` → `/crm/[tenantId]/Contacts/*`
- `/dashboard/deals/*` → `/crm/[tenantId]/Deals/*`

### **Projects Module** (5 pages)
- `/dashboard/projects/*` → `/projects/[tenantId]/Projects/*`
- `/dashboard/tasks/*` → `/projects/[tenantId]/Tasks/*`
- `/dashboard/projects/kanban` → `/projects/[tenantId]/Kanban`

### **Inventory Module** (4 pages)
- `/dashboard/inventory/stock-alerts` → `/inventory/[tenantId]/Stock-Alerts`
- `/dashboard/products/*` → `/inventory/[tenantId]/Products/*`

### **AI Studio Module** (12 pages)
- `/dashboard/websites/*` → `/ai-studio/[tenantId]/Websites/*`
- `/dashboard/logos/*` → `/ai-studio/[tenantId]/Logos/*`
- `/dashboard/ai-calling/*` → `/voice-agents/[tenantId]/...`

---

## 🔧 Migration Pattern

For each page migration:

1. **Create Layout** (if not exists):
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

2. **Move Page Content**:
   - Copy page content from `/dashboard/...` to new location
   - Update all internal links to use new routes
   - Replace `BackToApps` with ModuleTopBar (handled by layout)
   - Replace loading states with `PageLoading`
   - Update API calls if needed

3. **Create Redirect**:
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

4. **Update Navigation Links**:
   - Update sidebar navigation
   - Update module switcher
   - Update any hardcoded links

---

## ✅ ModuleTopBar Requirements

All decoupled pages must use `ModuleTopBar` with:
- ✅ Profile settings dropdown
- ✅ Module switching options
- ✅ Dark/light mode selector
- ✅ Notification bell
- ✅ News icon (admin-controlled)
- ✅ Module-specific navigation items

---

## 📝 Next Steps

1. Continue Finance module migration (20 pages)
2. Migrate HR module (31 pages)
3. Migrate Marketing module (10 pages)
4. Migrate remaining modules
5. Update existing decoupled pages (CRM, Projects, etc.) to use ModuleTopBar instead of custom headers

---

**Status:** Migration in progress - Finance Invoices completed as example

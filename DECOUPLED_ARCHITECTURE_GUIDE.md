# 🏗️ Decoupled Architecture Guide

**Date:** January 2026  
**Status:** ✅ **ACTIVE** - All new pages MUST use this structure

---

## ⚠️ **IMPORTANT: Monolithic Architecture is DEPRECATED**

**The `/dashboard/` monolithic structure is being phased out.** All new pages MUST be created in the decoupled module structure.

---

## 📐 Decoupled Structure Pattern

### **Route Structure**
```
/[module]/[tenantId]/[Feature]/page.tsx
/[module]/[tenantId]/[Feature]/layout.tsx
```

### **Available Modules**
- `/crm/[tenantId]/...` - CRM Module
- `/sales/[tenantId]/...` - Sales Module
- `/marketing/[tenantId]/...` - Marketing Module
- `/finance/[tenantId]/...` - Finance Module
- `/hr/[tenantId]/...` - HR Module
- `/projects/[tenantId]/...` - Projects Module
- `/inventory/[tenantId]/...` - Inventory Module
- `/ai-studio/[tenantId]/...` - AI Studio Module
- `/voice-agents/[tenantId]/...` - Voice Agents Module

---

## ✅ Required Components for Every Page

### **1. Layout File (layout.tsx)**

Every page route MUST have a `layout.tsx` with `ModuleTopBar`:

```tsx
'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function FeatureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/${module}/${tenantId}/Home` },
    { name: 'Feature 1', href: `/${module}/${tenantId}/Feature1` },
    { name: 'Feature 2', href: `/${module}/${tenantId}/Feature2` },
    // ... module-specific navigation items
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="module-name"
          moduleName="Module Name"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### **2. Page File (page.tsx)**

Every page MUST:
- ✅ Use `useParams()` to get `tenantId`
- ✅ Support dark mode (add `dark:` classes)
- ✅ Use `PageLoading` component for loading states
- ✅ Use tenant-aware routing (`/${module}/${tenantId}/...`)

**Example:**
```tsx
'use client'

import { useParams } from 'next/navigation'
import { PageLoading } from '@/components/ui/loading'
import { useQuery } from '@tanstack/react-query'

export default function FeaturePage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  const { data, isLoading } = useQuery({
    queryKey: ['feature', tenantId],
    queryFn: async () => {
      // Fetch data
    },
  })

  if (isLoading) {
    return <PageLoading message="Loading..." fullScreen={false} />
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Feature Title
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Feature description
      </p>
      {/* Page content with dark mode support */}
    </div>
  )
}
```

---

## 🎨 Dark Mode Requirements

All components MUST support dark mode. Use these Tailwind classes:

- Text: `text-gray-900 dark:text-gray-100` (headings)
- Text: `text-gray-600 dark:text-gray-400` (body text)
- Backgrounds: `bg-white dark:bg-gray-800`
- Borders: `border-gray-200 dark:border-gray-700`
- Cards: `dark:bg-gray-800 dark:border-gray-700`
- Buttons: `dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600`
- Inputs: `dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600`
- Tables: `dark:text-gray-300` (headers), `dark:text-gray-100` (cells)

---

## 🔄 Routing Patterns

### **Internal Links**
Always use tenant-aware routes:
```tsx
<Link href={`/${module}/${tenantId}/Feature`}>
  Feature Name
</Link>
```

### **Navigation After Actions**
```tsx
// After creating/updating
router.push(`/${module}/${tenantId}/Feature/${id}`)

// After deleting
router.push(`/${module}/${tenantId}/Feature`)
```

### **Getting tenantId**
```tsx
const params = useParams()
const tenantId = params.tenantId as string
```

---

## 📦 Required Imports

### **Standard Imports**
```tsx
import { useParams } from 'next/navigation'
import { PageLoading } from '@/components/ui/loading'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
```

### **UI Components**
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
// ... other shadcn/ui components
```

---

## ❌ What NOT to Do

### **❌ DON'T Create Pages in `/dashboard/`**
```tsx
// ❌ WRONG
app/dashboard/feature/page.tsx

// ✅ CORRECT
app/module/[tenantId]/Feature/page.tsx
```

### **❌ DON'T Use Custom Headers**
```tsx
// ❌ WRONG - Don't create custom navigation bars
<div className="bg-white border-b">
  <nav>...</nav>
</div>

// ✅ CORRECT - Use ModuleTopBar in layout.tsx
```

### **❌ DON'T Skip Dark Mode**
```tsx
// ❌ WRONG
<h1 className="text-2xl font-bold text-gray-900">Title</h1>

// ✅ CORRECT
<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Title</h1>
```

### **❌ DON'T Use Hardcoded Routes**
```tsx
// ❌ WRONG
<Link href="/dashboard/feature">Feature</Link>

// ✅ CORRECT
<Link href={`/${module}/${tenantId}/Feature`}>Feature</Link>
```

---

## 📋 Checklist for New Pages

When creating a new page, ensure:

- [ ] Page is in `/[module]/[tenantId]/[Feature]/page.tsx`
- [ ] Layout exists at `/[module]/[tenantId]/[Feature]/layout.tsx`
- [ ] Layout includes `ModuleTopBar` with module navigation
- [ ] Page uses `useParams()` to get `tenantId`
- [ ] All text elements have dark mode classes
- [ ] All UI components (Card, Button, Input, etc.) have dark mode classes
- [ ] Loading states use `PageLoading` component
- [ ] All internal links use tenant-aware routes
- [ ] Navigation after actions uses tenant-aware routes
- [ ] Page is responsive and accessible

---

## 🔗 Module-Specific Navigation Items

### **CRM Module**
```tsx
const topBarItems = [
  { name: 'Home', href: `/crm/${tenantId}/Home` },
  { name: 'Contacts', href: `/crm/${tenantId}/Contacts` },
  { name: 'Deals', href: `/crm/${tenantId}/Deals` },
  { name: 'Tasks', href: `/crm/${tenantId}/Tasks` },
  { name: 'Reports', href: `/crm/${tenantId}/Reports` },
]
```

### **Finance Module**
```tsx
const topBarItems = [
  { name: 'Home', href: `/finance/${tenantId}/Home` },
  { name: 'Invoices', href: `/finance/${tenantId}/Invoices` },
  { name: 'Accounting', href: `/finance/${tenantId}/Accounting` },
  { name: 'Purchase Orders', href: `/finance/${tenantId}/Purchase-Orders` },
  { name: 'GST Reports', href: `/finance/${tenantId}/GST` },
]
```

### **Projects Module**
```tsx
const topBarItems = [
  { name: 'Home', href: `/projects/${tenantId}/Home` },
  { name: 'Projects', href: `/projects/${tenantId}/Projects` },
  { name: 'Tasks', href: `/projects/${tenantId}/Tasks` },
  { name: 'Time', href: `/projects/${tenantId}/Time` },
  { name: 'Gantt', href: `/projects/${tenantId}/Gantt` },
]
```

### **Inventory Module**
```tsx
const topBarItems = [
  { name: 'Home', href: `/inventory/${tenantId}/Home` },
  { name: 'Products', href: `/inventory/${tenantId}/Products` },
  { name: 'Warehouses', href: `/inventory/${tenantId}/Warehouses` },
  { name: 'Stock Movements', href: `/inventory/${tenantId}/StockMovements` },
  { name: 'Stock Alerts', href: `/inventory/${tenantId}/Stock-Alerts` },
]
```

---

## 🚀 Quick Start Template

### **Layout Template**
```tsx
'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function FeatureLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/${module}/${tenantId}/Home` },
    // Add module-specific items
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar moduleId="module" moduleName="Module" items={topBarItems} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
```

### **Page Template**
```tsx
'use client'

import { useParams } from 'next/navigation'
import { PageLoading } from '@/components/ui/loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FeaturePage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Feature Title
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        Feature description
      </p>
      
      <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Content</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Your content here */}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 📝 Notes

- **Monolithic `/dashboard/` routes are redirects only** - They redirect to decoupled routes
- **All new features must be in decoupled structure** - No exceptions
- **ModuleTopBar provides consistent navigation** - Don't create custom headers
- **Dark mode is mandatory** - All components must support it
- **Tenant-aware routing is required** - Always use `tenantId` in routes

---

**Last Updated:** January 2026  
**Status:** ✅ Active - All new development must follow this guide

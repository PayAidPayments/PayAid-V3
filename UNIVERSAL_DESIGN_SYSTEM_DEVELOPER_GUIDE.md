# Universal Design System - Developer Guide

**Version:** 1.0  
**Last Updated:** January 2026  
**Applies To:** All 28 PayAid V3 Modules

---

## 📌 **MASTER RULES**

### **1. Currency Formatting (MANDATORY)**
- ✅ **ALWAYS** use `formatINR()` utilities from `@/lib/utils/formatINR`
- ❌ **NEVER** use `toLocaleString()` directly for currency
- ❌ **NEVER** use `$` symbol anywhere
- ✅ **ALWAYS** use Lakhs/Crores for amounts >= 1L

### **2. Module Structure (MANDATORY)**
- ✅ **ALWAYS** use `UniversalModuleLayout` wrapper
- ✅ **ALWAYS** use `UniversalModuleHero` for hero section
- ✅ **ALWAYS** use `GlassCard` for content sections
- ✅ **ALWAYS** maintain 32px gaps between sections

### **3. Module Configuration (MANDATORY)**
- ✅ **ALWAYS** use `getModuleConfig(moduleId)` for gradients/icons
- ✅ **ALWAYS** follow module-specific gradient colors
- ✅ **ALWAYS** use module-specific icons from `lucide-react`

---

## 🚀 **QUICK START**

### **Step 1: Import Required Components**

```typescript
import { UniversalModuleLayout } from '@/components/modules/UniversalModuleLayout'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
```

### **Step 2: Get Module Configuration**

```typescript
const moduleConfig = getModuleConfig('crm') // Replace with your module ID
// Returns: { id, name, gradientFrom, gradientTo, icon, description }
```

### **Step 3: Define Navigation Items**

```typescript
const topBarItems = [
  { name: 'Home', href: `/${moduleConfig.id}/${tenantId}/Home` },
  { name: 'Section 1', href: `/${moduleConfig.id}/${tenantId}/Section1` },
  // Add more items...
]
```

### **Step 4: Define Hero Metrics (4 Cards)**

```typescript
const heroMetrics = [
  {
    label: 'Total Revenue',
    value: formatINRForDisplay(450000), // Use formatINRForDisplay for currency
    change: 15,
    trend: 'up',
    color: 'purple',
  },
  {
    label: 'Active Items',
    value: '125', // Non-currency values as strings
    change: 12,
    trend: 'up',
    color: 'gold',
  },
  // Add 2 more metrics...
]
```

### **Step 5: Build Module Page**

```typescript
export default function YourModulePage({ tenantId }: { tenantId: string }) {
  return (
    <UniversalModuleLayout
      moduleId={moduleConfig.id}
      moduleName={moduleConfig.name}
      topBarItems={topBarItems}
    >
      {/* Hero Section */}
      <UniversalModuleHero
        moduleName={moduleConfig.name}
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {/* Content Sections - 32px gap */}
      <div className="p-6 space-y-8">
        <GlassCard>
          {/* Your content */}
        </GlassCard>
      </div>
    </UniversalModuleLayout>
  )
}
```

---

## 💰 **CURRENCY FORMATTING GUIDE**

### **When to Use Each Function:**

| Function | Use Case | Example Output |
|----------|----------|----------------|
| `formatINRForDisplay(amount)` | **UI Cards, Metrics** | `₹4.5L` or `₹50,000` |
| `formatINRCompact(amount)` | **Always Compact** | `₹4.5L` or `₹1.2Cr` |
| `formatINRStandard(amount)` | **Always Standard** | `₹4,50,000.00` |
| `formatINR(amount, options)` | **Custom Formatting** | Configurable |

### **Examples:**

```typescript
// ✅ CORRECT - UI Display
<span>{formatINRForDisplay(450000)}</span> // "₹4.5L"

// ✅ CORRECT - Always Compact
<span>{formatINRCompact(12000000)}</span> // "₹1.2Cr"

// ✅ CORRECT - Always Standard
<span>{formatINRStandard(50000)}</span> // "₹50,000.00"

// ❌ WRONG - Direct formatting
<span>₹{amount.toLocaleString('en-IN')}</span> // Inconsistent

// ❌ WRONG - Dollar symbol
<span>${amount}</span> // FORBIDDEN
```

---

## 🎨 **MODULE GRADIENT COLORS**

### **How to Use:**

```typescript
const moduleConfig = getModuleConfig('crm')
// moduleConfig.gradientFrom = 'from-purple-500'
// moduleConfig.gradientTo = 'to-purple-700'

<UniversalModuleHero
  gradientFrom={moduleConfig.gradientFrom}
  gradientTo={moduleConfig.gradientTo}
  // ...
/>
```

### **Available Modules:**

| Module ID | Gradient From | Gradient To |
|-----------|--------------|-------------|
| `crm` | `from-purple-500` | `to-purple-700` |
| `finance` | `from-gold-500` | `to-gold-700` |
| `sales` | `from-success` | `to-emerald-700` |
| `hr` | `from-info` | `to-blue-700` |
| `inventory` | `from-amber-600` | `to-amber-800` |
| `analytics` | `from-purple-600` | `to-indigo-700` |
| `marketing` | `from-pink-500` | `to-rose-600` |
| `projects` | `from-cyan-500` | `to-cyan-700` |

**See `lib/modules/module-config.ts` for all 28 modules.**

---

## 📐 **SPACING STANDARDS**

### **32px Gap System:**

```typescript
// ✅ CORRECT - 32px gap (space-y-8 = 2rem = 32px)
<div className="p-6 space-y-8">
  <GlassCard>Section 1</GlassCard>
  <GlassCard>Section 2</GlassCard>
</div>

// ❌ WRONG - Inconsistent spacing
<div className="p-6 space-y-4"> {/* 16px gap */}
  <GlassCard>Section 1</GlassCard>
</div>
```

### **Padding Standards:**

- **Page Container**: `p-6` (24px)
- **GlassCard**: `p-6` (24px)
- **Section Gaps**: `space-y-8` (32px)

---

## ✅ **CHECKLIST FOR NEW MODULES**

### **Before Coding:**
- [ ] Check if module config exists in `module-config.ts`
- [ ] If not, add module config with gradient and icon
- [ ] Review existing similar modules for reference

### **During Development:**
- [ ] Use `UniversalModuleLayout` wrapper
- [ ] Use `UniversalModuleHero` for hero section
- [ ] Use `GlassCard` for all content sections
- [ ] Use `formatINRForDisplay()` for all currency
- [ ] Maintain 32px gaps between sections
- [ ] Use module-specific gradient colors
- [ ] Use module-specific icons

### **Before Committing:**
- [ ] No `$` symbols anywhere
- [ ] All currency uses `formatINR` utilities
- [ ] Consistent spacing (32px gaps)
- [ ] Module gradient matches config
- [ ] Responsive design tested
- [ ] TypeScript errors resolved

---

## 🔍 **CODE REVIEW CHECKLIST**

### **Currency:**
- [ ] All currency uses `formatINR*` functions
- [ ] No `toLocaleString()` for currency
- [ ] No `$` symbols
- [ ] Lakhs/Crores for large amounts

### **Structure:**
- [ ] Uses `UniversalModuleLayout`
- [ ] Uses `UniversalModuleHero`
- [ ] Uses `GlassCard` for sections
- [ ] 32px gaps between sections

### **Design:**
- [ ] Module gradient matches config
- [ ] Module icon matches config
- [ ] Consistent spacing
- [ ] PayAid brand colors

### **Functionality:**
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states

---

## 📚 **REFERENCE FILES**

1. **Currency Utilities**: `lib/utils/formatINR.ts`
2. **Module Config**: `lib/modules/module-config.ts`
3. **Universal Components**: `components/modules/`
4. **Template**: `components/modules/ModuleTemplate.tsx`
5. **Implementation Guide**: `UNIVERSAL_DESIGN_SYSTEM_IMPLEMENTATION.md`

---

## 🎯 **RESULT**

Following this guide ensures:
- ✅ Consistent UI/UX across all 28 modules
- ✅ Indian currency standards (₹ only)
- ✅ Standardized module structure
- ✅ Brand-compliant design
- ✅ Easy maintenance and updates

**All modules will have the same look and feel while maintaining unique personality through gradients and icons!**

---

**Status:** ✅ **DEVELOPER GUIDE COMPLETE**

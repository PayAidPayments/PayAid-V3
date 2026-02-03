# UDS (Universal Design System) Compliance Update

**Date:** January 2026  
**Status:** 🟡 **IN PROGRESS** - Finance Module Partially Updated

---

## ✅ **COMPLETED UPDATES**

### **1. Finance Module Layout** ✅
- **File:** `app/finance/[tenantId]/Home/layout.tsx`
- **Update:** Replaced `ModuleTopBar` with `UniversalModuleLayout` wrapper
- **Status:** ✅ Complete

### **2. Finance Dashboard Page** ✅
- **File:** `app/finance/[tenantId]/Home/page.tsx`
- **Status:** Already using UDS components:
  - ✅ `UniversalModuleHero` for hero section
  - ✅ `GlassCard` for content sections
  - ✅ `formatINRForDisplay` for currency formatting
  - ✅ Module configuration from `getModuleConfig('finance')`

### **3. Invoice Creation Page** ✅
- **File:** `app/finance/[tenantId]/Invoices/new/page.tsx`
- **Updates:**
  - ✅ Added `formatINRStandard` import
  - ✅ Replaced all `toLocaleString('en-IN')` with `formatINRStandard()`
  - ✅ Updated 10+ currency display instances

---

## ⏳ **PENDING UPDATES**

### **1. Finance Module - Currency Formatting** ⏳
**Files needing updates:**
- `app/finance/[tenantId]/GST/GSTR-3B/page.tsx` - 12 instances
- `app/finance/[tenantId]/GST/GSTR-1/page.tsx` - 12 instances
- `app/finance/[tenantId]/Purchase-Orders/new/page.tsx` - 5 instances
- `app/finance/[tenantId]/Purchase-Orders/[id]/page.tsx` - 6 instances
- `app/finance/[tenantId]/Purchase-Orders/page.tsx` - 1 instance
- `app/finance/[tenantId]/Accounting/Reports/page.tsx` - 6 instances
- `app/finance/[tenantId]/Accounting/Expenses/page.tsx` - 3 instances
- `app/finance/[tenantId]/Invoices/[id]/page.tsx` - Multiple instances
- `app/finance/[tenantId]/Recurring-Billing/page.tsx` - 2 instances
- `app/finance/[tenantId]/Billing/page.tsx` - 2 instances

**Action Required:**
1. Add import: `import { formatINRStandard, formatINRForDisplay } from '@/lib/utils/formatINR'`
2. Replace `toLocaleString('en-IN', { minimumFractionDigits: 2 })` with `formatINRStandard(amount)`
3. Replace `toLocaleString('en-IN')` with `formatINRForDisplay(amount)`

### **2. Finance Components** ⏳
**Files to check:**
- `components/finance/FinancialAlerts.tsx`
- `components/finance/CashFlowManagement.tsx`
- `components/finance/FinancialForecasting.tsx`
- `components/finance/FinancialAnalytics.tsx`
- `components/finance/InvoiceList.tsx`
- `components/finance/FinancialReports.tsx`

**Action Required:**
1. Ensure all use `GlassCard` for card sections
2. Ensure all use `formatINR` functions for currency
3. Ensure consistent spacing (32px gaps between sections)
4. Ensure PayAid brand colors (#53328A Purple, #F5C700 Gold)

### **3. Other Modules** ⏳
**Modules to check:**
- CRM Module
- Sales Module
- HR Module
- Inventory Module
- Analytics Module
- Marketing Module
- Projects Module
- Communication Module
- All other 28 modules

**Action Required:**
1. Verify all use `UniversalModuleLayout`
2. Verify all use `UniversalModuleHero` for hero sections
3. Verify all use `GlassCard` for content sections
4. Verify all use `formatINR` functions for currency
5. Verify all use module configuration from `getModuleConfig()`

### **4. Card Components** ⏳
**Files to check:**
- `components/ui/card.tsx` - Already UDS compliant ✅
- All custom card components across modules

**Action Required:**
1. Replace custom cards with `GlassCard` where appropriate
2. Ensure consistent styling (glass morphism, shadows, spacing)
3. Ensure hover effects and animations (150ms ease-in-out)

---

## 📋 **UDS STANDARDS CHECKLIST**

### **Layout & Structure:**
- [x] Use `UniversalModuleLayout` wrapper
- [x] Use `UniversalModuleHero` for hero sections
- [x] Use `GlassCard` for content sections
- [x] Maintain 32px gaps between sections
- [x] Use 8px grid system for spacing

### **Currency Formatting:**
- [x] Use `formatINRForDisplay()` for card/metrics
- [x] Use `formatINRStandard()` for detailed amounts
- [x] Use `formatINRCompact()` for compact display
- [ ] Replace all `toLocaleString('en-IN')` calls
- [ ] Ensure no `$` symbols anywhere

### **Colors & Branding:**
- [x] PayAid Purple (#53328A) for primary actions
- [x] PayAid Gold (#F5C700) for accents
- [x] Module-specific gradients from `getModuleConfig()`
- [ ] Verify all modules use brand colors

### **Typography:**
- [x] Inter font family
- [x] Consistent hierarchy
- [x] Proper weights (400, 500, 600, 700)

### **Animations:**
- [x] 150ms ease-in-out transitions
- [x] Hover effects on cards
- [x] Staggered animations for lists

---

## 🚀 **NEXT STEPS**

1. **Complete Finance Module Currency Updates** (Priority: HIGH)
   - Update all remaining finance pages with formatINR functions
   - Estimated time: 30-60 minutes

2. **Update Finance Components** (Priority: MEDIUM)
   - Verify and update all finance components
   - Estimated time: 20-30 minutes

3. **Audit Other Modules** (Priority: MEDIUM)
   - Check all 28 modules for UDS compliance
   - Create update plan for non-compliant modules
   - Estimated time: 1-2 hours

4. **Card Component Standardization** (Priority: LOW)
   - Replace custom cards with GlassCard
   - Estimated time: 30-60 minutes

---

## 📝 **NOTES**

- All currency must use ₹ (INR) only - zero tolerance for $ symbols
- All modules should follow the same structure and design patterns
- GlassCard provides consistent glass morphism effect across all modules
- formatINR functions handle Lakhs/Crores notation automatically
- Module configurations ensure unique gradients while maintaining brand consistency

---

**Last Updated:** January 2026

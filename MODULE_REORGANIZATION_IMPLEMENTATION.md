# 🔄 Module Reorganization Implementation Guide

**Date:** December 2025  
**Status:** ⏳ **READY FOR IMPLEMENTATION**  
**Priority:** 🟡 **HIGH** - Required before Phase 2 completion

---

## 🎯 **Overview**

Reorganize from **6 modules** to **8 modules** + **3 global areas** as per the new structure.

---

## 📋 **Implementation Checklist**

### **Step 1: Database Migration** ⏳

1. **Update Module Definitions:**
   ```bash
   npx tsx scripts/seed-modules-v2.ts
   ```
   - Adds new modules: `sales`, `marketing`, `finance`, `communication`, `ai-studio`
   - Updates existing: `crm`, `analytics`
   - Deprecates old: `invoicing`, `accounting`, `whatsapp`

2. **Migrate Tenant Licenses:**
   ```bash
   npx tsx scripts/migrate-modules-v1-to-v2.ts
   ```
   - Maps old modules to new modules
   - Updates `Tenant.licensedModules` array

---

### **Step 2: Update Sidebar Classification** ⏳

**File:** `components/layout/sidebar.tsx`

**Changes:**
- Update module assignments for all sidebar items
- Reference: `SIDEBAR_ITEMS_CLASSIFICATION_V2.md`

**Key Updates:**
- Marketing items → `marketing` module
- Sales items → `sales` module
- Finance items → `finance` module
- Communication items → `communication` module
- AI Studio items → `ai-studio` module

---

### **Step 3: Update API Routes** ⏳

**Files:** All route files in `app/api/*`

**Changes:**
- Update `requireModuleAccess()` calls with new module IDs
- Example: `requireModuleAccess(request, 'invoicing')` → `requireModuleAccess(request, 'finance')`

**Route Mapping:**
- `/api/invoices/*` → `finance`
- `/api/accounting/*` → `finance`
- `/api/gst/*` → `finance`
- `/api/marketing/*` → `marketing`
- `/api/whatsapp/*` → `marketing`
- `/api/landing-pages/*` → `sales`
- `/api/checkout-pages/*` → `sales`
- `/api/websites/*` → `ai-studio`
- `/api/logos/*` → `ai-studio`
- `/api/ai/*` → `ai-studio`
- `/api/calls/*` → `ai-studio`
- `/api/email/*` → `communication`
- `/api/chat/*` → `communication`

---

### **Step 4: Update Frontend Pages** ⏳

**Files:** All page files in `app/dashboard/*`

**Changes:**
- Update `<ModuleGate module="...">` with new module IDs
- Update module assignments

**Page Mapping:**
- `/dashboard/invoices/*` → `finance`
- `/dashboard/accounting/*` → `finance`
- `/dashboard/gst/*` → `finance`
- `/dashboard/marketing/*` → `marketing`
- `/dashboard/whatsapp/*` → `marketing`
- `/dashboard/landing-pages/*` → `sales`
- `/dashboard/checkout-pages/*` → `sales`
- `/dashboard/websites/*` → `ai-studio`
- `/dashboard/logos/*` → `ai-studio`
- `/dashboard/ai/*` → `ai-studio`
- `/dashboard/calls/*` → `ai-studio`
- `/dashboard/email/*` → `communication`
- `/dashboard/chat/*` → `communication`

---

### **Step 5: Update Admin Panel** ⏳

**File:** `app/dashboard/admin/modules/page.tsx`

**Changes:**
- Update module list to show 8 new modules
- Remove old modules (`invoicing`, `accounting`, `whatsapp`)
- Add new modules (`sales`, `marketing`, `finance`, `communication`, `ai-studio`)

---

### **Step 6: Update Type Definitions** ⏳

**File:** `packages/@payaid/types/src/index.ts`

**Changes:**
- Update `ModuleId` type to include new modules:
  ```typescript
  export type ModuleId = 
    | 'crm' 
    | 'sales' 
    | 'marketing' 
    | 'finance' 
    | 'hr' 
    | 'communication' 
    | 'ai-studio' 
    | 'analytics'
  ```

---

### **Step 7: Update Documentation** ⏳

**Files to Update:**
- `PHASE2_CODEBASE_ANALYSIS.md` - Update module classification
- `PHASE2_MODULE_TEMPLATES.md` - Update module templates
- `PHASE2_DEPLOYMENT_GUIDE.md` - Update subdomain mapping

---

## 🔄 **Backward Compatibility**

### **Support Old Module IDs (Temporary)**

During transition, support both old and new module IDs:

```typescript
// In license checking middleware
const moduleMap: Record<string, string[]> = {
  'invoicing': ['finance'],
  'accounting': ['finance'],
  'whatsapp': ['marketing', 'communication'],
}

function normalizeModuleId(moduleId: string): string[] {
  return moduleMap[moduleId] || [moduleId]
}
```

**Timeline:** Support for 1-2 months, then remove.

---

## 📊 **Testing Checklist**

- [ ] Database migration runs successfully
- [ ] Tenant licenses migrated correctly
- [ ] Sidebar shows correct modules
- [ ] API routes work with new module IDs
- [ ] Frontend pages work with new module IDs
- [ ] Admin panel shows new modules
- [ ] License checking works correctly
- [ ] Old module IDs still work (backward compatibility)
- [ ] New module IDs work
- [ ] Shared features (Products, Orders) work correctly

---

## ⚠️ **Important Notes**

1. **Shared Features:**
   - Products: Shared between `crm` and `sales`
   - Orders: Can appear in both `crm` and `sales` depending on type
   - Custom Reports/Dashboards: Cross-module, appears in `analytics`

2. **Migration Order:**
   - Run database migration first
   - Then update code
   - Then test thoroughly
   - Then deploy

3. **Rollback Plan:**
   - Keep old module definitions in database
   - Keep migration script for rollback
   - Support both old and new IDs during transition

---

## 🚀 **Deployment Steps**

1. **Pre-deployment:**
   - Backup database
   - Run migration scripts in staging
   - Test thoroughly

2. **Deployment:**
   - Run `seed-modules-v2.ts`
   - Run `migrate-modules-v1-to-v2.ts`
   - Deploy code updates
   - Monitor for errors

3. **Post-deployment:**
   - Verify all tenants have correct licenses
   - Monitor error logs
   - Collect user feedback

---

**Status:** ⏳ **READY FOR IMPLEMENTATION**  
**Estimated Time:** 4-6 hours  
**Priority:** 🟡 **HIGH**

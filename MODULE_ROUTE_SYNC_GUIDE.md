# Module Route Sync Guide

**Date:** December 2025  
**Status:** ✅ **Routes Synced**  
**Purpose:** Keep routes accessible until separate deployments

---

## 🔄 **Current Setup**

### **Route Architecture**

Routes exist in **two locations**:

1. **Module Directories** (Source of Truth)
   - `crm-module/app/api/`
   - `invoicing-module/app/api/`
   - `accounting-module/app/api/`
   - `hr-module/app/api/`
   - `whatsapp-module/app/api/`
   - `analytics-module/app/api/`
   - `ai-studio-module/app/api/`
   - `communication-module/app/api/`
   - `core-module/app/api/`

2. **Monolith** (`app/api/`) - Synced Copy
   - Routes copied from modules
   - Served by Next.js
   - **Temporary** until separate deployments

---

## 📋 **Why This Setup?**

**Problem:** Next.js only serves routes from `app/api/` directory.

**Solution:** Sync routes from modules to `app/api/` so they remain accessible.

**Future:** When modules are deployed separately, routes will be served from module servers.

---

## 🔄 **Sync Process**

### **Sync Routes from Modules to Monolith**

```bash
npx tsx scripts/sync-module-routes-to-monolith.ts
```

**What it does:**
- Copies routes from module directories to `app/api/`
- Preserves file structure
- Updates all 37 routes (195 files)

**When to run:**
- After editing routes in module directories
- After pulling changes from git
- Before starting dev server (if routes are missing)

---

## ✏️ **Editing Routes**

### **✅ Correct Way**

1. **Edit routes in module directories:**
   ```
   crm-module/app/api/contacts/route.ts
   ```

2. **Sync to monolith:**
   ```bash
   npx tsx scripts/sync-module-routes-to-monolith.ts
   ```

3. **Routes are now accessible**

### **❌ Wrong Way**

- Don't edit routes directly in `app/api/` (they'll be overwritten)
- Don't forget to sync after editing

---

## 📊 **Current Status**

| Location | Routes | Status |
|----------|--------|--------|
| **Module Directories** | 37 routes | ✅ Source of Truth |
| **Monolith (app/api/)** | 37 routes | ✅ Synced Copy |
| **Accessibility** | All routes | ✅ Accessible |

---

## 🎯 **Future: Separate Deployments**

When modules are deployed separately:

1. **Remove sync script** (no longer needed)
2. **Remove routes from monolith** (modules serve their own routes)
3. **Configure subdomain routing** (e.g., `crm.payaid.com`)
4. **Set up OAuth2 SSO** (for cross-module authentication)

---

## 📝 **Scripts**

1. **`scripts/sync-module-routes-to-monolith.ts`**
   - Syncs routes from modules to monolith
   - Run after editing routes

2. **`scripts/complete-module-migration.ts`**
   - Migrates routes from monolith to modules
   - Already completed

3. **`scripts/remove-duplicate-routes.ts`**
   - Removes routes from monolith
   - Use only after separate deployments

---

## ✅ **Verification**

**Check routes are synced:**
```bash
npx tsx scripts/test-module-routes.ts
```

**Expected output:**
- ✅ All routes accessible
- ✅ Routes exist in both locations
- ✅ No duplicates (except synced copies)

---

**Status:** ✅ **Routes Synced and Accessible**  
**Next:** Frontend migration or separate deployments


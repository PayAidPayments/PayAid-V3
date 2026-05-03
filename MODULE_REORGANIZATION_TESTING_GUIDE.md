# 🧪 Module Reorganization Testing Guide

**Date:** December 2025  
**Status:** ⏳ **READY FOR TESTING**  
**Purpose:** Guide for testing the module reorganization

---

## 📋 **Pre-Testing Checklist**

### **1. Database Migration** ⏳
- [ ] Run `npx tsx scripts/seed-modules-v2.ts`
- [ ] Run `npx tsx scripts/migrate-modules-v1-to-v2.ts`
- [ ] Verify module definitions in database
- [ ] Verify tenant licenses migrated correctly

### **2. Code Updates** ✅
- ✅ Type definitions updated
- ✅ License middleware updated with backward compatibility
- ✅ Sidebar classification updated
- ✅ API routes updated (~60 routes)
- ✅ Frontend pages updated (~10 pages)
- ✅ Admin panel updated

---

## 🧪 **Testing Scenarios**

### **Test 1: Backward Compatibility** ⏳

**Scenario:** Tenant with old module IDs should still work

**Steps:**
1. Create a tenant with `licensedModules: ['invoicing', 'accounting', 'whatsapp']`
2. Login and verify:
   - Can access invoices (should work via `invoicing` → `finance` mapping)
   - Can access accounting (should work via `accounting` → `finance` mapping)
   - Can access WhatsApp (should work via `whatsapp` → `marketing` mapping)

**Expected:** All old module IDs should work via backward compatibility

---

### **Test 2: New Module IDs** ⏳

**Scenario:** Tenant with new module IDs should work

**Steps:**
1. Create a tenant with `licensedModules: ['finance', 'marketing', 'sales', 'communication', 'ai-studio']`
2. Login and verify:
   - Can access invoices (via `finance`)
   - Can access accounting (via `finance`)
   - Can access GST reports (via `finance`)
   - Can access marketing campaigns (via `marketing`)
   - Can access WhatsApp (via `marketing`)
   - Can access landing pages (via `sales`)
   - Can access websites (via `ai-studio`)
   - Can access email (via `communication`)
   - Can access chat (via `communication`)

**Expected:** All new module IDs should work correctly

---

### **Test 3: Sidebar Filtering** ⏳

**Scenario:** Sidebar should show only licensed modules

**Steps:**
1. Login with tenant that has only `finance` module
2. Verify sidebar shows:
   - ✅ Dashboard (always visible)
   - ✅ Invoices (finance)
   - ✅ Accounting (finance)
   - ✅ GST Reports (finance)
   - ❌ Marketing items (hidden)
   - ❌ Sales items (hidden)
   - ❌ AI Studio items (hidden)
   - ❌ Communication items (hidden)
   - ✅ Settings (always visible)

**Expected:** Only licensed modules visible in sidebar

---

### **Test 4: API Route Access Control** ⏳

**Scenario:** API routes should enforce module licenses

**Steps:**
1. Login with tenant that has only `finance` module
2. Test API calls:
   - ✅ `GET /api/invoices` - Should work (finance)
   - ✅ `GET /api/accounting/expenses` - Should work (finance)
   - ✅ `GET /api/gst/gstr-1` - Should work (finance)
   - ❌ `GET /api/marketing/campaigns` - Should return 403 (marketing not licensed)
   - ❌ `GET /api/whatsapp/accounts` - Should return 403 (marketing not licensed)
   - ❌ `GET /api/websites` - Should return 403 (ai-studio not licensed)
   - ❌ `GET /api/email/accounts` - Should return 403 (communication not licensed)

**Expected:** API routes enforce module licenses correctly

---

### **Test 5: Frontend Page Access Control** ⏳

**Scenario:** Frontend pages should redirect if module not licensed

**Steps:**
1. Login with tenant that has only `finance` module
2. Try to access pages:
   - ✅ `/dashboard/invoices` - Should work
   - ✅ `/dashboard/accounting` - Should work
   - ✅ `/dashboard/gst/gstr-1` - Should work
   - ❌ `/dashboard/marketing/campaigns` - Should redirect to module management
   - ❌ `/dashboard/whatsapp/accounts` - Should redirect to module management
   - ❌ `/dashboard/websites` - Should redirect to module management
   - ❌ `/dashboard/ai/chat` - Should redirect to module management

**Expected:** Pages redirect to module management if module not licensed

---

### **Test 6: Admin Panel** ⏳

**Scenario:** Admin panel should show 8 new modules

**Steps:**
1. Login as admin/owner
2. Navigate to `/dashboard/admin/modules`
3. Verify:
   - Shows 8 modules: CRM, Sales, Marketing, Finance, HR, Communication, AI Studio, Analytics
   - Does NOT show old modules: invoicing, accounting, whatsapp
   - Can toggle modules on/off
   - Changes reflect immediately in sidebar

**Expected:** Admin panel shows correct modules and works correctly

---

### **Test 7: Module Migration** ⏳

**Scenario:** Existing tenants should have licenses migrated correctly

**Steps:**
1. Before migration, note tenant's `licensedModules`
2. Run migration script
3. Verify tenant's `licensedModules` updated:
   - `['invoicing']` → `['finance']`
   - `['accounting']` → `['finance']`
   - `['whatsapp']` → `['marketing', 'communication']`
   - `['crm']` → `['crm']` (unchanged)
   - `['hr']` → `['hr']` (unchanged)
   - `['analytics']` → `['analytics']` (unchanged)

**Expected:** Tenant licenses migrated correctly

---

## 🔍 **Verification Checklist**

- [ ] All old module IDs work (backward compatibility)
- [ ] All new module IDs work
- [ ] Sidebar shows correct modules
- [ ] API routes enforce licenses correctly
- [ ] Frontend pages redirect correctly
- [ ] Admin panel shows 8 modules
- [ ] Module toggling works
- [ ] License checking works
- [ ] No console errors
- [ ] No TypeScript errors

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: Module not found error**
**Fix:** Run database migration scripts

### **Issue 2: Old module IDs not working**
**Fix:** Check license middleware backward compatibility

### **Issue 3: Sidebar showing wrong modules**
**Fix:** Clear browser cache, check `licensedModules` in JWT token

### **Issue 4: API routes returning 403**
**Fix:** Verify tenant has correct module licenses

---

**Status:** ⏳ **READY FOR TESTING**  
**Next:** Run database migration and test all scenarios

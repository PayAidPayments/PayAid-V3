# Phase 1 Manual Testing Guide

**Date:** December 2025  
**Purpose:** Step-by-step guide for manual testing of Phase 1 features

---

## 🎯 Testing Overview

This guide covers manual testing of:
1. ✅ API endpoints (automated script available)
2. ⏳ Frontend components (browser testing required)
3. ⏳ Admin panel (browser testing required)

---

## 🚀 Quick Start

### **1. Run Automated API Tests**

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run the test script
npx tsx scripts/test-phase1-manual.ts
```

This will test:
- ✅ API endpoint access with licenses
- ✅ API endpoint blocking without licenses
- ✅ Admin panel API
- ✅ JWT token content

---

## 🧪 Manual Browser Testing

### **Prerequisites**

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Create Test Users** (if not already created):
   - Run: `npx tsx scripts/test-phase1-integration.ts` (creates test users)

3. **Test User Credentials:**
   - Full Access: `test-full@example.com` / `Test@1234`
   - CRM Only: `test-crm@example.com` / `Test@1234`
   - Free Tier: `test-free@example.com` / `Test@1234`

---

## 📋 Test Checklist

### **Test Suite 1: Login & JWT Token**

#### ✅ Test 1.1: Login Includes Licensing Info

**Steps:**
1. Open browser to `http://localhost:3000/login`
2. Login with `test-full@example.com` / `Test@1234`
3. Open browser DevTools → Application → Local Storage
4. Check `auth_token` value
5. Decode JWT token (use jwt.io or console)

**Expected:**
- ✅ Token contains `licensedModules` array
- ✅ Token contains `subscriptionTier` field
- ✅ `licensedModules` includes all 6 modules

**Verify:**
```javascript
// In browser console
const token = localStorage.getItem('auth_token')
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Licensed Modules:', payload.licensedModules)
console.log('Subscription Tier:', payload.subscriptionTier)
```

---

### **Test Suite 2: Sidebar Module Filtering**

#### ✅ Test 2.1: Sidebar Shows Only Licensed Modules

**Steps:**
1. Login with `test-crm@example.com` (CRM only)
2. Navigate to dashboard
3. Check sidebar

**Expected:**
- ✅ CRM links visible and clickable
- ✅ Other modules show 🔒 badge or are hidden
- ✅ Locked modules cannot be accessed

**Verify:**
- Contacts link works
- Deals link works
- Invoices link shows 🔒 or redirects
- HR link shows 🔒 or redirects

---

#### ✅ Test 2.2: Full Access User Sees All Modules

**Steps:**
1. Login with `test-full@example.com` (all modules)
2. Navigate to dashboard
3. Check sidebar

**Expected:**
- ✅ All module links visible
- ✅ No 🔒 badges
- ✅ All links are clickable

---

### **Test Suite 3: ModuleGate Component**

#### ✅ Test 3.1: Protected Page Blocks Unlicensed Access

**Steps:**
1. Login with `test-crm@example.com` (CRM only)
2. Try to navigate to `/dashboard/invoices` (direct URL)
3. Check what happens

**Expected:**
- ✅ Redirects to `/dashboard/admin/modules`
- ✅ OR shows upgrade prompt
- ✅ Does NOT show invoices page

---

#### ✅ Test 3.2: Protected Page Allows Licensed Access

**Steps:**
1. Login with `test-full@example.com` (all modules)
2. Navigate to `/dashboard/invoices`
3. Check page loads

**Expected:**
- ✅ Invoices page loads correctly
- ✅ No redirect
- ✅ Full functionality available

---

### **Test Suite 4: Admin Panel**

#### ✅ Test 4.1: Admin Panel Access

**Steps:**
1. Login with `test-full@example.com` (owner/admin)
2. Navigate to `/dashboard/admin/modules`
3. Check page loads

**Expected:**
- ✅ Page loads successfully
- ✅ Shows list of all modules
- ✅ Shows current licensed modules
- ✅ Shows subscription tier

---

#### ✅ Test 4.2: License Toggle (Add License)

**Steps:**
1. Login with `test-crm@example.com` (CRM only)
2. Navigate to `/dashboard/admin/modules`
3. Click "Activate License" for Invoicing module
4. Wait for update
5. Logout and login again
6. Try to access `/dashboard/invoices`

**Expected:**
- ✅ Button changes to "Remove License"
- ✅ Invoicing shows "Licensed" badge
- ✅ After re-login, can access invoices page
- ✅ API calls to `/api/invoices` succeed

---

#### ✅ Test 4.3: License Toggle (Remove License)

**Steps:**
1. Login with `test-full@example.com` (all modules)
2. Navigate to `/dashboard/admin/modules`
3. Click "Remove License" for HR module
4. Wait for update
5. Logout and login again
6. Try to access `/dashboard/hr/employees`

**Expected:**
- ✅ Button changes to "Activate License"
- ✅ HR badge removed
- ✅ After re-login, cannot access HR pages
- ✅ API calls to `/api/hr/employees` return 403

---

### **Test Suite 5: API Endpoints (Browser Network Tab)**

#### ✅ Test 5.1: Licensed API Call Succeeds

**Steps:**
1. Login with `test-full@example.com`
2. Open DevTools → Network tab
3. Navigate to `/dashboard/contacts`
4. Check API call to `/api/contacts`

**Expected:**
- ✅ Request status: `200 OK`
- ✅ Response contains contacts data
- ✅ No license error

---

#### ✅ Test 5.2: Unlicensed API Call Fails

**Steps:**
1. Login with `test-crm@example.com` (CRM only)
2. Open DevTools → Network tab
3. Try to navigate to `/dashboard/invoices` (or make direct API call)
4. Check API call to `/api/invoices`

**Expected:**
- ✅ Request status: `403 Forbidden`
- ✅ Response contains error:
  ```json
  {
    "error": "Module 'invoicing' is not licensed...",
    "code": "MODULE_NOT_LICENSED",
    "moduleId": "invoicing"
  }
  ```

---

## 📊 Test Results Template

```
Manual Testing Results
Date: [Date]
Tester: [Name]

Test Suite 1: Login & JWT
  [ ] Test 1.1: Login includes licensing info

Test Suite 2: Sidebar
  [ ] Test 2.1: Sidebar shows only licensed modules
  [ ] Test 2.2: Full access user sees all modules

Test Suite 3: ModuleGate
  [ ] Test 3.1: Protected page blocks unlicensed access
  [ ] Test 3.2: Protected page allows licensed access

Test Suite 4: Admin Panel
  [ ] Test 4.1: Admin panel access
  [ ] Test 4.2: License toggle (add)
  [ ] Test 4.3: License toggle (remove)

Test Suite 5: API Endpoints
  [ ] Test 5.1: Licensed API call succeeds
  [ ] Test 5.2: Unlicensed API call fails

Overall: [X] Passed / [Y] Failed
```

---

## 🐛 Common Issues & Solutions

### Issue: Sidebar shows all modules

**Solution:**
- Check `usePayAidAuth` hook is working
- Verify JWT token contains licensing info
- Check sidebar filtering logic

### Issue: ModuleGate doesn't redirect

**Solution:**
- Check `hasModule()` function
- Verify JWT decoding works
- Check redirect path

### Issue: Admin panel doesn't update licenses

**Solution:**
- Check API endpoint permissions
- Verify tenant ID matches
- Check database update query
- User must logout/login to refresh token

### Issue: API returns 500 instead of 403

**Solution:**
- Check error handling in route
- Verify `handleLicenseError` is called
- Check middleware import

---

## ✅ Success Criteria

All tests pass when:

- [x] JWT tokens contain licensing info
- [x] Sidebar filters modules correctly
- [x] ModuleGate blocks unlicensed access
- [x] Admin panel can toggle licenses
- [x] API endpoints return correct status codes
- [x] No console errors
- [x] No TypeScript errors

---

## 🎯 Next Steps After Testing

1. **Document Issues:** Create issues for any failures
2. **Fix Critical Bugs:** Address blocking issues
3. **Re-test:** Run failed tests again
4. **Performance Test:** Check for performance regressions
5. **Security Audit:** Verify license checks can't be bypassed

---

**Testing Status:** Ready to Execute  
**Estimated Time:** 30-60 minutes  
**Priority:** High (before production deployment)

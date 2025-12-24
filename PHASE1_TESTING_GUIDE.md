# Phase 1 Testing Guide

**Date:** December 2025  
**Purpose:** Comprehensive testing checklist for Phase 1 licensing system

---

## 🎯 Testing Overview

This guide covers all test scenarios for Phase 1 licensing implementation. Test systematically to ensure everything works correctly.

---

## ✅ Pre-Testing Setup

### 1. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 2. Seed Module Definitions
```bash
# Run seed script (see PHASE1_MIGRATION_GUIDE.md)
npx prisma db seed
```

### 3. Create Test Users

**User 1: Full Access (All Modules)**
- Email: `test-full@example.com`
- Tenant: `test-tenant-full`
- Licensed Modules: `['crm', 'invoicing', 'accounting', 'hr', 'whatsapp', 'analytics']`
- Subscription Tier: `professional`

**User 2: Limited Access (CRM Only)**
- Email: `test-crm@example.com`
- Tenant: `test-tenant-crm`
- Licensed Modules: `['crm']`
- Subscription Tier: `starter`

**User 3: No Access (Free Tier)**
- Email: `test-free@example.com`
- Tenant: `test-tenant-free`
- Licensed Modules: `[]`
- Subscription Tier: `free`

---

## 🧪 Test Scenarios

### **Test Suite 1: Backend API License Checking**

#### Test 1.1: Licensed Module Access (Should Pass)

**Setup:**
- User: `test-full@example.com` (has CRM license)
- Endpoint: `GET /api/contacts`

**Steps:**
1. Login and get JWT token
2. Call API with Authorization header
3. Verify response

**Expected Result:**
- ✅ Status: `200 OK`
- ✅ Returns contacts list
- ✅ No license error

**Test Command:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/contacts
```

---

#### Test 1.2: Unlicensed Module Access (Should Fail)

**Setup:**
- User: `test-crm@example.com` (only CRM license, no Invoicing)
- Endpoint: `GET /api/invoices`

**Steps:**
1. Login and get JWT token
2. Call API with Authorization header
3. Verify response

**Expected Result:**
- ✅ Status: `403 Forbidden`
- ✅ Error message: `"Module 'invoicing' is not licensed"`
- ✅ Error code: `MODULE_NOT_LICENSED`

**Test Command:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/invoices
```

**Expected Response:**
```json
{
  "error": "Module 'invoicing' is not licensed. Licensed modules: crm",
  "code": "MODULE_NOT_LICENSED",
  "moduleId": "invoicing"
}
```

---

#### Test 1.3: Missing Authorization Token

**Setup:**
- No token provided
- Endpoint: `GET /api/contacts`

**Expected Result:**
- ✅ Status: `403 Forbidden`
- ✅ Error: `"No authorization token provided"`

---

#### Test 1.4: Invalid Token

**Setup:**
- Invalid/expired token
- Endpoint: `GET /api/contacts`

**Expected Result:**
- ✅ Status: `403 Forbidden`
- ✅ Error: `"Invalid or expired token"`

---

#### Test 1.5: Multiple Module Routes

**Test Each Protected Route:**

| Route | Module | Test User | Expected |
|-------|--------|-----------|----------|
| `GET /api/contacts` | `crm` | Full Access | ✅ 200 |
| `POST /api/contacts` | `crm` | Full Access | ✅ 200 |
| `GET /api/deals` | `crm` | Full Access | ✅ 200 |
| `GET /api/invoices` | `invoicing` | Full Access | ✅ 200 |
| `GET /api/hr/employees` | `hr` | Full Access | ✅ 200 |
| `GET /api/accounting/expenses` | `accounting` | Full Access | ✅ 200 |
| `GET /api/whatsapp/accounts` | `whatsapp` | Full Access | ✅ 200 |
| `GET /api/invoices` | `invoicing` | CRM Only | ❌ 403 |
| `GET /api/hr/employees` | `hr` | CRM Only | ❌ 403 |

---

### **Test Suite 2: JWT Token Content**

#### Test 2.1: Token Contains Licensing Info

**Steps:**
1. Login with test user
2. Decode JWT token
3. Verify payload

**Expected JWT Payload:**
```json
{
  "userId": "...",
  "tenantId": "...",
  "licensedModules": ["crm", "invoicing"],
  "subscriptionTier": "starter",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Test:**
```typescript
import { decodeToken } from '@/lib/auth/jwt'

const token = '...' // From login response
const payload = decodeToken(token)

console.assert(payload.licensedModules, 'Missing licensedModules')
console.assert(payload.subscriptionTier, 'Missing subscriptionTier')
```

---

#### Test 2.2: Token Updates After License Change

**Steps:**
1. Login and get token (no CRM license)
2. Admin adds CRM license via admin panel
3. Login again
4. Verify new token includes CRM

**Expected:**
- ✅ First token: `licensedModules: []`
- ✅ Second token: `licensedModules: ['crm']`

---

### **Test Suite 3: Frontend Module Gating**

#### Test 3.1: Sidebar Filtering

**Setup:**
- User: `test-crm@example.com` (CRM only)

**Steps:**
1. Login
2. Navigate to dashboard
3. Check sidebar

**Expected:**
- ✅ CRM link visible and clickable
- ✅ Invoicing link shows 🔒 badge
- ✅ HR link shows 🔒 badge
- ✅ Other modules show 🔒 badge

---

#### Test 3.2: ModuleGate Component

**Setup:**
- User: `test-free@example.com` (no licenses)
- Page: `/dashboard/contacts` (protected with ModuleGate)

**Steps:**
1. Login
2. Navigate to `/dashboard/contacts`
3. Verify page content

**Expected:**
- ✅ Shows upgrade prompt
- ✅ Does NOT show contacts list
- ✅ Upgrade button links to `/dashboard/upgrade`

---

#### Test 3.3: Licensed Page Access

**Setup:**
- User: `test-full@example.com` (all licenses)
- Page: `/dashboard/invoices`

**Steps:**
1. Login
2. Navigate to `/dashboard/invoices`
3. Verify page content

**Expected:**
- ✅ Shows invoices list
- ✅ No upgrade prompt
- ✅ Full functionality available

---

#### Test 3.4: usePayAidAuth Hook

**Test in Component:**
```typescript
import { usePayAidAuth } from '@/lib/hooks/use-payaid-auth'

function TestComponent() {
  const { hasModule, licensedModules, subscriptionTier } = usePayAidAuth()
  
  // Test assertions
  console.assert(hasModule('crm') === true, 'Should have CRM')
  console.assert(hasModule('invoicing') === false, 'Should not have Invoicing')
  console.assert(licensedModules.includes('crm'), 'CRM in list')
}
```

**Expected:**
- ✅ `hasModule('crm')` returns `true` for CRM-licensed user
- ✅ `hasModule('invoicing')` returns `false` for CRM-only user
- ✅ `licensedModules` array matches tenant's licenses
- ✅ `subscriptionTier` matches tenant's tier

---

### **Test Suite 4: Admin Panel**

#### Test 4.1: Admin Access Control

**Setup:**
- User: Regular user (not admin/owner)
- Page: `/dashboard/admin/modules`

**Expected:**
- ✅ Shows "Access Denied" message
- ✅ Does NOT show module list

---

#### Test 4.2: License Toggle

**Setup:**
- User: Admin/Owner
- Tenant: Test tenant with no licenses

**Steps:**
1. Navigate to `/dashboard/admin/modules`
2. Click "Activate License" for CRM
3. Verify update

**Expected:**
- ✅ Button changes to "Remove License"
- ✅ CRM shows "Licensed" badge
- ✅ Licensed modules count increases
- ✅ Page reloads and updates

---

#### Test 4.3: License Removal

**Setup:**
- User: Admin/Owner
- Tenant: Test tenant with CRM license

**Steps:**
1. Navigate to `/dashboard/admin/modules`
2. Click "Remove License" for CRM
3. Verify update

**Expected:**
- ✅ Button changes to "Activate License"
- ✅ CRM badge removed
- ✅ Licensed modules count decreases
- ✅ After reload, CRM routes return 403

---

#### Test 4.4: API Endpoint

**Test Admin API:**
```bash
# Get current licenses
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/admin/tenants/<tenant-id>/modules

# Update licenses
curl -X PATCH \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"licensedModules": ["crm", "invoicing"]}' \
  http://localhost:3000/api/admin/tenants/<tenant-id>/modules
```

**Expected:**
- ✅ GET returns current licenses
- ✅ PATCH updates licenses
- ✅ Non-admin users get 403

---

### **Test Suite 5: Integration Tests**

#### Test 5.1: End-to-End Flow

**Scenario:** User purchases module license

**Steps:**
1. User logs in (free tier, no licenses)
2. User tries to access `/dashboard/invoices`
3. Sees upgrade prompt
4. Admin grants invoicing license via admin panel
5. User refreshes page
6. User can now access invoices

**Expected:**
- ✅ Step 2: Upgrade prompt shown
- ✅ Step 4: License granted successfully
- ✅ Step 6: Invoices page loads correctly
- ✅ API calls to `/api/invoices` succeed

---

#### Test 5.2: License Expiration (Future)

**Note:** This is for Phase 3, but test structure now:

**Steps:**
1. User has active license
2. License expires (simulate by removing license)
3. User tries to access module
4. Verify access denied

**Expected:**
- ✅ Access denied after expiration
- ✅ Upgrade prompt shown

---

## 📊 Test Results Template

```
Test Suite: [Name]
Date: [Date]
Tester: [Name]

Test 1.1: ✅ PASS / ❌ FAIL
  Notes: [Any issues or observations]

Test 1.2: ✅ PASS / ❌ FAIL
  Notes: [Any issues or observations]

...

Overall: [X] Passed / [Y] Failed
```

---

## 🐛 Common Issues & Solutions

### Issue: JWT doesn't contain licensing info

**Solution:**
- Check login route includes tenant data
- Verify `signToken` includes `licensedModules`
- Clear browser cache and re-login

### Issue: Sidebar shows all modules

**Solution:**
- Check `usePayAidAuth` hook is working
- Verify JWT decoding
- Check sidebar filtering logic

### Issue: API returns 500 instead of 403

**Solution:**
- Check error handling in route
- Verify `handleLicenseError` is called
- Check middleware import

### Issue: Admin panel doesn't update licenses

**Solution:**
- Check API endpoint permissions
- Verify tenant ID matches
- Check database update query

---

## ✅ Success Criteria

All tests pass when:

- ✅ All API routes return correct status codes
- ✅ JWT tokens contain licensing info
- ✅ Frontend correctly filters modules
- ✅ ModuleGate blocks unlicensed access
- ✅ Admin panel can toggle licenses
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ All integration tests pass

---

## 🎯 Next Steps After Testing

1. **Document Issues:** Create issues for any failures
2. **Fix Critical Bugs:** Address blocking issues
3. **Re-test:** Run failed tests again
4. **Performance Test:** Check for performance regressions
5. **Security Audit:** Verify license checks can't be bypassed

---

**Testing Status:** Ready to Execute  
**Estimated Time:** 2-3 hours  
**Priority:** High (before production deployment)

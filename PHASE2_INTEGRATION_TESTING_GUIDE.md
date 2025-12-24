# 🧪 Phase 2: Integration Testing Guide

**Date:** December 2025  
**Status:** ✅ **READY FOR TESTING**  
**Purpose:** Comprehensive testing guide for OAuth2 SSO and cross-module integration

---

## 🎯 **Testing Overview**

This guide covers all testing scenarios for Phase 2 modular architecture:
- OAuth2 SSO flow
- Cross-module navigation
- License checking
- Token refresh
- Data consistency

---

## 📋 **Test Scenarios**

### **1. OAuth2 Authorization Flow** ✅

**Test:** User navigates to module without token

**Steps:**
1. Clear all cookies
2. Navigate to `http://localhost:3001/dashboard` (CRM module)
3. Should redirect to `http://localhost:3000/api/oauth/authorize`
4. Should redirect to login page if not logged in
5. After login, should redirect back with authorization code
6. Module should exchange code for token
7. User should be authenticated

**Expected Result:**
- ✅ Redirects to core for authentication
- ✅ Returns with authorization code
- ✅ Token exchanged successfully
- ✅ User can access module

---

### **2. Token Exchange** ✅

**Test:** Exchange authorization code for access token

**Steps:**
1. Get authorization code from `/api/oauth/authorize`
2. POST to `/api/oauth/token` with code
3. Verify response contains `access_token` and `refresh_token`

**Expected Result:**
```json
{
  "access_token": "jwt_token",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "refresh_token"
}
```

---

### **3. UserInfo Endpoint** ✅

**Test:** Get user information from access token

**Steps:**
1. Get access token
2. GET `/api/oauth/userinfo` with `Authorization: Bearer <token>`
3. Verify response contains user and tenant info

**Expected Result:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "tenant_id": "tenant_id",
  "licensed_modules": ["crm", "invoicing"],
  "subscription_tier": "professional"
}
```

---

### **4. Cross-Module Navigation** ✅

**Test:** Navigate between modules without re-authentication

**Steps:**
1. Login to CRM module (`http://localhost:3001`)
2. Navigate to Invoicing module (`http://localhost:3002`)
3. Should not require re-login
4. Token should be reused from cookie

**Expected Result:**
- ✅ No redirect to login
- ✅ Token reused from cookie
- ✅ User can access both modules

---

### **5. Module License Checking** ✅

**Test:** Access module without license

**Steps:**
1. Login with tenant that doesn't have CRM license
2. Navigate to CRM module
3. Should be blocked

**Expected Result:**
- ✅ API routes return 403 error
- ✅ Frontend routes redirect to upgrade page
- ✅ Error message: "CRM module not licensed"

---

### **6. Token Refresh** ✅

**Test:** Refresh expired access token

**Steps:**
1. Get access token and refresh token
2. Wait for token to expire (or use expired token)
3. Make API request with expired token
4. Middleware should auto-refresh using refresh token
5. New token should be used

**Expected Result:**
- ✅ Token refreshed automatically
- ✅ New access token issued
- ✅ Request succeeds with new token

---

### **7. Data Consistency** ✅

**Test:** Data created in one module accessible in another

**Steps:**
1. Create contact in CRM module
2. Create invoice in Invoicing module
3. Link invoice to contact
4. Verify relationship works

**Expected Result:**
- ✅ Contact visible in CRM
- ✅ Invoice visible in Invoicing
- ✅ Relationship maintained
- ✅ Data consistent across modules

---

### **8. Logout Flow** ✅

**Test:** Logout from module clears tokens

**Steps:**
1. Login to module
2. Call `/api/auth/logout`
3. Verify tokens cleared
4. Navigate to another module
5. Should require re-authentication

**Expected Result:**
- ✅ Tokens cleared from cookies
- ✅ Redirected to login
- ✅ Other modules also require re-auth

---

## 🔧 **Test Setup**

### **1. Start All Services:**

```bash
# Terminal 1: Core Module
cd .
npm run dev  # http://localhost:3000

# Terminal 2: CRM Module
cd crm-module
npm run dev  # http://localhost:3001

# Terminal 3: Invoicing Module
cd invoicing-module
npm run dev  # http://localhost:3002
```

### **2. Environment Variables:**

**Core Module (.env):**
```env
JWT_SECRET=test-secret
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...
```

**CRM Module (.env):**
```env
CORE_AUTH_URL=http://localhost:3000
OAUTH_CLIENT_ID=crm-module
OAUTH_CLIENT_SECRET=test-secret
DATABASE_URL=postgresql://...
```

---

## 📊 **Test Results Template**

### **Test Execution Log:**

| Test # | Scenario | Status | Notes |
|--------|----------|--------|-------|
| 1 | OAuth2 Authorization Flow | ⏳ | |
| 2 | Token Exchange | ⏳ | |
| 3 | UserInfo Endpoint | ⏳ | |
| 4 | Cross-Module Navigation | ⏳ | |
| 5 | Module License Checking | ⏳ | |
| 6 | Token Refresh | ⏳ | |
| 7 | Data Consistency | ⏳ | |
| 8 | Logout Flow | ⏳ | |

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Redirect Loop**

**Symptom:** Endless redirects between core and module

**Solution:**
- Check `redirect_uri` matches exactly
- Verify cookie domain is `.payaid.io` (or `.localhost` for local)
- Check middleware matcher config

### **Issue 2: Token Not Found**

**Symptom:** Always redirects to login even after login

**Solution:**
- Check cookie domain settings
- Verify token is being set in response
- Check cookie httpOnly and secure flags

### **Issue 3: 403 Module Not Licensed**

**Symptom:** User has license but still gets 403

**Solution:**
- Verify `licensedModules` in JWT token
- Check tenant's `licensedModules` in database
- Ensure token includes latest licensing info

### **Issue 4: Token Refresh Fails**

**Symptom:** Refresh token doesn't work

**Solution:**
- Verify refresh token stored in Redis
- Check refresh token expiry (30 days)
- Verify client_id and client_secret match

---

## ✅ **Success Criteria**

All tests must pass:
- ✅ OAuth2 flow works end-to-end
- ✅ Cross-module navigation seamless
- ✅ License checking enforced
- ✅ Token refresh automatic
- ✅ Data consistent across modules
- ✅ Logout clears all tokens

---

**Status:** ✅ **READY FOR TESTING**  
**Next:** Execute all test scenarios and document results


# Employee Module Access - Quick Summary

**Date:** January 2025  
**Architecture:** ✅ **Decoupled Architecture Only** (No Monolithic References)

**Note:** This document describes the decoupled architecture where:
- Each module is accessed directly: `/crm/[tenantId]/Home/`, `/marketing/[tenantId]/Home/`
- No sidebar - users go directly to module pages
- Each module has its own top bar with module-specific navigation
- Module switcher (dropdown in top bar) for cross-module navigation

---

## ❓ Your Questions Answered

### **Q1: What will an employee see if admin has only Marketing module?**

**Answer:** The employee will see **ONLY the Marketing module** in their dashboard.

**Flow:**
1. Admin purchases/selects: **Marketing Module** only
2. Admin assigns Marketing to employee
3. Employee logs in
4. Employee sees:
   - ✅ Marketing module dashboard (direct access)
   - ✅ Settings
   - ✅ Profile
   - ❌ CRM (hidden - not assigned)
   - ❌ Finance (hidden - not assigned)
   - ❌ HR (hidden - not assigned)

**Technical:**
- `tenant.licensedModules = ['marketing']` (what org purchased)
- `user.assignedModules = ['marketing']` (what admin assigned)
- Module switcher (in top bar) filters: Shows only modules in BOTH arrays
- If employee tries to access `/crm` → Redirected with "Module not available"

---

### **Q2: Different login for each module with SSO?**

**Answer:** ✅ **YES - Already Implemented!**

**Current Implementation:**
- `/login` → Main login (fallback)
- `/crm/login` → CRM-specific login page
- `/marketing/login` → Marketing-specific login page
- `/finance/login` → Finance-specific login page

**SSO Flow:**
1. Employee logs in at `/marketing/login`
2. JWT token stored in cookie (domain: `.payaid.com`)
3. Employee clicks "CRM" (if assigned)
4. Redirects to `/crm` or `crm.payaid.com`
5. Cookie is read automatically → **SSO works!**

**How SSO Works:**
- Cookie domain: `.payaid.com` (works across all subdomains)
- JWT token contains: `assignedModules`, `licensedModules`, `role`
- Each module checks token → Auto-login if valid

---

### **Q3: Can we use subdomain concept (crm.demobusiness.payaid.com)?**

**Answer:** ✅ **YES - This is doable and recommended for production!**

**Example: Demo Business**
- Organization: Demo Business
- Subdomain: `demobusiness`
- Purchased: All modules

**Custom URLs:**
- `crm.demobusiness.payaid.com` → CRM module
- `marketing.demobusiness.payaid.com` → Marketing module
- `finance.demobusiness.payaid.com` → Finance module

**Sales Managers Scenario:**
1. Admin creates: `crm.demobusiness.payaid.com`
2. Admin assigns only CRM to sales managers
3. Sales managers visit: `crm.demobusiness.payaid.com`
4. If not logged in → Shows CRM login page
5. If logged in → Shows CRM dashboard (only CRM visible)

---

## 🎯 Recommended Approach

### **Phase 1: Current (Path-Based) ✅**

**Status:** Already working!

**URLs:**
- `payaid.com/marketing/login` → Marketing login
- `payaid.com/crm/login` → CRM login

**Pros:**
- ✅ No infrastructure changes needed
- ✅ Works immediately
- ✅ Easier for development

**Cons:**
- ❌ Less professional URLs
- ❌ Harder to brand per module

---

### **Phase 2: Subdomain Support (Future) 🔄**

**When to Implement:**
- Production deployment
- Enterprise customers request it
- Need better branding

**URLs:**
- `crm.demobusiness.payaid.com` → CRM
- `marketing.demobusiness.payaid.com` → Marketing

**Implementation:**
- See `SUBDOMAIN_IMPLEMENTATION_GUIDE.md` for full details
- Requires: DNS setup, middleware update, database schema

**Pros:**
- ✅ Professional URLs
- ✅ Better branding
- ✅ Better for enterprise

**Cons:**
- ❌ Requires DNS configuration
- ❌ More complex setup

---

## 🔄 Employee Login Flow (Detailed)

### **Scenario: Marketing-Only Employee**

**Step 1: Employee Visits URL**
```
URL: payaid.com/marketing/login
  OR: marketing.demobusiness.payaid.com (if subdomain enabled)
```

**Step 2: Login**
```
Employee enters:
  Email: employee@demobusiness.com
  Password: ***
```

**Step 3: Server Validates**
```typescript
// 1. Find user
const user = await findUser(email)

// 2. Check tenant licensed modules
const licensedModules = user.tenant.licensedModules
// ['marketing'] ← Only Marketing purchased

// 3. Check user assigned modules
const assignedModules = user.assignedModules
// ['marketing'] ← Only Marketing assigned

// 4. Intersection (what user can access)
const accessibleModules = ['marketing']
```

**Step 4: Generate JWT & Set Cookie**
```typescript
const token = signToken({
  userId: user.id,
  tenantId: user.tenantId,
  assignedModules: ['marketing'],  // Only Marketing
  licensedModules: ['marketing'],   // Only Marketing purchased
  role: 'user'
})

// Set cookie (works across subdomains)
response.cookies.set('authToken', token, {
  domain: '.payaid.com',  // Works on all subdomains
  httpOnly: true,
  secure: true
})
```

**Step 5: Redirect to Dashboard**
```
Redirect to: /marketing/[tenantId]/dashboard
```

**Step 6: Marketing Dashboard Loads**
```typescript
// Middleware checks module access
const canAccess = assignedModules.includes('marketing') && 
                  licensedModules.includes('marketing')

if (!canAccess) {
  redirect('/unauthorized')
}

// Marketing module dashboard renders
// Top bar shows: [Home] [Campaigns] [Email] [Social] [Reports] [⚙️]
// Module switcher (in top bar) shows: Only Marketing (filtered by assignedModules)
```

---

## 🔒 Access Control (Multi-Layer)

### **Layer 1: Tenant Level**
- `tenant.licensedModules` - What organization purchased
- Example: `['marketing']`

### **Layer 2: User Level**
- `user.assignedModules` - What admin assigned to user
- Example: `['marketing']`

### **Layer 3: Access Check**
```typescript
function canAccessModule(user, moduleId) {
  // User must have module assigned
  if (!user.assignedModules.includes(moduleId)) {
    return false  // ❌ Not assigned
  }
  
  // Tenant must have module licensed
  if (!user.tenant.licensedModules.includes(moduleId)) {
    return false  // ❌ Not purchased
  }
  
  return true  // ✅ Can access
}
```

### **Layer 4: Middleware Protection**
- Every module route is protected (e.g., `/crm/[tenantId]/Home/`)
- Checks `assignedModules` and `licensedModules`
- Redirects to `/unauthorized` if no access
- User never sees modules they don't have access to

---

## 📋 Implementation Status

### **✅ Already Implemented:**
- [x] Module-specific login pages (`/crm/login`, `/marketing/login`)
- [x] JWT-based authentication
- [x] Role-based access control (RBAC)
- [x] Module filtering in module switcher (top bar)
- [x] Employee sees only assigned modules
- [x] SSO via JWT cookies

### **🔄 Future Enhancement:**
- [ ] Subdomain support (`crm.demobusiness.payaid.com`)
- [ ] Admin UI for creating custom URLs
- [ ] DNS wildcard configuration
- [ ] SSL certificate setup

---

## 💡 Example Scenarios

### **Scenario 1: Marketing-Only Organization**

**Admin:**
- Purchases: Marketing module only
- Licensed: `['marketing']`

**Employee:**
- Assigned: `['marketing']`
- Logs in at: `payaid.com/marketing/login`
- Redirected to: `payaid.com/marketing/[tenantId]/Home/`
- Sees: Marketing module dashboard with Marketing-specific top bar navigation
- Module switcher (in top bar) shows: Only Marketing (or all licensed if admin)

---

### **Scenario 2: Multi-Module with Restricted Access**

**Organization:** Demo Business  
**Purchased:** All modules (`['crm', 'marketing', 'finance', 'hr']`)

**Sales Manager:**
- Assigned: `['crm']` only
- Logs in at: `crm.demobusiness.payaid.com/login` (if subdomain enabled)
- Redirected to: `crm.demobusiness.payaid.com/[tenantId]/Home/`
- Sees: CRM module dashboard with CRM-specific top bar (Leads, Contacts, Deals, etc.)
- Module switcher shows: Only CRM
- Cannot access: Marketing, Finance, HR (blocked at middleware level)

**Marketing Manager:**
- Assigned: `['marketing']` only
- Logs in at: `marketing.demobusiness.payaid.com/login` (if subdomain enabled)
- Redirected to: `marketing.demobusiness.payaid.com/[tenantId]/Home/`
- Sees: Marketing module dashboard with Marketing-specific top bar (Campaigns, Email, Social, etc.)
- Module switcher shows: Only Marketing
- Cannot access: CRM, Finance, HR (blocked at middleware level)

**Admin:**
- Assigned: `['crm', 'marketing', 'finance', 'hr']` (all)
- Sees: All modules
- Can manage module assignments

---

## ✅ Summary

**Current State (Decoupled Architecture):**
- ✅ **No Sidebar** - Decoupled architecture, users go directly to module pages
- ✅ **Direct Module Access** - `/crm/[tenantId]/Home/`, `/marketing/[tenantId]/Home/`
- ✅ **Module-Specific Top Bar** - Each module has its own navigation (Leads, Contacts, Deals for CRM; Campaigns, Email, Social for Marketing)
- ✅ **Module Switcher** - Dropdown in top bar for cross-module navigation (shows only assigned modules)
- ✅ **Module-Specific Login Pages** - `/crm/login`, `/marketing/login`, etc.
- ✅ **SSO** - Works via JWT cookies across modules
- ✅ **Access Control** - Multi-layer protection (login, middleware, page level)

**Future Enhancement:**
- 🔄 Subdomain support (`crm.demobusiness.payaid.com`)
- 🔄 Admin UI for custom URLs
- 🔄 Better branding per module

**Recommendation:**
1. **Continue with path-based** for now (already working)
2. **Plan subdomain support** for production/enterprise
3. **Hybrid approach** (both path and subdomain supported)

---

## 📚 Related Documents

- `MODULE_ACCESS_AND_SUBDOMAIN_ARCHITECTURE.md` - Full architecture details
- `SUBDOMAIN_IMPLEMENTATION_GUIDE.md` - Step-by-step implementation guide
- `ARCHITECTURE_DIAGRAMS.md` - Flow diagrams

---

**Last Updated:** January 2025


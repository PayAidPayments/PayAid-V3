# Module Access Control & Subdomain Architecture

**Date:** January 2025  
**Status:** 📋 **ARCHITECTURE DESIGN**  
**Architecture:** ✅ **Decoupled Architecture Only** (No Monolithic References)

**Note:** This document describes the decoupled architecture where:
- Each module is accessed directly: `/crm/[tenantId]/Home/`, `/marketing/[tenantId]/Home/`
- No sidebar - users go directly to module pages
- Each module has its own top bar with module-specific navigation
- Module switcher (dropdown in top bar) for cross-module navigation

---

## 🎯 Overview

This document outlines the architecture for:
1. **Module-Based Employee Access** - Employees only see modules assigned to them
2. **Module-Specific Login Pages** - Each module has its own login with SSO
3. **Custom Subdomain URLs** - Organizations can create custom URLs like `crm.demobusiness.payaid.com`

---

## 📊 Current Architecture

### **What Employees See When They Log In**

#### **Scenario 1: Admin Has Only Marketing Module**

**Admin:**
- Purchases/selects: **Marketing Module** only
- Licensed modules: `['marketing']`

**Employee (assigned Marketing):**
- When employee logs in → **Redirected directly to Marketing module**
- URL: `/marketing/[tenantId]/Home/`
- Top bar shows: **Marketing-specific navigation** (Campaigns, Email, Social Media, etc.)
- Module switcher (in top bar) shows: **Only Marketing** (if assigned) or all licensed modules
- Cannot access: CRM, Finance, HR, etc.
- If tries to access `/crm/[tenantId]/Home/` → Redirected with error: "Module not available"

**Flow:**
```
Employee Login at /marketing/login
    ↓
JWT Token Generated with:
  - userId: "emp-123"
  - tenantId: "org-456"
  - assignedModules: ['marketing']  ← Only Marketing
  - role: 'user'
    ↓
Redirect to: /marketing/[tenantId]/Home/
    ↓
Marketing Module Dashboard Loads
    ↓
Top Bar Shows:
  - Marketing Logo
  - Marketing Navigation: [Home] [Campaigns] [Email] [Social] [Reports] [⚙️]
  - Module Switcher: Shows only Marketing (or all licensed if admin)
    ↓
Employee Sees:
  ✅ Marketing Dashboard
  ✅ Marketing-specific features only
  ❌ Cannot access CRM (/crm → blocked)
  ❌ Cannot access Finance (/finance → blocked)
  ❌ Cannot access HR (/hr → blocked)
```

---

## 🔐 Module-Specific Login with SSO

### **Current Implementation**

✅ **Already Implemented:**
- Module-specific login pages: `/crm/login`, `/marketing/login`, etc.
- JWT-based authentication
- Role-based access control (RBAC)

### **How It Works**

#### **1. Module-Specific Login Pages**

**Routes:**
- `/login` → Main login (fallback)
- `/crm/login` → CRM-specific login
- `/marketing/login` → Marketing-specific login
- `/finance/login` → Finance-specific login

**Each Login Page:**
- Module-branded (colors, icons)
- After login → Redirects to module dashboard
- SSO token stored in cookie (works across subdomains)

#### **2. SSO Flow**

```
User visits: crm.demobusiness.payaid.com
    ↓
Not logged in → Redirect to: crm.demobusiness.payaid.com/login
    ↓
User enters credentials
    ↓
POST /api/auth/login
    ↓
Verify credentials
    ↓
Check user.assignedModules
    ↓
Check tenant.licensedModules
    ↓
Generate JWT with:
  - userId
  - tenantId
  - assignedModules: ['crm']  ← Only CRM
  - licensedModules: ['crm', 'marketing', 'finance']  ← All purchased
    ↓
Set cookie: authToken (domain: .payaid.com)
    ↓
Redirect to: crm.demobusiness.payaid.com/dashboard
    ↓
Dashboard shows only CRM (filtered by assignedModules)
```

#### **3. Cross-Module SSO**

**Scenario:** User logged into CRM, clicks Marketing link

```
User on: crm.demobusiness.payaid.com
    ↓
Clicks "Marketing" in module switcher
    ↓
Check: Is 'marketing' in assignedModules?
    ↓
YES → Redirect to: marketing.demobusiness.payaid.com
    ↓
Marketing subdomain checks cookie: authToken
    ↓
Cookie found → Verify JWT
    ↓
Valid → User logged in automatically (SSO)
    ↓
Show Marketing dashboard
```

**If Module Not Assigned:**
```
User clicks "Marketing" (not in assignedModules)
    ↓
Check: 'marketing' in assignedModules? → NO
    ↓
Show error: "You don't have access to Marketing module"
    ↓
OR redirect to: /upgrade?module=marketing
```

---

## 🌐 Subdomain Architecture

### **Concept: Custom Module URLs**

**Example: Demo Business**

**Organization:** Demo Business  
**Subdomain:** `demobusiness`  
**Purchased Modules:** All modules (CRM, Marketing, Finance, HR, etc.)

**Custom URLs:**
- `crm.demobusiness.payaid.com` → CRM module
- `marketing.demobusiness.payaid.com` → Marketing module
- `finance.demobusiness.payaid.com` → Finance module
- `hr.demobusiness.payaid.com` → HR module

**Use Case: Sales Managers**
- Admin creates: `crm.demobusiness.payaid.com`
- Assigns only CRM to sales managers
- Sales managers visit URL → See only CRM login/dashboard

---

## 🏗️ Implementation Architecture

### **Option 1: Subdomain-Based (Recommended for Production)**

#### **Structure:**
```
Main Domain: payaid.com
  ├─ app.payaid.com (main app)
  ├─ crm.payaid.com (CRM module)
  ├─ marketing.payaid.com (Marketing module)
  └─ finance.payaid.com (Finance module)

Organization Subdomains:
  ├─ crm.demobusiness.payaid.com
  ├─ marketing.demobusiness.payaid.com
  └─ finance.demobusiness.payaid.com
```

#### **DNS Configuration:**
```
Wildcard DNS:
  *.payaid.com → Server IP
  *.demobusiness.payaid.com → Server IP
```

#### **Middleware Logic:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Parse subdomain
  // crm.demobusiness.payaid.com → { module: 'crm', org: 'demobusiness' }
  // marketing.payaid.com → { module: 'marketing', org: null }
  
  const { module, org } = parseSubdomain(hostname)
  
  if (module) {
    // Module-specific subdomain
    // Check authentication
    // Check module access
    // Redirect to module dashboard or login
  }
}
```

#### **Database Schema:**
```prisma
model Tenant {
  id              String   @id @default(cuid())
  name            String
  subdomain       String?  @unique  // 'demobusiness'
  licensedModules String[] // ['crm', 'marketing', 'finance']
  // ...
}

model User {
  id              String   @id @default(cuid())
  email           String
  tenantId        String
  assignedModules String[] // ['crm'] - Only CRM assigned
  role            String   // 'admin' | 'user'
  // ...
}

model ModuleSubdomain {
  id          String   @id @default(cuid())
  tenantId    String
  moduleId    String   // 'crm', 'marketing', etc.
  subdomain   String   // 'crm.demobusiness.payaid.com'
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, moduleId])
  @@index([subdomain])
}
```

---

### **Option 2: Path-Based (Current Implementation)**

#### **Structure:**
```
Main Domain: payaid.com
  ├─ /login (main login)
  ├─ /crm/login (CRM login)
  ├─ /marketing/login (Marketing login)
  ├─ /crm/[tenantId]/dashboard
  └─ /marketing/[tenantId]/dashboard
```

**Pros:**
- ✅ Simpler setup (no DNS changes)
- ✅ Works immediately
- ✅ Easier for development

**Cons:**
- ❌ Less professional URLs
- ❌ Harder to brand per module
- ❌ Not as scalable

---

## 🔄 Recommended Flow

### **Phase 1: Path-Based (Current) ✅**

**Status:** Already implemented (Decoupled Architecture)
- Module-specific login pages
- Role-based access control
- Direct module access (no sidebar)

**What Works:**
- ✅ Employees redirected directly to assigned modules
- ✅ Module-specific login pages
- ✅ SSO via JWT cookies
- ✅ Direct module access (no sidebar, decoupled architecture)
- ✅ Each module has its own top bar with module-specific navigation

**URLs:**
- `payaid.com/crm/login` → `/crm/[tenantId]/Home/`
- `payaid.com/marketing/login` → `/marketing/[tenantId]/Home/`
- `payaid.com/finance/login` → `/finance/[tenantId]/Home/`

---

### **Phase 2: Subdomain Support (Future)**

**When to Implement:**
- Production deployment
- Enterprise customers request it
- Need better branding

**Implementation Steps:**

1. **Database Schema Update:**
   ```prisma
   model ModuleSubdomain {
     id          String   @id @default(cuid())
     tenantId    String
     moduleId    String
     subdomain   String   // Full subdomain: crm.demobusiness.payaid.com
     isActive    Boolean  @default(true)
     tenant      Tenant   @relation(fields: [tenantId], references: [id])
     
     @@unique([tenantId, moduleId])
   }
   ```

2. **Middleware Update:**
   ```typescript
   // Detect subdomain from hostname
   // Route to appropriate module
   // Check authentication
   // Check module access
   ```

3. **DNS Configuration:**
   - Wildcard DNS: `*.payaid.com`
   - SSL certificates (Let's Encrypt)

4. **Admin UI:**
   - Allow admins to create custom subdomains
   - `Settings → Modules → Create Custom URL`

---

## 📋 Employee Login Flow (Detailed)

### **Scenario: Marketing-Only Employee**

**Step 1: Employee Visits Marketing URL**
```
URL: marketing.demobusiness.payaid.com
    OR: payaid.com/marketing/login
```

**Step 2: Not Logged In**
```
→ Redirect to: /marketing/login
→ Show Marketing-branded login page
```

**Step 3: Employee Logs In**
```
POST /api/auth/login
{
  email: "employee@demobusiness.com",
  password: "***"
}
```

**Step 4: Server Validates**
```typescript
// 1. Find user
const user = await prisma.user.findUnique({
  where: { email },
  include: { tenant: true }
})

// 2. Check tenant licensed modules
const licensedModules = user.tenant.licensedModules
// ['marketing'] ← Only Marketing purchased

// 3. Check user assigned modules
const assignedModules = user.assignedModules
// ['marketing'] ← Only Marketing assigned

// 4. Intersection (what user can actually access)
const accessibleModules = assignedModules.filter(m => 
  licensedModules.includes(m)
)
// ['marketing']
```

**Step 5: Generate JWT**
```typescript
const token = signToken({
  userId: user.id,
  tenantId: user.tenantId,
  assignedModules: ['marketing'],  // Only Marketing
  licensedModules: ['marketing'],  // Only Marketing purchased
  role: user.role
})
```

**Step 6: Set Cookie & Redirect**
```typescript
// Set cookie with domain: .payaid.com (works across subdomains)
response.cookies.set('authToken', token, {
  domain: '.payaid.com',
  httpOnly: true,
  secure: true,
  sameSite: 'lax'
})

// Redirect to Marketing dashboard
redirect('/marketing/[tenantId]/dashboard')
```

**Step 7: Marketing Dashboard Loads**
```typescript
// Middleware checks module access before page loads
const canAccess = assignedModules.includes('marketing') && 
                  licensedModules.includes('marketing')

if (!canAccess) {
  redirect('/unauthorized')
}

// Marketing module dashboard renders
// Top bar shows: [Home] [Campaigns] [Email] [Social Media] [Reports] [⚙️]
// Module switcher (in top bar) filters modules by assignedModules
// Result: Only Marketing visible in module switcher (if user) or all licensed (if admin)
```

---

## 🎨 Admin Interface for Custom URLs

### **Admin Panel: Module URLs**

**Location:** `Settings → Modules → Custom URLs`

**Features:**
1. **View All Modules:**
   - List of all purchased modules
   - Current URL for each module
   - Status (Active/Inactive)

2. **Create Custom URL:**
   ```
   Module: CRM
   Custom Subdomain: crm.demobusiness
   Full URL: crm.demobusiness.payaid.com
   
   [Create URL]
   ```

3. **Assign to Users:**
   ```
   Module: CRM
   Custom URL: crm.demobusiness.payaid.com
   
   Assign to:
   ☑ Sales Manager 1
   ☑ Sales Manager 2
   ☐ Marketing Manager (not assigned)
   ```

4. **Share URL:**
   ```
   Copy link: crm.demobusiness.payaid.com
   [Copy] [Email to Team]
   ```

---

## 🔒 Security & Access Control

### **Multi-Layer Security**

1. **Tenant Level:**
   - `tenant.licensedModules` - What organization purchased
   - Example: `['crm', 'marketing']`

2. **User Level:**
   - `user.assignedModules` - What admin assigned to user
   - Example: `['crm']`

3. **Access Check:**
   ```typescript
   function canAccessModule(user, moduleId) {
     // User must have module assigned
     if (!user.assignedModules.includes(moduleId)) {
       return false
     }
     
     // Tenant must have module licensed
     if (!user.tenant.licensedModules.includes(moduleId)) {
       return false
     }
     
     return true
   }
   ```

4. **Middleware Protection:**
   ```typescript
   // Every module route protected
   export async function middleware(request) {
     const moduleId = detectModuleFromPath(request.pathname)
     const user = await getUserFromToken(request)
     
     if (!canAccessModule(user, moduleId)) {
       return redirect('/unauthorized')
     }
   }
   ```

---

## 📝 Implementation Checklist

### **Phase 1: Path-Based (Current) ✅**

- [x] Module-specific login pages
- [x] JWT-based authentication
- [x] Role-based access control
- [x] Direct module access (decoupled architecture, no sidebar)
- [x] Employee redirected directly to assigned modules
- [x] Module-specific top bar navigation

### **Phase 2: Subdomain Support (Future)**

- [ ] Database schema for `ModuleSubdomain`
- [ ] Middleware for subdomain detection
- [ ] Admin UI for creating custom URLs
- [ ] DNS wildcard configuration
- [ ] SSL certificate setup
- [ ] Cookie domain configuration (`.payaid.com`)
- [ ] Cross-subdomain SSO testing
- [ ] Documentation for admins

---

## 🎯 Recommendations

### **For Current Development:**

1. **Continue with Path-Based:**
   - ✅ Already working
   - ✅ No infrastructure changes needed
   - ✅ Faster development

2. **Enhance Current System:**
   - ✅ Improve module filtering
   - ✅ Better error messages
   - ✅ Admin UI for module assignment

### **For Production (Future):**

1. **Implement Subdomain Support:**
   - Better branding
   - Professional URLs
   - Better for enterprise customers

2. **Hybrid Approach:**
   - Default: Path-based (`payaid.com/crm`)
   - Enterprise: Subdomain (`crm.demobusiness.payaid.com`)

---

## 💡 Example Scenarios

### **Scenario 1: Marketing-Only Organization**

**Admin:**
- Purchases: Marketing module only
- Licensed: `['marketing']`

**Employee:**
- Assigned: `['marketing']`
- Sees: Only Marketing module
- URL: `payaid.com/marketing/login` → `payaid.com/marketing/[tenantId]/dashboard`

---

### **Scenario 2: Multi-Module with Restricted Access**

**Organization:** Demo Business  
**Purchased:** All modules (`['crm', 'marketing', 'finance', 'hr']`)

**Sales Manager:**
- Assigned: `['crm']` only
- Sees: Only CRM
- URL: `crm.demobusiness.payaid.com` (if subdomain enabled)

**Marketing Manager:**
- Assigned: `['marketing']` only
- Sees: Only Marketing
- URL: `marketing.demobusiness.payaid.com` (if subdomain enabled)

**Admin:**
- Assigned: `['crm', 'marketing', 'finance', 'hr']` (all)
- Sees: All modules
- Can manage module assignments

---

## ✅ Summary

**Current State (Decoupled Architecture):**
- ✅ **No Sidebar** - Users go directly to module pages
- ✅ **Direct Module Access** - `/crm/[tenantId]/Home/`, `/marketing/[tenantId]/Home/`
- ✅ **Module-Specific Top Bar** - Each module has its own navigation
- ✅ **Module Switcher** - Dropdown in top bar for cross-module navigation
- ✅ Module-specific login pages exist
- ✅ SSO works via JWT cookies
- ✅ Path-based routing (`/crm/login`, `/marketing/login`)

**Future Enhancement:**
- 🔄 Subdomain support (`crm.demobusiness.payaid.com`)
- 🔄 Admin UI for custom URLs
- 🔄 Better branding per module

**Recommendation:**
- **Continue with path-based** for now (already working)
- **Plan subdomain support** for production/enterprise
- **Hybrid approach** (both path and subdomain supported)

---

**Last Updated:** January 2025  
**Next Steps:** Implement admin UI for module assignment management


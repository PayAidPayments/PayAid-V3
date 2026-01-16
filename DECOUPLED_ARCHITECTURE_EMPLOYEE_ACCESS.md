# Decoupled Architecture - Employee Module Access

**Date:** January 2025  
**Status:** ✅ **CURRENT IMPLEMENTATION**  
**Architecture:** ✅ **Decoupled Architecture Only** (No Monolithic References)

---

## 🎯 Overview

This document explains how employees access modules in PayAid V3's **decoupled architecture** where:
- **No Sidebar** - Users go directly to module pages
- **Each Module = Separate Route** - `/crm/[tenantId]/Home/`, `/marketing/[tenantId]/Home/`
- **Module-Specific Top Bar** - Each module has its own navigation
- **Module Switcher** - Dropdown in top bar for cross-module navigation

---

## 📊 How Employees Access Modules

### **Scenario: Marketing-Only Employee**

**Step 1: Employee Visits Marketing URL**
```
URL: payaid.com/marketing/login
  OR: marketing.demobusiness.payaid.com/login (if subdomain enabled)
```

**Step 2: Employee Logs In**
```
POST /api/auth/login
{
  email: "employee@demobusiness.com",
  password: "***"
}
```

**Step 3: Server Validates & Generates Token**
```typescript
// Check tenant licensed modules
const licensedModules = user.tenant.licensedModules
// ['marketing'] ← Only Marketing purchased

// Check user assigned modules
const assignedModules = user.assignedModules
// ['marketing'] ← Only Marketing assigned

// Generate JWT
const token = signToken({
  userId: user.id,
  tenantId: user.tenantId,
  assignedModules: ['marketing'],  // Only Marketing
  licensedModules: ['marketing'],   // Only Marketing purchased
  role: 'user'
})
```

**Step 4: Redirect to Marketing Module**
```
Redirect to: /marketing/[tenantId]/Home/
```

**Step 5: Marketing Module Loads**
```
Marketing Dashboard Page:
  - Top Bar: [Marketing Logo] [Home] [Campaigns] [Email] [Social] [Reports] [⚙️]
  - Module Switcher (dropdown in top bar): Shows only Marketing
  - Dashboard Content: Marketing-specific KPIs, charts, etc.
```

**Step 6: Employee Can Only Access Marketing**
- ✅ Can access: `/marketing/[tenantId]/Home/`
- ✅ Can access: `/marketing/[tenantId]/campaigns/`
- ❌ Cannot access: `/crm/[tenantId]/Home/` → Redirected to `/unauthorized`
- ❌ Cannot access: `/finance/[tenantId]/Home/` → Redirected to `/unauthorized`

---

## 🔐 Module Access Control

### **Multi-Layer Protection**

1. **Login Level:**
   - JWT token contains `assignedModules` and `licensedModules`
   - Token stored in cookie (works across subdomains)

2. **Middleware Level:**
   ```typescript
   // Every module route protected
   export async function middleware(request: NextRequest) {
     const pathname = request.nextUrl.pathname
     const moduleId = detectModuleFromPath(pathname) // 'crm', 'marketing', etc.
     
     // Get user from token
     const user = await getUserFromToken(request)
     
     // Check access
     if (!user.assignedModules.includes(moduleId)) {
       return redirect('/unauthorized')
     }
     
     if (!user.tenant.licensedModules.includes(moduleId)) {
       return redirect('/unauthorized')
     }
     
     // Allow access
     return NextResponse.next()
   }
   ```

3. **Page Level:**
   ```typescript
   // Each module page checks access
   export default async function MarketingDashboard() {
     const { user, tenant } = await getAuth()
     
     // Double-check access
     if (!user.assignedModules.includes('marketing')) {
       redirect('/unauthorized')
     }
     
     // Render marketing dashboard
     return <MarketingDashboardContent />
   }
   ```

---

## 🎨 Module Navigation Structure

### **CRM Module** (`/crm/[tenantId]/Home/`)

**Top Bar:**
```
[CRM Logo] [Home] [Leads] [Contacts] [Accounts] [Deals] [Tasks] [Reports] [⚙️ Settings] [Module Switcher ▼]
```

**Module Switcher (Dropdown):**
- Shows only modules in `assignedModules` (for regular users)
- Shows all `licensedModules` (for admins)
- Each option redirects to that module's dashboard

---

### **Marketing Module** (`/marketing/[tenantId]/Home/`)

**Top Bar:**
```
[Marketing Logo] [Home] [Campaigns] [Email] [Social Media] [WhatsApp] [Reports] [⚙️ Settings] [Module Switcher ▼]
```

**Module Switcher (Dropdown):**
- Shows only Marketing (if user has only Marketing assigned)
- Shows all licensed modules (if admin)

---

### **Finance Module** (`/finance/[tenantId]/Home/`)

**Top Bar:**
```
[Finance Logo] [Home] [Invoices] [Accounting] [Purchase Orders] [GST] [Reports] [⚙️ Settings] [Module Switcher ▼]
```

---

## 🔄 Cross-Module Navigation (SSO)

### **User Switches from CRM to Marketing**

**Flow:**
```
User on: /crm/[tenantId]/Home/
    ↓
Clicks "Marketing" in Module Switcher dropdown
    ↓
Check: Is 'marketing' in assignedModules?
    ↓
YES → Redirect to: /marketing/[tenantId]/Home/
    ↓
Marketing module middleware checks cookie
    ↓
Cookie found → User logged in automatically (SSO)
    ↓
Marketing dashboard loads
```

**If Module Not Assigned:**
```
User clicks "Marketing" (not in assignedModules)
    ↓
Check: 'marketing' in assignedModules? → NO
    ↓
Show error: "You don't have access to Marketing module"
    ↓
OR redirect to: /unauthorized
```

---

## 📋 Example Scenarios

### **Scenario 1: Marketing-Only Organization**

**Admin:**
- Purchases: Marketing module only
- Licensed: `['marketing']`

**Employee:**
- Assigned: `['marketing']`
- Logs in at: `/marketing/login`
- Redirected to: `/marketing/[tenantId]/Home/`
- Sees: Marketing dashboard with Marketing top bar
- Module switcher shows: Only Marketing
- Cannot access: `/crm` → Blocked

---

### **Scenario 2: Multi-Module with Restricted Access**

**Organization:** Demo Business  
**Purchased:** All modules (`['crm', 'marketing', 'finance', 'hr']`)

**Sales Manager:**
- Assigned: `['crm']` only
- Logs in at: `/crm/login` or `crm.demobusiness.payaid.com/login`
- Redirected to: `/crm/[tenantId]/Home/`
- Sees: CRM dashboard with CRM top bar
- Module switcher shows: Only CRM
- Cannot access: `/marketing` → Blocked
- Cannot access: `/finance` → Blocked

**Marketing Manager:**
- Assigned: `['marketing']` only
- Logs in at: `/marketing/login` or `marketing.demobusiness.payaid.com/login`
- Redirected to: `/marketing/[tenantId]/Home/`
- Sees: Marketing dashboard with Marketing top bar
- Module switcher shows: Only Marketing
- Cannot access: `/crm` → Blocked
- Cannot access: `/finance` → Blocked

**Admin:**
- Assigned: `['crm', 'marketing', 'finance', 'hr']` (all)
- Can access: All module dashboards
- Module switcher shows: All licensed modules
- Can manage module assignments

---

## ✅ Summary

**Current Architecture:**
- ✅ **No Sidebar** - Decoupled architecture
- ✅ **Direct Module Access** - `/crm/[tenantId]/Home/`, `/marketing/[tenantId]/Home/`
- ✅ **Module-Specific Top Bar** - Each module has its own navigation
- ✅ **Module Switcher** - Dropdown in top bar for cross-module navigation
- ✅ **Access Control** - Multi-layer protection (login, middleware, page level)
- ✅ **SSO** - Seamless navigation between modules via JWT cookies

**Employee Experience:**
1. Employee logs in at module-specific login page
2. Redirected directly to assigned module dashboard
3. Sees module-specific top bar with module navigation
4. Module switcher shows only accessible modules
5. Cannot access modules not assigned (blocked at middleware)

---

**Last Updated:** January 2025


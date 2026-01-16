# PayAid V3 - Decoupled Architecture Only

**Date:** January 2025  
**Status:** ✅ **CURRENT ARCHITECTURE**

---

## 🎯 Architecture Declaration

**PayAid V3 uses ONLY decoupled architecture. There are NO monolithic architecture references in the current implementation.**

---

## ✅ Decoupled Architecture Principles

### **1. Direct Module Access**
- Users go directly to module pages
- No central dashboard with all modules
- Each module is independent

**URL Structure:**
```
/crm/[tenantId]/Home/          → CRM module dashboard
/marketing/[tenantId]/Home/    → Marketing module dashboard
/finance/[tenantId]/Home/      → Finance module dashboard
/hr/[tenantId]/Home/           → HR module dashboard
```

### **2. No Sidebar**
- ❌ No shared sidebar across modules
- ✅ Each module has its own top bar
- ✅ Module-specific navigation in top bar

**Example - CRM Module:**
```
Top Bar: [CRM Logo] [Home] [Leads] [Contacts] [Accounts] [Deals] [Tasks] [Reports] [⚙️] [Module Switcher ▼]
```

**Example - Marketing Module:**
```
Top Bar: [Marketing Logo] [Home] [Campaigns] [Email] [Social] [Reports] [⚙️] [Module Switcher ▼]
```

### **3. Module-Specific Login Pages**
- Each module has its own login page
- Module-branded login experience
- After login → Redirects directly to module dashboard

**Login Routes:**
```
/login              → Main login (fallback)
/crm/login          → CRM-specific login
/marketing/login    → Marketing-specific login
/finance/login      → Finance-specific login
```

### **4. Module Switcher (Top Bar)**
- Dropdown in top bar for cross-module navigation
- Shows only modules user has access to
- SSO-enabled (seamless navigation)

**Module Switcher Features:**
- Filters by `assignedModules` (for regular users)
- Shows all `licensedModules` (for admins)
- Redirects to module dashboard with SSO token

### **5. Independent Module Structure**
- Each module is self-contained
- Module-specific routes, components, and APIs
- No shared components between modules

---

## 📋 Module Access Flow

### **Employee Login Flow:**

```
1. Employee visits: /marketing/login
   ↓
2. Employee logs in
   ↓
3. Server validates:
   - tenant.licensedModules: ['marketing']
   - user.assignedModules: ['marketing']
   ↓
4. Generate JWT token with assignedModules
   ↓
5. Redirect to: /marketing/[tenantId]/Home/
   ↓
6. Marketing module dashboard loads
   - Top bar: Marketing-specific navigation
   - Module switcher: Shows only Marketing
   - Content: Marketing dashboard
```

### **Cross-Module Navigation:**

```
1. User on: /crm/[tenantId]/Home/
   ↓
2. Clicks "Marketing" in module switcher
   ↓
3. Check: Is 'marketing' in assignedModules?
   ↓
4. YES → Redirect to: /marketing/[tenantId]/Home/
   ↓
5. Marketing module middleware checks cookie
   ↓
6. Cookie found → Auto-login (SSO)
   ↓
7. Marketing dashboard loads
```

---

## 🔒 Access Control

### **Multi-Layer Protection:**

1. **Login Level:**
   - JWT token contains `assignedModules` and `licensedModules`
   - Token stored in cookie (works across subdomains)

2. **Middleware Level:**
   - Every module route protected
   - Checks `assignedModules` and `licensedModules`
   - Redirects to `/unauthorized` if no access

3. **Page Level:**
   - Each module page double-checks access
   - Additional security layer

---

## 📊 Module Structure

### **CRM Module:**
- **Route:** `/crm/[tenantId]/Home/`
- **Top Bar:** [Home] [Leads] [Contacts] [Accounts] [Deals] [Tasks] [Reports] [⚙️]
- **Module Switcher:** Shows accessible modules

### **Marketing Module:**
- **Route:** `/marketing/[tenantId]/Home/`
- **Top Bar:** [Home] [Campaigns] [Email] [Social] [Reports] [⚙️]
- **Module Switcher:** Shows accessible modules

### **Finance Module:**
- **Route:** `/finance/[tenantId]/Home/`
- **Top Bar:** [Home] [Invoices] [Accounting] [Purchase Orders] [GST] [Reports] [⚙️]
- **Module Switcher:** Shows accessible modules

---

## ✅ What This Means

### **For Developers:**
- ✅ No monolithic architecture code
- ✅ No shared sidebar components
- ✅ Each module is independent
- ✅ Direct module access only

### **For Users:**
- ✅ Direct access to assigned modules
- ✅ Module-specific navigation
- ✅ Seamless SSO between modules
- ✅ Clear module boundaries

### **For Admins:**
- ✅ Assign modules to users
- ✅ Users see only assigned modules
- ✅ Module switcher shows accessible modules
- ✅ Can create custom subdomain URLs

---

## 🚫 What We DON'T Have

- ❌ **No Monolithic Dashboard** - No central dashboard with all modules
- ❌ **No Shared Sidebar** - No sidebar across modules
- ❌ **No Monolithic Routes** - No `/dashboard` with all modules
- ❌ **No Shared Navigation** - Each module has its own navigation

---

## 📝 Documentation Standards

**All documentation must:**
- ✅ Reference decoupled architecture only
- ✅ Use direct module access URLs: `/crm/[tenantId]/Home/`
- ✅ Mention module-specific top bar (not sidebar)
- ✅ Reference module switcher (in top bar)
- ❌ Never reference monolithic architecture
- ❌ Never reference shared sidebar

---

**Last Updated:** January 2025  
**Status:** ✅ All documentation updated to reflect decoupled architecture only


# Next Steps After Phase 1 Completion

## ✅ Phase 1: Core Infrastructure - COMPLETE

- ✅ Multi-tenant database schema
- ✅ Tenant context resolution
- ✅ JWT authentication with RBAC
- ✅ Basic RBAC system
- ✅ Row-Level Security (RLS) policies

---

## 🚀 Phase 2: Module Framework (Next Priority)

According to the PayAid V3 Architecture Document, Phase 2 includes:

### 2.1 Module Registry
- Create module registry system
- Define module metadata (name, icon, routes, permissions)
- Module enablement/disablement per tenant

### 2.2 Navigation System
- Dynamic navigation based on enabled modules
- Module switcher component
- Route protection based on module access

### 2.3 Permission Checking Integration
- Integrate RBAC with module access
- Module-level permission checks
- Route-level permission enforcement

### 2.4 Module Switching
- API endpoint for module switching
- Context preservation across modules
- Analytics tracking for module usage

### 2.5 Admin Panel Structure
- Super admin panel (global, not tenant-specific)
- Tenant management interface
- Module enablement UI
- User role assignment UI

---

## 📋 Immediate Next Steps (Before Phase 2)

### 1. Assign Roles to Existing Users ⚠️ IMPORTANT

**Current Status:** Roles exist, but users aren't assigned to them yet.

**Action Required:**
```sql
-- Assign Admin role to your user (replace YOUR_EMAIL)
INSERT INTO "UserRole" ("tenantId", "userId", "roleId", "assignedAt")
SELECT 
  u."tenantId",
  u.id,
  r.id,
  NOW()
FROM "User" u
CROSS JOIN "Role" r
WHERE u.email = 'YOUR_EMAIL_HERE'
  AND r."roleName" = 'Admin'
  AND r."tenantId" = u."tenantId"
ON CONFLICT DO NOTHING;
```

**Or use:** `ASSIGN_FIRST_USER_ROLE.sql` file

### 2. Test RBAC is Working

**Verify:**
1. Login at https://payaid-v3.vercel.app/login
2. Check JWT token contains `roles` array
3. Verify `usingLegacyRole: false` in logs
4. Test permission checking in code

### 3. Create API Endpoint for Role Assignment

**Create:** `app/api/admin/assign-role/route.ts`
- Allow admins to assign roles to users
- Validate permissions
- Update user's JWT token (on next login)

---

## 🎯 Phase 2 Implementation Plan

### Week 1: Module Registry

**Tasks:**
1. Create `lib/modules/moduleRegistry.ts`
2. Define module structure (id, name, icon, routes, permissions)
3. Create module metadata for:
   - CRM
   - HR
   - Accounting
   - Communication
   - Reports
   - Payment Gateway
   - Workflow Automation
   - Analytics

**Files to Create:**
- `lib/modules/moduleRegistry.ts`
- `lib/modules/types.ts`
- `components/Navigation/ModuleNavigation.tsx`

### Week 2: Navigation System

**Tasks:**
1. Create module switcher component
2. Dynamic sidebar based on enabled modules
3. Route protection middleware
4. Module context provider

**Files to Create:**
- `components/Navigation/ModuleSwitcher.tsx`
- `components/Navigation/Sidebar.tsx`
- `middleware/module-access.ts`
- `contexts/ModuleContext.tsx`

### Week 3: Admin Panel

**Tasks:**
1. Create admin panel routes (`/admin/*`)
2. Tenant management UI
3. Module enablement UI
4. User role assignment UI
5. Super admin authentication

**Files to Create:**
- `app/admin/layout.tsx`
- `app/admin/tenants/page.tsx`
- `app/admin/tenants/[id]/modules/page.tsx`
- `app/admin/tenants/[id]/users/page.tsx`
- `components/Admin/TenantManagement.tsx`
- `components/Admin/ModuleToggle.tsx`

---

## 📝 Quick Wins (Can Do Now)

### 1. Create Role Assignment API

**File:** `app/api/admin/assign-role/route.ts`

```typescript
// Allow admins to assign roles to users
POST /api/admin/assign-role
Body: { userId, roleId }
```

### 2. Create User Roles API

**File:** `app/api/users/[userId]/roles/route.ts`

```typescript
// Get user's roles
GET /api/users/[userId]/roles

// Assign role to user
POST /api/users/[userId]/roles
Body: { roleId }
```

### 3. Enhance Login Response

**Update:** `app/api/auth/login/route.ts`

Add role assignment info to response:
```json
{
  "user": { ... },
  "roles": ["Admin"],
  "permissions": [...],
  "hasRoleAssigned": true
}
```

---

## 🔄 Current System Status

### ✅ Working
- Login with RBAC (if roles assigned)
- JWT tokens with roles/permissions
- Database schema complete
- Default roles exist

### ⚠️ Needs Attention
- **Users need roles assigned** (critical!)
- Module framework not yet implemented
- Admin panel not yet created
- Navigation still static

### 📋 Pending
- Module registry
- Dynamic navigation
- Admin panel
- SSO implementation (Phase 3)

---

## 🎯 Recommended Order

1. **Assign roles to users** (5 minutes) ⚠️ CRITICAL
2. **Test login with RBAC** (2 minutes)
3. **Create role assignment API** (30 minutes)
4. **Start Phase 2: Module Registry** (Week 1)

---

## 📚 Reference Documents

- `PayAid-V3-Architecture.md` - Full architecture
- `PHASE1_IMPLEMENTATION_SUMMARY.md` - Phase 1 details
- `RBAC_SETUP_COMPLETE.md` - RBAC setup summary
- `ASSIGN_FIRST_USER_ROLE.sql` - SQL to assign roles

---

## 🚀 Ready to Start Phase 2?

Once you've:
1. ✅ Assigned roles to users
2. ✅ Verified login works with RBAC
3. ✅ Tested permission checking

You're ready to begin **Phase 2: Module Framework**!

**Would you like me to start implementing Phase 2 now?**

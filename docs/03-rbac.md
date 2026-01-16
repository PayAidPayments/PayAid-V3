# PayAid V3 - Role-Based Access Control (RBAC)

**Version:** 3.0.0  
**Last Updated:** January 2026

---

## 1. Role Hierarchy

### Roles in the System

| Role | Level | Description | Permissions |
|------|-------|-------------|-------------|
| **OWNER** | 1 | Organization owner (1 per org) | All permissions, billing, SSO, compliance, user management |
| **ADMIN** | 2 | Organization administrator | All modules enabled, user roles, API keys, audit logs |
| **MANAGER** | 3 | Department manager | Department access (HR, Finance, Sales), create/edit/read within role, limited reporting |
| **MEMBER** | 4 | Standard user | Read own records, create assigned tasks, no admin/billing access |
| **VIEWER** | 5 | Read-only user | Read-only access to assigned data, no create/edit/delete |
| **API_INTEGRATION** | 6 | API integration role | Scoped to single endpoint, time-limited tokens (max 90 days), IP whitelisting |

### Role Descriptions

**OWNER:**
- Single owner per organization
- Full system access
- Billing and subscription management
- SSO configuration
- Compliance settings
- Cannot be deleted or demoted

**ADMIN:**
- Organization-wide administrative access
- User management (create, update, delete users)
- Module enablement/disablement
- API key management
- Audit log access
- Cannot access billing (owner-only)

**MANAGER:**
- Department-specific access
- Can manage team members within department
- Create, edit, read records in assigned modules
- Limited reporting access
- Cannot access admin settings

**MEMBER:**
- Standard user access
- Read own records and assigned data
- Create tasks assigned to self
- Limited module access based on license
- Cannot access admin or billing

**VIEWER:**
- Read-only access
- View assigned records
- No create, edit, or delete permissions
- Useful for auditors, consultants

**API_INTEGRATION:**
- Scoped API access
- Single endpoint or module access
- Time-limited tokens (max 90 days)
- IP whitelisting support
- Rate limiting per key

### Role Inheritance Structure

```
OWNER
  └─ Inherits: All permissions

ADMIN
  └─ Inherits: MANAGER, MEMBER, VIEWER permissions
  └─ Additional: User management, module management

MANAGER
  └─ Inherits: MEMBER, VIEWER permissions
  └─ Additional: Department management, team access

MEMBER
  └─ Inherits: VIEWER permissions
  └─ Additional: Create/edit own records

VIEWER
  └─ Base: Read-only access

API_INTEGRATION
  └─ Scoped: Single endpoint/module access
```

### Role Assignment Workflow

1. **Owner Assignment:**
   - Assigned during tenant creation
   - Cannot be changed except by system admin
   - Only one owner per tenant

2. **Admin Assignment:**
   - Owner can assign admins
   - Admins can assign other roles (except owner)
   - Requires owner approval for first admin

3. **Manager Assignment:**
   - Admin or owner can assign
   - Requires department/module specification
   - Can manage team members

4. **Member Assignment:**
   - Admin, owner, or manager can assign
   - Requires module license check
   - Automatic assignment on user creation

5. **Viewer Assignment:**
   - Admin or owner can assign
   - Read-only access granted
   - Useful for temporary access

### Default Roles vs. Custom Roles

**Default Roles:**
- OWNER, ADMIN, MANAGER, MEMBER, VIEWER, API_INTEGRATION
- System-defined, cannot be deleted
- Standard permissions per role

**Custom Roles (Future):**
- Organization admins can create custom roles
- Mix and match permissions
- Useful for specific business needs
- Not yet implemented (planned)

---

## 2. Permissions Matrix

### Permission Naming Convention

**Pattern:** `module:action`

**Examples:**
- `contacts:create` - Create contacts
- `contacts:read` - Read contacts
- `contacts:update` - Update contacts
- `contacts:delete` - Delete contacts
- `invoices:create` - Create invoices
- `invoices:approve` - Approve invoices
- `payments:process` - Process payments
- `admin:users:manage` - Manage users
- `admin:settings:update` - Update settings

### Module Permissions

#### CRM Module (`crm`)

| Permission | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|------------|-------|-------|---------|--------|--------|
| `crm:contacts:create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `crm:contacts:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `crm:contacts:update` | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| `crm:contacts:delete` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `crm:deals:create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `crm:deals:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `crm:deals:update` | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| `crm:deals:delete` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `crm:tasks:create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `crm:tasks:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `crm:tasks:update` | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| `crm:tasks:delete` | ✅ | ✅ | ✅ | ❌ | ❌ |

#### Invoicing Module (`invoicing`)

| Permission | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|------------|-------|-------|---------|--------|--------|
| `invoicing:invoices:create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `invoicing:invoices:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `invoicing:invoices:update` | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| `invoicing:invoices:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `invoicing:invoices:approve` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `invoicing:payment-links:generate` | ✅ | ✅ | ✅ | ✅ | ❌ |

#### Payment Module (`payments`)

| Permission | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|------------|-------|-------|---------|--------|--------|
| `payments:process` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `payments:refund` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `payments:reconcile` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `payments:read` | ✅ | ✅ | ✅ | ✅ | ✅ |

#### HR Module (`hr`)

| Permission | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|------------|-------|-------|---------|--------|--------|
| `hr:employees:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `hr:employees:read` | ✅ | ✅ | ✅ | ✅ (own) | ✅ (own) |
| `hr:employees:update` | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| `hr:payroll:read` | ✅ | ✅ | ✅ | ✅ (own) | ✅ (own) |
| `hr:payroll:process` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `hr:attendance:read` | ✅ | ✅ | ✅ | ✅ (own) | ✅ (own) |

#### Admin Module (`admin`)

| Permission | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|------------|-------|-------|---------|--------|--------|
| `admin:users:create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:users:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:users:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:settings:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:modules:manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:billing:manage` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `admin:audit-logs:read` | ✅ | ✅ | ❌ | ❌ | ❌ |

### Permission Dependency Rules

**Example Dependencies:**
- `payments:process` requires `invoices:read`
- `invoices:create` requires `contacts:read`
- `deals:create` requires `contacts:read`
- `admin:users:update` requires `admin:users:read`

**Enforcement:**
- Backend validates dependencies
- Frontend shows/hides UI based on permissions
- API returns 403 if dependency missing

### Dynamic vs. Static Permissions

**Static Permissions:**
- Defined in code
- Module-level permissions
- Standard CRUD operations

**Dynamic Permissions:**
- Object-level permissions (future)
- Field-level permissions (future)
- Custom role permissions (future)

### Organization-Level vs. Object-Level Permissions

**Organization-Level:**
- Access to entire module
- Example: `crm:contacts:read` (all contacts)

**Object-Level:**
- Access to specific records
- Example: Own contacts, assigned deals
- Implemented via `assignedToId` filtering

---

## 3. Permission Implementation

### Middleware Approach

**Authentication Middleware:**
```typescript
// lib/auth/middleware.ts
export async function requireAuth(request: NextRequest) {
  const token = extractToken(request)
  const payload = verifyToken(token)
  return payload
}
```

**Authorization Middleware:**
```typescript
// lib/auth/permissions.ts
export async function requirePermission(
  request: NextRequest,
  permission: string
) {
  const user = await requireAuth(request)
  const hasPermission = await checkPermission(user, permission)
  if (!hasPermission) {
    throw new Error('Forbidden')
  }
  return user
}
```

### Frontend Permission Checks

**Hook:**
```typescript
// hooks/usePermission.ts
export function usePermission(permission: string): boolean {
  const { user } = useAuth()
  return user?.permissions?.includes(permission) ?? false
}
```

**Component:**
```typescript
// components/PermissionGate.tsx
export function PermissionGate({ permission, children }) {
  const hasPermission = usePermission(permission)
  return hasPermission ? children : null
}
```

**Usage:**
```tsx
<PermissionGate permission="contacts:create">
  <Button>Create Contact</Button>
</PermissionGate>
```

### Permission Evaluation Logic

**Backend:**
1. Extract JWT token from request
2. Decode token to get user and role
3. Check role permissions (cached)
4. Check module license (from token)
5. Check object-level permissions (if applicable)
6. Return 403 if permission denied

**Frontend:**
1. Get user permissions from JWT token (decoded)
2. Check permission in component/hook
3. Show/hide UI elements
4. Disable actions if no permission

### Caching Strategy

**Role/Permission Cache:**
- Redis cache for role permissions
- Cache key: `role:permissions:${role}`
- TTL: 1 hour
- Invalidate on role update

**User Permission Cache:**
- Memory cache (L1) for user permissions
- Cache key: `user:permissions:${userId}`
- TTL: 5 minutes
- Invalidate on role change

### Real-Time Permission Updates

**Current:**
- Permissions updated on next login
- Token refresh updates permissions

**Future:**
- WebSocket notification on permission change
- Force token refresh on permission update

---

## 4. Granularity Levels

### Organization-Level Access (Multi-Tenant Isolation)

**Implementation:**
- All database queries filter by `tenantId`
- JWT token includes `tenantId`
- Middleware enforces tenant isolation
- Row-level security at database level (future)

**Example:**
```typescript
// Always filter by tenantId
const contacts = await prisma.contact.findMany({
  where: { tenantId: user.tenantId }
})
```

### Module-Level Access

**Implementation:**
- `licensedModules[]` in JWT token
- `ModuleGate` component checks license
- API routes check module license
- Redirect to app store if module not licensed

**Example:**
```typescript
// Check module license
if (!user.licensedModules.includes('crm')) {
  return NextResponse.json({ error: 'Module not licensed' }, { status: 403 })
}
```

### Object-Level Permissions

**Implementation:**
- `assignedToId` field on records
- Filter by `assignedToId` for non-admin users
- Admins see all records
- Managers see department records

**Example:**
```typescript
// Object-level filtering
const where = user.role === 'ADMIN'
  ? { tenantId: user.tenantId }
  : { tenantId: user.tenantId, assignedToId: user.id }
```

### Field-Level Permissions

**Current:** Not implemented  
**Future:** Hide sensitive fields (salary, passwords) based on role

### Data Visibility Rules by Role

**Sales Team:**
- See only assigned deals
- See only assigned contacts
- Cannot see HR data

**HR Team:**
- See only HR module data
- Cannot see financial data
- Cannot see sales pipeline

**Finance Team:**
- See invoices and payments
- Cannot see employee salaries (future)
- Cannot see sales deals

### Record Ownership and Sharing Logic

**Ownership:**
- `createdBy` field tracks creator
- `assignedTo` field tracks assignee
- Owner can always access record

**Sharing:**
- Records shared within team (future)
- Records shared across departments (future)
- Sharing permissions (read, edit, delete)

---

## 5. Special Cases

### Custom Roles Creation

**Current:** Not implemented  
**Future:**
- Organization admins create custom roles
- Mix and match permissions
- Assign to users
- Useful for specific business needs

### Permission Delegation

**Current:** Not implemented  
**Future:**
- User A can grant permissions to User B
- Time-limited delegation
- Audit trail for delegations

### Time-Based Access Restrictions

**Current:** Not implemented  
**Future:**
- Access only during business hours
- Time-based role activation
- Automatic role changes based on time

### IP-Based Restrictions

**Current:** API keys support IP whitelisting  
**Future:**
- User login from specific IPs
- Office IP whitelist
- VPN requirement for sensitive operations

### Two-Factor Authentication Requirements

**Implementation:**
- 2FA required for admin roles (optional)
- 2FA required for payment operations (optional)
- TOTP-based (Google Authenticator, Authy)
- Backup codes stored encrypted

**Configuration:**
- `POST /api/auth/2fa/enable` - Enable 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `twoFactorEnabled` field on User model

### Guest/Temporary User Access

**Current:** Not implemented  
**Future:**
- Temporary user accounts
- Time-limited access
- Read-only guest access
- Automatic expiration

---

## Summary

PayAid V3 implements a comprehensive RBAC system with 6 default roles (OWNER, ADMIN, MANAGER, MEMBER, VIEWER, API_INTEGRATION). Permissions are module-based with object-level filtering for data isolation. The system uses JWT tokens for authentication and caches permissions for performance.

**Key Features:**
- ✅ 6 default roles with clear hierarchy
- ✅ Module-based permissions
- ✅ Object-level data filtering
- ✅ Multi-tenant isolation
- ✅ Permission caching (Redis + memory)
- ✅ Frontend and backend permission checks
- ✅ 2FA support for sensitive operations

**Future Enhancements:**
- Custom roles creation
- Field-level permissions
- Permission delegation
- Time-based access restrictions
- Guest user access

# Login Performance Fix

**Issue:** Login taking forever even with only 5 customers  
**Root Cause:** Multiple blocking database queries during login

---

## 🔍 **IDENTIFIED PERFORMANCE ISSUES**

### **1. RBAC Queries (Blocking)**
- `getUserRoles()` - Multiple database queries with joins
- `getUserPermissions()` - Multiple database queries with joins
- These run **synchronously** during login, blocking the response

### **2. Cache Warming (Non-blocking but heavy)**
- `warmTenantCache()` - 5 parallel database queries
- While async, it still consumes database connections

---

## ✅ **SOLUTION: Optimize Login Performance**

### **Option 1: Skip RBAC for Small Tenants (Quick Fix)**

Make RBAC queries optional for tenants with minimal data:

```typescript
// In app/api/auth/login/route.ts
// Step 8: Get user roles and permissions (Phase 1: RBAC)
step = 'get_roles_permissions'
console.log('[LOGIN] Step 8: Fetching user roles and permissions...', { 
  userId: user.id,
  tenantId: user.tenantId || 'none',
})

let roles: string[] = []
let permissions: string[] = []

try {
  if (user.tenantId) {
    // OPTIMIZATION: Skip RBAC for small tenants or use fallback
    // Check if tenant has RBAC data (quick check)
    const hasRBACData = await prisma.userRole.count({
      where: { tenantId: user.tenantId },
      take: 1,
    })
    
    if (hasRBACData > 0) {
      // Only fetch RBAC if data exists
      roles = await getUserRoles(user.id, user.tenantId)
      permissions = await getUserPermissions(user.id, user.tenantId)
    }
    
    // Fallback to legacy role if no RBAC roles found
    if (roles.length === 0 && user.role) {
      roles = [user.role]
    }
    
    console.log('[LOGIN] Roles and permissions fetched', { 
      rolesCount: roles.length,
      permissionsCount: permissions.length,
      usedRBAC: hasRBACData > 0,
    })
  }
} catch (rbacError) {
  console.warn('[LOGIN] Failed to fetch RBAC data (using fallback):', {
    error: rbacError instanceof Error ? rbacError.message : String(rbacError),
  })
  // Fallback to legacy role
  if (user.role) {
    roles = [user.role]
  }
}
```

### **Option 2: Make Cache Warming Truly Optional**

Skip cache warming for small tenants:

```typescript
// Step 10: Warm cache for tenant (async, non-blocking)
step = 'warm_cache'
if (user.tenantId) {
  // OPTIMIZATION: Skip cache warming for small tenants
  // Check tenant size first
  const tenantSize = await Promise.all([
    prisma.contact.count({ where: { tenantId: user.tenantId } }),
    prisma.deal.count({ where: { tenantId: user.tenantId } }),
  ])
  
  const totalRecords = tenantSize[0] + tenantSize[1]
  
  // Only warm cache if tenant has significant data
  if (totalRecords > 50) {
    console.log('[LOGIN] Step 10: Warming cache for tenant...', { tenantId: user.tenantId })
    warmTenantCache(user.tenantId).catch((cacheError) => {
      console.warn('[LOGIN] Cache warming failed (non-critical):', {
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        tenantId: user.tenantId,
      })
    })
  } else {
    console.log('[LOGIN] Skipping cache warming for small tenant', { 
      tenantId: user.tenantId,
      totalRecords,
    })
  }
}
```

### **Option 3: Add Timeout to RBAC Queries**

Add timeout to prevent hanging:

```typescript
// Add timeout wrapper
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs)
    }),
  ])
}

// Use in login:
roles = await withTimeout(
  getUserRoles(user.id, user.tenantId),
  1000, // 1 second timeout
  user.role ? [user.role] : [] // fallback
)
```

---

## 🚀 **RECOMMENDED FIX: Combined Approach**

Apply all three optimizations for maximum performance.

/**
 * PayAid V3 – RBAC helpers
 * can(), getUserPermissions(), isSuperAdmin()
 */

import type { AuthUser, Permission } from '@/types/auth'

const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin']
const BUSINESS_ADMIN_ROLES = ['BUSINESS_ADMIN', 'business_admin', 'admin']

/** Role -> default permissions (tenant-scoped; Super Admin has all super_admin.*) */
const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'super_admin.overview',
    'super_admin.tenants',
    'super_admin.users',
    'super_admin.plans',
    'super_admin.feature_flags',
    'super_admin.billing',
    'super_admin.system',
  ],
  super_admin: [
    'super_admin.overview',
    'super_admin.tenants',
    'super_admin.users',
    'super_admin.plans',
    'super_admin.feature_flags',
    'super_admin.billing',
    'super_admin.system',
  ],
  BUSINESS_ADMIN: [
    'admin.users.manage',
    'admin.users.invite',
    'admin.roles.manage',
    'admin.modules.manage',
    'admin.billing.view',
    'admin.billing.manage',
    'admin.integrations.manage',
    'admin.audit_log.view',
  ],
  business_admin: [
    'admin.users.manage',
    'admin.users.invite',
    'admin.roles.manage',
    'admin.modules.manage',
    'admin.billing.view',
    'admin.billing.manage',
    'admin.integrations.manage',
    'admin.audit_log.view',
  ],
  admin: [
    'admin.users.manage',
    'admin.users.invite',
    'admin.roles.manage',
    'admin.modules.manage',
    'admin.billing.view',
    'admin.billing.manage',
    'admin.integrations.manage',
    'admin.audit_log.view',
  ],
  MANAGER: [
    'crm.contacts.view',
    'crm.contacts.create',
    'crm.contacts.edit',
    'crm.deals.view',
    'crm.deals.create',
    'crm.deals.edit',
    'crm.leads.view',
    'crm.leads.create',
    'crm.leads.edit',
    'billing.invoices.view',
    'feature.ai.use',
    'feature.workflows.use',
  ],
  SALES: [
    'crm.contacts.view',
    'crm.contacts.create',
    'crm.deals.view',
    'crm.deals.create',
    'crm.leads.view',
    'crm.leads.create',
    'billing.invoices.view',
    'feature.ai.use',
  ],
  FINANCE: [
    'billing.invoices.view',
    'billing.invoices.create',
    'billing.invoices.edit',
    'billing.payments.view',
    'billing.payments.manage',
    'crm.contacts.view',
    'feature.ai.use',
  ],
  SUPPORT: [
    'crm.contacts.view',
    'crm.contacts.edit',
    'feature.support.use',
    'feature.ai.use',
  ],
  VIEWER: [
    'crm.contacts.view',
    'crm.deals.view',
    'crm.leads.view',
    'billing.invoices.view',
  ],
}

function getRoles(user: AuthUser): string[] {
  const roles = user.roles ?? (user.role ? [user.role] : [])
  return Array.isArray(roles) ? roles : []
}

/**
 * Check if user has a permission.
 * Super Admin has all super_admin.* and can do anything in their context.
 * Otherwise checks explicit permissions array then role defaults for the given businessId (tenant).
 */
export function can({
  user,
  permission,
  businessId,
}: {
  user: AuthUser
  permission: Permission
  businessId?: string | null
}): boolean {
  if (!user) return false

  const roles = getRoles(user)

  // Super Admin: allow all super_admin.* and effectively all tenant-admin permissions when acting in context
  if (roles.some((r) => SUPER_ADMIN_ROLES.includes(String(r)))) {
    if (permission.startsWith('super_admin.')) return true
    // When viewing tenant scope, super admin can do admin.*
    if (permission.startsWith('admin.')) return true
    return true
  }

  const explicit = user.permissions ?? []
  const permSet = new Set(
    Array.isArray(explicit) ? explicit.map(String) : []
  )
  if (permSet.has(permission)) return true

  for (const role of roles) {
    const r = String(role).toUpperCase()
    const defaults = ROLE_DEFAULT_PERMISSIONS[r] ?? ROLE_DEFAULT_PERMISSIONS[role]
    if (defaults?.includes(permission)) return true
  }

  return false
}

/**
 * Get all permissions for a user in a tenant context.
 * Super Admin gets all known permissions; others get role defaults + explicit.
 */
export function getUserPermissions({
  user,
  businessId,
}: {
  user: AuthUser
  businessId?: string | null
}): Permission[] {
  const roles = getRoles(user)
  const explicit = (user.permissions ?? []).filter(
    (p): p is Permission => typeof p === 'string'
  )
  const set = new Set<Permission>(explicit)

  if (roles.some((r) => SUPER_ADMIN_ROLES.includes(String(r)))) {
    return [
      'super_admin.overview',
      'super_admin.tenants',
      'super_admin.users',
      'super_admin.plans',
      'super_admin.feature_flags',
      'super_admin.billing',
      'super_admin.system',
      'admin.users.manage',
      'admin.users.invite',
      'admin.roles.manage',
      'admin.modules.manage',
      'admin.billing.view',
      'admin.billing.manage',
      'admin.integrations.manage',
      'admin.audit_log.view',
    ]
  }

  for (const role of roles) {
    const r = String(role).toUpperCase()
    const defaults = ROLE_DEFAULT_PERMISSIONS[r] ?? ROLE_DEFAULT_PERMISSIONS[role]
    if (defaults) defaults.forEach((p) => set.add(p))
  }

  return Array.from(set)
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  if (!user) return false
  const roles = getRoles(user)
  return roles.some((r) => SUPER_ADMIN_ROLES.includes(String(r)))
}

export function isBusinessAdmin(user: AuthUser | null, businessId?: string | null): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const roles = getRoles(user)
  return roles.some((r) => BUSINESS_ADMIN_ROLES.includes(String(r)))
}

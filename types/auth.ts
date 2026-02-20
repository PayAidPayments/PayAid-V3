/**
 * PayAid V3 – RBAC types
 * Roles and permissions for Super Admin, Business Admin, and tenant users.
 */

export const ROLES = [
  'SUPER_ADMIN',
  'BUSINESS_ADMIN',
  'MANAGER',
  'SALES',
  'FINANCE',
  'SUPPORT',
  'VIEWER',
] as const

export type Role = (typeof ROLES)[number]

/** Permission codes (module.action or resource.action) */
export type Permission =
  // Super Admin (platform-level)
  | 'super_admin.overview'
  | 'super_admin.tenants'
  | 'super_admin.users'
  | 'super_admin.plans'
  | 'super_admin.feature_flags'
  | 'super_admin.billing'
  | 'super_admin.system'
  // Business Admin (tenant-level)
  | 'admin.users.manage'
  | 'admin.users.invite'
  | 'admin.roles.manage'
  | 'admin.modules.manage'
  | 'admin.billing.view'
  | 'admin.billing.manage'
  | 'admin.integrations.manage'
  | 'admin.audit_log.view'
  // CRM
  | 'crm.contacts.view'
  | 'crm.contacts.create'
  | 'crm.contacts.edit'
  | 'crm.contacts.delete'
  | 'crm.deals.view'
  | 'crm.deals.create'
  | 'crm.deals.edit'
  | 'crm.deals.delete'
  | 'crm.leads.view'
  | 'crm.leads.create'
  | 'crm.leads.edit'
  | 'crm.leads.delete'
  // Billing / Finance
  | 'billing.invoices.view'
  | 'billing.invoices.create'
  | 'billing.invoices.edit'
  | 'billing.invoices.delete'
  | 'billing.payments.view'
  | 'billing.payments.manage'
  // Feature / AI
  | 'feature.ai.use'
  | 'feature.ai.dashboard'
  | 'feature.ai.copilot'
  | 'feature.workflows.use'
  | 'feature.marketing.use'
  | 'feature.support.use'
  | 'feature.whatsapp.use'

/** User shape expected by RBAC (session / JWT) */
export interface AuthUser {
  id: string
  email: string
  name?: string | null
  role?: string
  roles?: string[]
  permissions?: string[]
  tenantId?: string
  tenant_id?: string
}

/** Context for permission check */
export interface PermissionContext {
  user: AuthUser
  permission: Permission
  businessId?: string | null
}

/**
 * Phase 2: Module Types
 * TypeScript types for module system
 */

export interface ModuleRoute {
  path: string
  label: string
  icon?: string
  requiredPermission?: string
  adminOnly?: boolean
}

export interface ModuleDefinition {
  id: string
  name: string
  description: string
  icon: string
  order: number
  enabled_by_default: boolean
  category: 'core' | 'addon' | 'premium'
  routes: ModuleRoute[]
  required_permissions: string[]
  admin_only_routes?: string[]
  settings_route?: string
}

export interface ModuleAccess {
  moduleId: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canAdmin: boolean
}

export interface UserModuleAccess {
  userId: string
  tenantId: string
  modules: ModuleAccess[]
}

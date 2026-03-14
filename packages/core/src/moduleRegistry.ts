/**
 * Phase 2: Module Registry
 * Based on PayAid V3 Architecture Document
 * 
 * Defines all available modules, their routes, permissions, and metadata
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

/**
 * Module Registry - All available modules in PayAid V3
 */
export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  crm: {
    id: 'crm',
    name: 'CRM',
    description: 'Customer Relationship Management',
    icon: 'Users',
    order: 1,
    enabled_by_default: true,
    category: 'core',
    routes: [
      { path: '/crm', label: 'Dashboard' },
      { path: '/crm/leads', label: 'Leads' },
      { path: '/crm/deals', label: 'Deals' },
      { path: '/crm/customers', label: 'Customers' },
      { path: '/crm/pipeline', label: 'Pipeline' },
      { path: '/crm/activities', label: 'Activities' },
      { path: '/crm/reports', label: 'Reports' },
      { path: '/crm/settings', label: 'Settings', adminOnly: true },
    ],
    required_permissions: ['crm:read'],
    admin_only_routes: ['/crm/settings', '/crm/integration'],
    settings_route: '/crm/settings',
  },
  hr: {
    id: 'hr',
    name: 'HR Management',
    description: 'Employee Management & Payroll',
    icon: 'UserCog',
    order: 2,
    enabled_by_default: true,
    category: 'core',
    routes: [
      { path: '/hr', label: 'Dashboard' },
      { path: '/hr/employees', label: 'Employees' },
      { path: '/hr/attendance', label: 'Attendance' },
      { path: '/hr/payroll', label: 'Payroll', adminOnly: true },
      { path: '/hr/leave', label: 'Leave Management' },
      { path: '/hr/performance', label: 'Performance' },
      { path: '/hr/documents', label: 'Documents' },
      { path: '/hr/settings', label: 'Settings', adminOnly: true },
    ],
    required_permissions: ['hr:read'],
    admin_only_routes: ['/hr/payroll', '/hr/settings'],
    settings_route: '/hr/settings',
  },
  accounting: {
    id: 'accounting',
    name: 'Accounting',
    description: 'Financial Management & Invoicing',
    icon: 'DollarSign',
    order: 3,
    enabled_by_default: true,
    category: 'core',
    routes: [
      { path: '/accounting', label: 'Dashboard' },
      { path: '/accounting/invoices', label: 'Invoices' },
      { path: '/accounting/expenses', label: 'Expenses' },
      { path: '/accounting/reports', label: 'Reports' },
      { path: '/accounting/reconciliation', label: 'Reconciliation' },
      { path: '/accounting/settings', label: 'Settings', adminOnly: true },
    ],
    required_permissions: ['accounting:read'],
    admin_only_routes: ['/accounting/settings', '/accounting/reconciliation'],
    settings_route: '/accounting/settings',
  },
  communication: {
    id: 'communication',
    name: 'Communication',
    description: 'Email, WhatsApp, SMS',
    icon: 'MessageSquare',
    order: 4,
    enabled_by_default: false,
    category: 'addon',
    routes: [
      { path: '/communication', label: 'Dashboard' },
      { path: '/communication/email', label: 'Email' },
      { path: '/communication/whatsapp', label: 'WhatsApp' },
      { path: '/communication/sms', label: 'SMS' },
      { path: '/communication/templates', label: 'Templates' },
      { path: '/communication/settings', label: 'Settings', adminOnly: true },
    ],
    required_permissions: ['communication:read'],
    admin_only_routes: ['/communication/settings'],
    settings_route: '/communication/settings',
  },
  reports: {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Business Intelligence',
    icon: 'BarChart3',
    order: 5,
    enabled_by_default: false,
    category: 'addon',
    routes: [
      { path: '/reports', label: 'Dashboard' },
      { path: '/reports/custom', label: 'Custom Reports' },
      { path: '/reports/analytics', label: 'Analytics' },
      { path: '/reports/exports', label: 'Exports' },
      { path: '/reports/settings', label: 'Settings', adminOnly: true },
    ],
    required_permissions: ['reports:read'],
    admin_only_routes: ['/reports/settings'],
    settings_route: '/reports/settings',
  },
  payments: {
    id: 'payments',
    name: 'Payment Gateway',
    description: 'Payment Processing & Settlements',
    icon: 'CreditCard',
    order: 6,
    enabled_by_default: false,
    category: 'addon',
    routes: [
      { path: '/payments', label: 'Dashboard' },
      { path: '/payments/transactions', label: 'Transactions' },
      { path: '/payments/settlements', label: 'Settlements' },
      { path: '/payments/disputes', label: 'Disputes' },
      { path: '/payments/settings', label: 'Settings', adminOnly: true },
    ],
    required_permissions: ['payments:read'],
    admin_only_routes: ['/payments/settings'],
    settings_route: '/payments/settings',
  },
  workflow: {
    id: 'workflow',
    name: 'Workflow Automation',
    description: 'n8n-based Automation',
    icon: 'Workflow',
    order: 7,
    enabled_by_default: false,
    category: 'premium',
    routes: [
      { path: '/workflow', label: 'Dashboard' },
      { path: '/workflow/workflows', label: 'Workflows' },
      { path: '/workflow/executions', label: 'Executions' },
      { path: '/workflow/templates', label: 'Templates' },
      { path: '/workflow/settings', label: 'Settings', adminOnly: true },
    ],
    required_permissions: ['workflow:read'],
    admin_only_routes: ['/workflow/settings'],
    settings_route: '/workflow/settings',
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics Engine',
    description: 'Advanced Analytics & Insights',
    icon: 'TrendingUp',
    order: 8,
    enabled_by_default: false,
    category: 'premium',
    routes: [
      { path: '/analytics', label: 'Dashboard' },
      { path: '/analytics/insights', label: 'Insights' },
      { path: '/analytics/dashboards', label: 'Dashboards' },
      { path: '/analytics/settings', label: 'Settings', adminOnly: true },
    ],
    required_permissions: ['analytics:read'],
    admin_only_routes: ['/analytics/settings'],
    settings_route: '/analytics/settings',
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campaigns, Ads & Social',
    icon: 'Megaphone',
    order: 9,
    enabled_by_default: false,
    category: 'addon',
    routes: [
      { path: '/marketing', label: 'Home' },
      { path: '/marketing/Studio', label: 'Studio' },
      { path: '/marketing/Campaigns', label: 'Campaigns' },
      { path: '/marketing/Analytics', label: 'Analytics' },
    ],
    required_permissions: ['marketing:read'],
    admin_only_routes: [],
    settings_route: '/marketing/settings',
  },
  /** Standalone PayAid Social product (Marketing-only). Entitlement: licensedModules includes "social". */
  social: {
    id: 'social',
    name: 'PayAid Social',
    description: 'Marketing Studio – single-flow create, schedule, launch',
    icon: 'Megaphone',
    order: 9.5,
    enabled_by_default: false,
    category: 'addon',
    routes: [
      { path: '/studio', label: 'Studio' },
      { path: '/library', label: 'Library' },
      { path: '/analytics', label: 'Analytics' },
    ],
    required_permissions: ['marketing:read'],
    admin_only_routes: [],
    settings_route: undefined,
  },
  sales: {
    id: 'sales',
    name: 'Sales',
    description: 'Orders & Landing Pages',
    icon: 'ShoppingCart',
    order: 10,
    enabled_by_default: false,
    category: 'addon',
    routes: [{ path: '/sales', label: 'Dashboard' }],
    required_permissions: ['sales:read'],
    admin_only_routes: [],
    settings_route: '/sales/settings',
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    description: 'Invoices, GST & Accounting',
    icon: 'DollarSign',
    order: 11,
    enabled_by_default: false,
    category: 'addon',
    routes: [{ path: '/finance', label: 'Dashboard' }],
    required_permissions: ['finance:read'],
    admin_only_routes: [],
    settings_route: '/finance/settings',
  },
  projects: {
    id: 'projects',
    name: 'Projects',
    description: 'Tasks & Gantt',
    icon: 'FolderKanban',
    order: 12,
    enabled_by_default: false,
    category: 'addon',
    routes: [{ path: '/projects', label: 'Dashboard' }],
    required_permissions: ['projects:read'],
    admin_only_routes: [],
    settings_route: '/projects/settings',
  },
  inventory: {
    id: 'inventory',
    name: 'Inventory',
    description: 'Products & Warehouses',
    icon: 'Package',
    order: 13,
    enabled_by_default: false,
    category: 'addon',
    routes: [{ path: '/inventory', label: 'Dashboard' }],
    required_permissions: ['inventory:read'],
    admin_only_routes: [],
    settings_route: '/inventory/settings',
  },
}

/**
 * Get enabled modules for a tenant
 */
export function getEnabledModules(
  tenant: { licensedModules?: string[] },
  userRoles?: string[]
): ModuleDefinition[] {
  const enabledModuleIds = tenant.licensedModules || []
  
  return Object.values(MODULE_REGISTRY)
    .filter(module => enabledModuleIds.includes(module.id))
    .sort((a, b) => a.order - b.order)
}

/**
 * Get accessible routes based on user permissions and enabled modules
 */
export function getAccessibleRoutes(
  user: {
    roles?: string[]
    permissions?: string[]
  },
  tenant: {
    licensedModules?: string[]
  }
): Array<{
  module: string
  moduleName: string
  moduleIcon: string
  routes: ModuleRoute[]
}> {
  const enabledModules = getEnabledModules(tenant, user.roles)
  const accessibleRoutes: Array<{
    module: string
    moduleName: string
    moduleIcon: string
    routes: ModuleRoute[]
  }> = []

  enabledModules.forEach(module => {
    const moduleRoutes = module.routes.filter(route => {
      // Check if route is admin-only
      if (route.adminOnly || module.admin_only_routes?.includes(route.path)) {
        const isAdmin = user.roles?.includes('admin') || user.roles?.includes('Admin')
        if (!isAdmin) return false
      }

      // Check if user has required permission for module
      const hasModulePermission = user.permissions?.some(perm =>
        module.required_permissions.some(reqPerm =>
          perm === reqPerm || perm === '*'
        )
      )

      // Check route-specific permission
      if (route.requiredPermission) {
        const hasRoutePermission = user.permissions?.some(perm =>
          perm === route.requiredPermission || perm === '*'
        )
        if (!hasRoutePermission) return false
      }

      return hasModulePermission
    })

    if (moduleRoutes.length > 0) {
      accessibleRoutes.push({
        module: module.id,
        moduleName: module.name,
        moduleIcon: module.icon,
        routes: moduleRoutes,
      })
    }
  })

  return accessibleRoutes
}

/**
 * Check if user has access to a module
 */
export function hasModuleAccess(
  moduleId: string,
  user: {
    roles?: string[]
    permissions?: string[]
  },
  tenant: {
    licensedModules?: string[]
  }
): boolean {
  // Check if module is enabled for tenant
  if (!tenant.licensedModules?.includes(moduleId)) {
    return false
  }

  const module = MODULE_REGISTRY[moduleId]
  if (!module) return false

  // Check if user has required permission
  return user.permissions?.some(perm =>
    module.required_permissions.some(reqPerm =>
      perm === reqPerm || perm === '*'
    )
  ) || false
}

/**
 * Get module by ID
 */
export function getModule(moduleId: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY[moduleId]
}

/**
 * Get all modules (for admin panel)
 */
export function getAllModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY).sort((a, b) => a.order - b.order)
}

/**
 * Get modules by category
 */
export function getModulesByCategory(category: 'core' | 'addon' | 'premium'): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY)
    .filter(module => module.category === category)
    .sort((a, b) => a.order - b.order)
}

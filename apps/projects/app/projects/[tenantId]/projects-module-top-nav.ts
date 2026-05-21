export type ProjectsModuleTopNavItem = { name: string; href: string }

/**
 * Shared Projects module top bar. Time is last so portfolio / tasks stay primary (module spec P1).
 */
export function projectsModuleTopNavItems(tenantId: string): ProjectsModuleTopNavItem[] {
  return [
    { name: 'Home', href: `/projects/${tenantId}/Home` },
    { name: 'All Projects', href: `/projects/${tenantId}/Projects` },
    { name: 'Service packages', href: `/projects/${tenantId}/Service-packages` },
    { name: 'Tasks', href: `/projects/${tenantId}/Tasks` },
    { name: 'Gantt Chart', href: `/projects/${tenantId}/Gantt` },
    { name: 'Kanban', href: `/projects/${tenantId}/Kanban` },
    { name: 'Reports', href: `/projects/${tenantId}/Reports` },
    { name: 'Time', href: `/projects/${tenantId}/Time` },
  ]
}

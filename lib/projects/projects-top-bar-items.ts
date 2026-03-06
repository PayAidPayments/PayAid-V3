/**
 * Single source of truth for Projects module top bar.
 * Used in app/projects/[tenantId]/layout.tsx.
 */

export interface ProjectsTopBarItem {
  name: string
  href: string
  icon?: string
}

export function getProjectsTopBarItems(tenantId: string): ProjectsTopBarItem[] {
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return []
  }
  const base = `/projects/${tenantId}`
  return [
    { name: 'Home', href: `${base}/Home` },
    { name: 'All Projects', href: `${base}/Projects` },
    { name: 'Tasks', href: `${base}/Tasks` },
    { name: 'Time Tracking', href: `${base}/Time` },
    { name: 'Gantt Chart', href: `${base}/Gantt` },
    { name: 'Reports', href: `${base}/Reports` },
  ]
}

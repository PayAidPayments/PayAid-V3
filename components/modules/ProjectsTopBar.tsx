'use client'

import { ModuleTopBar } from './ModuleTopBar'

export function ProjectsTopBar() {
  return (
    <ModuleTopBar
      moduleId="projects"
      moduleName="Projects"
      items={[
        { name: 'Home', href: '/dashboard/projects', icon: '🏠' },
        { name: 'Projects', href: '/dashboard/projects/list', icon: '📋' },
        { name: 'Tasks', href: '/dashboard/projects/tasks', icon: '✅' },
        { name: 'Time Tracking', href: '/dashboard/projects/time-tracking', icon: '⏱️' },
        { name: 'Resources', href: '/dashboard/projects/resources', icon: '👥' },
        { name: 'Reports', href: '/dashboard/projects/reports', icon: '📊' },
      ]}
    />
  )
}


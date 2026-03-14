'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function ProjectsTasksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/projects/${tenantId}/Home` },
    { name: 'All Projects', href: `/projects/${tenantId}/Projects` },
    { name: 'Tasks', href: `/projects/${tenantId}/Tasks` },
    { name: 'Time Tracking', href: `/projects/${tenantId}/Time` },
    { name: 'Gantt Chart', href: `/projects/${tenantId}/Gantt` },
    { name: 'Reports', href: `/projects/${tenantId}/Reports` },
  ]

  return (
    <AppShell moduleId="projects" moduleName="Projects" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}

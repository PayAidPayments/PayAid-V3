'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function ProjectsTimeLayout({
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="projects"
          moduleName="Projects"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

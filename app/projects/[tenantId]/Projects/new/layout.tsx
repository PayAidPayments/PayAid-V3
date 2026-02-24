'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function NewProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/projects/${tenantId}/Home` },
    { name: 'Projects', href: `/projects/${tenantId}/Projects` },
    { name: 'Tasks', href: `/projects/${tenantId}/Tasks` },
    { name: 'Time', href: `/projects/${tenantId}/Time` },
    { name: 'Gantt', href: `/projects/${tenantId}/Gantt` },
  ]

  return (
    <AppShell moduleId="projects" moduleName="Projects" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}

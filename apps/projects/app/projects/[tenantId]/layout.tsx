'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'
import { projectsModuleTopNavItems } from './projects-module-top-nav'

/**
 * Single Projects module shell for all /projects/[tenantId]/* routes.
 * ModuleSwitcher lives in ModuleTopBar (via AppShell).
 */
export default function ProjectsTenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string
  const topBarItems = projectsModuleTopNavItems(tenantId)

  return (
    <AppShell moduleId="projects" moduleName="Projects" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}

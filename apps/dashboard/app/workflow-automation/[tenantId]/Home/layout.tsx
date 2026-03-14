'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function WorkflowAutomationHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/workflow-automation/${tenantId}/Home` },
    { name: 'Workflows', href: `/workflow-automation/${tenantId}/Workflows` },
    { name: 'Templates', href: `/workflow-automation/${tenantId}/Templates` },
  ]

  return (
    <AppShell moduleId="workflow-automation" moduleName="Workflow Automation" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}

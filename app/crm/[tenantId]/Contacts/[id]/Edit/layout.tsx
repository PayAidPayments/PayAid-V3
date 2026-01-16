'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function EditContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/crm/${tenantId}/Home` },
    { name: 'Contacts', href: `/crm/${tenantId}/Contacts` },
    { name: 'Deals', href: `/crm/${tenantId}/Deals` },
    { name: 'Leads', href: `/crm/${tenantId}/Leads` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="crm"
          moduleName="CRM"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

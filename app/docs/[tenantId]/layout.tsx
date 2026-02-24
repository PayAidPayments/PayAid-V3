'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function DocsTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const items = [
    { name: 'Home', href: `/docs/${tenantId}/Home` },
    { name: 'Documents', href: `/docs/${tenantId}/Documents` },
    { name: 'Folders', href: `/docs/${tenantId}/Folders` },
  ]
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar moduleId="docs" moduleName="Docs" items={items} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

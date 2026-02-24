'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function DriveTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const items = [
    { name: 'Home', href: `/drive/${tenantId}/Home` },
    { name: 'My Drive', href: `/drive/${tenantId}/MyDrive` },
    { name: 'Shared', href: `/drive/${tenantId}/Shared` },
  ]
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar moduleId="drive" moduleName="Drive" items={items} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

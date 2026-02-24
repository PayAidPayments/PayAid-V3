'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function MeetTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const items = [
    { name: 'Home', href: `/meet/${tenantId}/Home` },
    { name: 'Meetings', href: `/meet/${tenantId}/Meetings` },
    { name: 'Recordings', href: `/meet/${tenantId}/Recordings` },
  ]
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar moduleId="meet" moduleName="Meet" items={items} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

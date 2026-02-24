'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function SlidesTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const items = [
    { name: 'Home', href: `/slides/${tenantId}/Home` },
    { name: 'Presentations', href: `/slides/${tenantId}/Presentations` },
    { name: 'Templates', href: `/slides/${tenantId}/Templates` },
  ]
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar moduleId="slides" moduleName="Slides" items={items} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

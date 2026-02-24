'use client'

import { ModuleTopBar } from '@/components/modules/ModuleTopBar'
import { useTenantId } from '@/lib/utils/get-tenant-id'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CRMAgentsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const tenantId = useTenantId()

  useEffect(() => {
    if (!tenantId) router.replace('/crm')
  }, [tenantId, router])

  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) return null

  const topBarItems = [
    { name: 'Home', href: `/crm/${tenantId}/Home` },
    { name: 'Prospects', href: `/crm/${tenantId}/Leads` },
    { name: 'Agents', href: `/crm/${tenantId}/Agents` },
    { name: 'Contacts', href: `/crm/${tenantId}/AllPeople` },
    { name: 'Deals', href: `/crm/${tenantId}/Deals` },
    { name: 'Reports', href: `/crm/${tenantId}/Reports` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar moduleId="crm" moduleName="CRM" items={topBarItems} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

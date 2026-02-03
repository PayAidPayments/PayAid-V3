'use client'

import { ModuleTopBar } from '@/components/modules/ModuleTopBar'
import { useTenantId } from '@/lib/utils/get-tenant-id'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CRMDealsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const router = useRouter()
    const tenantId = useTenantId()

    // Redirect if tenantId is not available
    useEffect(() => {
      if (!tenantId) {
        router.replace('/crm')
      }
    }, [tenantId, router])

    // Don't render if tenantId is not available
    if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
      return null
    }

  const topBarItems = [
    { name: 'Home', href: `/crm/${tenantId}/Home` },
    { name: 'Prospects', href: `/crm/${tenantId}/Leads` },
    { name: 'Contacts', href: `/crm/${tenantId}/Contacts` },
    { name: 'Customers', href: `/crm/${tenantId}/AllPeople?stage=customer` },
    { name: 'Deals', href: `/crm/${tenantId}/Deals` },
    { name: 'All People', href: `/crm/${tenantId}/AllPeople` },
    { name: 'Tasks', href: `/crm/${tenantId}/Tasks` },
    { name: 'Meetings', href: `/crm/${tenantId}/Meetings` },
    { name: 'CPQ', href: `/crm/${tenantId}/CPQ` },
    { name: 'Sales Automation', href: `/crm/${tenantId}/SalesAutomation` },
    { name: 'Sales Enablement', href: `/crm/${tenantId}/SalesEnablement` },
    { name: 'Dialer', href: `/crm/${tenantId}/Dialer` },
    { name: 'Customer Success', href: `/crm/${tenantId}/CustomerSuccess` },
    { name: 'Visitors', href: `/crm/${tenantId}/Visitors` },
    { name: 'Reports', href: `/crm/${tenantId}/Reports` },
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

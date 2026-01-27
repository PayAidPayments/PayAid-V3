'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'
import { useAuthStore } from '@/lib/stores/auth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CRMHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const { tenant } = useAuthStore()
  
  // Get tenantId from URL params first, fallback to auth store
  // Handle both string and array cases (Next.js can return either)
  const tenantIdParam = params?.tenantId
  const tenantIdFromParams = Array.isArray(tenantIdParam) 
    ? tenantIdParam[0] 
    : (tenantIdParam as string | undefined)
  const tenantId = (tenantIdFromParams && typeof tenantIdFromParams === 'string' && tenantIdFromParams.trim()) 
    ? tenantIdFromParams 
    : (tenant?.id && typeof tenant.id === 'string' ? tenant.id : undefined)

  // Redirect if tenantId is still not available
  useEffect(() => {
    // Ensure tenantId is a valid string
    if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
      if (tenant?.id && typeof tenant.id === 'string') {
        router.replace(`/crm/${tenant.id}/Home/`)
      } else {
        router.replace('/crm')
      }
    }
  }, [tenantId, tenant?.id, router])

  // Don't render if tenantId is not available or not a valid string
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

  // Update other CRM layouts to include Customer Success
  // This is done in their respective layout files

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

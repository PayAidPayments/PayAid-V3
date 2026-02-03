'use client'

import { ModuleTopBar } from '@/components/modules/ModuleTopBar'
import { useTenantId } from '@/lib/utils/get-tenant-id'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
  } catch (error: any) {
    console.error('[DEALS_LAYOUT] Layout error:', error)
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Error Loading Layout</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}

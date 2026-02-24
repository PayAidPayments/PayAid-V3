'use client'

import { AppShell } from '@/components/modules/AppShell'
import { useTenantId } from '@/lib/utils/get-tenant-id'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CRMMeetingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    { name: 'Sales Automation', href: `/crm/${tenantId}/SalesAutomation` },
    { name: 'Dialer', href: `/crm/${tenantId}/Dialer` },
    { name: 'Customer Success', href: `/crm/${tenantId}/CustomerSuccess` },
    { name: 'Visitors', href: `/crm/${tenantId}/Visitors` },
    { name: 'Reports', href: `/crm/${tenantId}/Reports` },
  ]

  return (
    <AppShell moduleId="crm" moduleName="CRM" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}

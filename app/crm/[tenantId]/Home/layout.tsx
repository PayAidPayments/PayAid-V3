'use client'

import { AppShell } from '@/components/modules/AppShell'
import { useParams } from 'next/navigation'

export default function CRMHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  
  // Get tenantId from URL params (should always be present if we're on this route)
  const tenantIdParam = params?.tenantId
  const tenantIdFromParams = Array.isArray(tenantIdParam) 
    ? (tenantIdParam[0] || null)
    : (tenantIdParam as string | undefined || null)
  const tenantId = (tenantIdFromParams && typeof tenantIdFromParams === 'string' && tenantIdFromParams.trim()) 
    ? tenantIdFromParams 
    : undefined

  // NO REDIRECT LOGIC - If tenantId is in URL params, render the layout
  // The entry point (/crm) handles redirecting to the correct URL
  // This layout should just render if tenantId is in the URL
  
  // If no tenantId in URL params, don't render (entry point will handle redirect)
  if (!tenantIdFromParams || typeof tenantIdFromParams !== 'string' || !tenantIdFromParams.trim()) {
    return null
  }

  const topBarItems = [
    { name: 'Home', href: `/crm/${tenantId}/Home` },
    { name: 'Prospects', href: `/crm/${tenantId}/Leads` },
    { name: 'Agents', href: `/crm/${tenantId}/Agents` },
    { name: 'Churn', href: `/crm/${tenantId}/Churn` },
    { name: 'Metrics', href: `/crm/${tenantId}/Metrics` },
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
    <AppShell moduleId="crm" moduleName="CRM" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}

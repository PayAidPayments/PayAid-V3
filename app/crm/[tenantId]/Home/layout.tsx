'use client'

import { ModuleTopBar } from '@/components/modules/ModuleTopBar'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

export default function CRMHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const params = useParams()
  const [hasChecked, setHasChecked] = useState(false)
  
  // Get tenantId from URL params first (most reliable)
  const tenantIdParam = params?.tenantId
  const tenantIdFromParams = Array.isArray(tenantIdParam) 
    ? (tenantIdParam[0] || null)
    : (tenantIdParam as string | undefined || null)
  const tenantId = (tenantIdFromParams && typeof tenantIdFromParams === 'string' && tenantIdFromParams.trim()) 
    ? tenantIdFromParams 
    : undefined

  // Redirect if tenantId is still not available (but wait for Zustand rehydration)
  useEffect(() => {
    if (hasChecked) return
    
    // If tenantId is in URL params, we're good
    if (tenantId) {
      setHasChecked(true)
      return
    }

    // Wait a bit for Zustand to rehydrate
    const checkAndRedirect = () => {
      setHasChecked(true)
      
      // Check localStorage as fallback
      let tenantFromStorage: any = null
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('auth-storage')
          if (stored) {
            const parsed = JSON.parse(stored)
            tenantFromStorage = parsed.state?.tenant || null
          }
        } catch (error) {
          console.error('[CRM_LAYOUT] Error reading from localStorage:', error)
        }
      }

      const currentState = useAuthStore.getState()
      const finalTenant = currentState.tenant || tenantFromStorage
      const finalTenantId = tenantIdFromParams || finalTenant?.id

      // If we have tenantId in URL, we're good
      if (tenantIdFromParams) {
        return
      }

      // If no tenantId anywhere, redirect to CRM entry point
      if (!finalTenantId) {
        console.log('[CRM_LAYOUT] No tenantId found, redirecting to /crm')
        router.replace('/crm')
        return
      }

      // If tenantId is in auth store but not in URL, redirect to correct URL
      if (finalTenant?.id && !tenantIdFromParams) {
        console.log(`[CRM_LAYOUT] TenantId in store but not URL, redirecting to /crm/${finalTenant.id}/Home/`)
        router.replace(`/crm/${finalTenant.id}/Home/`)
        return
      }
    }

    const timeoutId = setTimeout(checkAndRedirect, 300)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [tenantId, tenantIdFromParams, router, hasChecked])

  // Don't render if tenantId is not available (but wait for check)
  if (!hasChecked || (!tenantId && !tenantIdFromParams)) {
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

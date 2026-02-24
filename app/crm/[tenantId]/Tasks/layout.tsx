'use client'

import { AppShell } from '@/components/modules/AppShell'
import { useTenantId } from '@/lib/utils/get-tenant-id'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getCRMTopBarItems } from '@/lib/crm/crm-top-bar-items'

export default function CRMTasksLayout({
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

  const topBarItems = getCRMTopBarItems(tenantId)

  return (
    <AppShell moduleId="crm" moduleName="CRM" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}

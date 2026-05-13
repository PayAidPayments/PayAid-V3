'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'
import { PageLoading } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/stores/auth'
import { getLeadIntelligenceTopBarItems } from '@/lib/lead-intelligence/lead-intelligence-top-bar-items'
import { isModuleListedForTenantLicense } from '@/lib/tenant/module-license-filter'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'

export default function LeadIntelligenceTenantLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''
  const { tenant, isAuthenticated, isLoading } = useAuthStore()
  const topBarItems = tenantId ? getLeadIntelligenceTopBarItems(tenantId) : []

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/login?redirect=/lead-intelligence')
      return
    }
    if (!tenant?.id || !tenantId) return

    const licensed = tenant.licensedModules ?? []
    if (!Array.isArray(licensed) || licensed.length === 0) return

    const allowed = isModuleListedForTenantLicense('lead-intelligence', tenant.id, licensed)
    if (allowed) return

    const key = getTenantRouteKey(tenant) || tenantId
    router.replace(key ? `/home/${key}?module_locked=lead-intelligence` : '/dashboard')
  }, [isAuthenticated, isLoading, router, tenant, tenantId])

  const licensed = tenant?.licensedModules ?? []
  const gatedOff =
    isAuthenticated &&
    !isLoading &&
    tenant?.id &&
    Array.isArray(licensed) &&
    licensed.length > 0 &&
    !isModuleListedForTenantLicense('lead-intelligence', tenant.id, licensed)

  if (gatedOff) {
    return <PageLoading message="Checking access…" fullScreen={false} />
  }

  return (
    <AppShell moduleId="lead-intelligence" moduleName="Lead Intelligence" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}

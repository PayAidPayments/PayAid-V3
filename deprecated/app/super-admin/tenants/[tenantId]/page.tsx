'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TenantHeaderCard } from '@/components/super-admin/tenants/TenantHeaderCard'
import { TenantPlanModulesCard } from '@/components/super-admin/tenants/TenantPlanModulesCard'
import { TenantUsageCard } from '@/components/super-admin/tenants/TenantUsageCard'
import { TenantAuditCard } from '@/components/super-admin/tenants/TenantAuditCard'
import { useTenantDetails } from '@/lib/hooks/super-admin/useTenantDetails'
import { Skeleton } from '@/components/ui/skeleton'

export default function SuperAdminTenantDetailPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? null
  const { data, loading, fetchDetails } = useTenantDetails(tenantId)

  useEffect(() => {
    if (tenantId) fetchDetails()
  }, [tenantId, fetchDetails])

  if (!tenantId) return null
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Tenant not found</p>
        <Link
          href="/super-admin/tenants"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100 px-4 py-2.5 text-sm font-semibold transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
        >
          Back to tenants
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/super-admin/tenants"
          className="inline-flex items-center justify-center rounded-md text-purple-500 hover:bg-purple-50 active:bg-purple-100 px-3 py-1.5 text-xs transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
        >
          ← Tenants
        </Link>
      </div>
      <TenantHeaderCard
        name={data.name}
        subdomain={data.subdomain}
        status={data.status}
        plan={data.plan}
        subscriptionTier={data.subscriptionTier}
        createdAt={data.createdAt}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <TenantPlanModulesCard
          licensedModules={data.licensedModules ?? []}
          maxUsers={data.maxUsers}
          maxContacts={data.maxContacts}
          maxInvoices={data.maxInvoices}
          userCount={data._count?.users}
        />
        <TenantUsageCard
          userCount={data._count?.users}
          maxUsers={data.maxUsers}
        />
      </div>
      <TenantAuditCard />
    </div>
  )
}

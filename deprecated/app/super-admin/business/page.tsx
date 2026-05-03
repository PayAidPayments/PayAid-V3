'use client'

import { TabbedPage } from '@/components/super-admin/layout/TabbedPage'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Import existing page components
import SuperAdminTenantsPage from '../tenants/page'
import SuperAdminUsersPage from '../users/page'
import SuperAdminAtRiskMerchantsPage from './merchants/at-risk/page'
import SuperAdminTenantHealthPage from '../tenant-health/page'
import SuperAdminOnboardingQueuePage from '../onboarding/page'
import SuperAdminCommunicationPage from '../communication/page'

const tabs = [
  { id: 'tenants', label: 'Tenants & Merchants', href: '/super-admin/business/tenants' },
  { id: 'at-risk', label: 'At-Risk Merchants', href: '/super-admin/business/merchants/at-risk' },
  { id: 'users', label: 'Platform Users', href: '/super-admin/business/users' },
  { id: 'tenant-health', label: 'Tenant Health', href: '/super-admin/business/tenant-health' },
  { id: 'onboarding', label: 'Onboarding', href: '/super-admin/business/onboarding' },
  { id: 'communication', label: 'Communication', href: '/super-admin/business/communication' },
]

export default function BusinessManagementPage() {
  const pathname = usePathname()
  const router = useRouter()

  // Redirect root to tenants tab
  useEffect(() => {
    if (pathname === '/super-admin/business') {
      router.replace('/super-admin/business/tenants')
    }
  }, [pathname, router])

  const activeTab = tabs.find((tab) => pathname === tab.href || pathname.startsWith(tab.href + '/')) || tabs[0]

  return (
    <TabbedPage
      title="Business & Merchants"
      description="Everything about merchants, tenants, users, onboarding"
      tabs={tabs}
    >
      {activeTab.id === 'tenants' && <SuperAdminTenantsPage />}
      {activeTab.id === 'at-risk' && <SuperAdminAtRiskMerchantsPage />}
      {activeTab.id === 'users' && <SuperAdminUsersPage />}
      {activeTab.id === 'tenant-health' && <SuperAdminTenantHealthPage />}
      {activeTab.id === 'onboarding' && <SuperAdminOnboardingQueuePage />}
      {activeTab.id === 'communication' && <SuperAdminCommunicationPage />}
    </TabbedPage>
  )
}

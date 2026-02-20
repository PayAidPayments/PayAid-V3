'use client'

import { TabbedPage } from '@/components/super-admin/layout/TabbedPage'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Import existing page components
import { RevenuePaymentsContent } from './revenue-content'
import SuperAdminBillingPage from '../billing/page'
import SuperAdminPlansPage from '../plans/page'
import SuperAdminAnalyticsPage from '../analytics/page'
import SuperAdminReportsPage from '../reports/page'

const tabs = [
  { id: 'payments', label: 'Revenue & Payments', href: '/super-admin/revenue/payments' },
  { id: 'billing', label: 'Billing', href: '/super-admin/revenue/billing' },
  { id: 'plans', label: 'Plans & Modules', href: '/super-admin/revenue/plans' },
  { id: 'analytics', label: 'Merchant Analytics', href: '/super-admin/revenue/analytics' },
  { id: 'reports', label: 'Reports & Exports', href: '/super-admin/revenue/reports' },
]

export default function RevenueBillingPage() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're exactly at /super-admin/revenue (not a child route)
    if (pathname === '/super-admin/revenue') {
      router.replace('/super-admin/revenue/payments')
    }
  }, [pathname, router])

  // Don't render anything if we're at a child route - let Next.js handle it
  // This prevents the parent route from catching child routes
  if (pathname !== '/super-admin/revenue') {
    return null
  }

  // This should only render for the exact /super-admin/revenue path
  // Child routes will be handled by their own page.tsx files
  return (
    <TabbedPage
      title="Revenue & Billing"
      description="Money flowing through the platform and how you charge for it"
      tabs={tabs}
    >
      <RevenuePaymentsContent />
    </TabbedPage>
  )
}

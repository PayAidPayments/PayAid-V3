'use client'

import { TabbedPage } from '@/components/super-admin/layout/TabbedPage'
import { RevenuePaymentsContent } from '../revenue-content'
import SuperAdminBillingPage from '../../billing/page'
import SuperAdminPlansPage from '../../plans/page'
import SuperAdminAnalyticsPage from '../../analytics/page'
import SuperAdminReportsPage from '../../reports/page'

const tabs = [
  { id: 'payments', label: 'Revenue & Payments', href: '/super-admin/revenue/payments' },
  { id: 'billing', label: 'Billing', href: '/super-admin/revenue/billing' },
  { id: 'plans', label: 'Plans & Modules', href: '/super-admin/revenue/plans' },
  { id: 'analytics', label: 'Merchant Analytics', href: '/super-admin/revenue/analytics' },
  { id: 'reports', label: 'Reports & Exports', href: '/super-admin/revenue/reports' },
]

export default function RevenueReportsTabPage() {
  return (
    <TabbedPage
      title="Revenue & Billing"
      description="Money flowing through the platform and how you charge for it"
      tabs={tabs}
    >
      <SuperAdminReportsPage />
    </TabbedPage>
  )
}

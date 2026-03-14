'use client'

import { TabbedPage } from '@/components/super-admin/layout/TabbedPage'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Import existing page components
import SuperAdminRiskAssessmentPage from '../risk-assessment/page'
import SuperAdminCompliancePage from '../compliance/page'
import SuperAdminSecurityPage from '../security/page'
import SuperAdminAuditLogPage from '../audit-log/page'

const tabs = [
  { id: 'risk-assessment', label: 'Risk Assessment', href: '/super-admin/risk-security/risk-assessment' },
  { id: 'compliance', label: 'Compliance', href: '/super-admin/risk-security/compliance' },
  { id: 'security', label: 'Security & Compliance', href: '/super-admin/risk-security/security' },
  { id: 'audit-log', label: 'Audit Log', href: '/super-admin/risk-security/audit-log' },
]

export default function RiskSecurityPage() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/super-admin/risk-security') {
      router.replace('/super-admin/risk-security/risk-assessment')
    }
  }, [pathname, router])

  const activeTab = tabs.find((tab) => pathname === tab.href || pathname.startsWith(tab.href + '/')) || tabs[0]

  return (
    <TabbedPage
      title="Risk & Security"
      description="Fraud, compliance, security controls"
      tabs={tabs}
    >
      {activeTab.id === 'risk-assessment' && <SuperAdminRiskAssessmentPage />}
      {activeTab.id === 'compliance' && <SuperAdminCompliancePage />}
      {activeTab.id === 'security' && <SuperAdminSecurityPage />}
      {activeTab.id === 'audit-log' && <SuperAdminAuditLogPage />}
    </TabbedPage>
  )
}

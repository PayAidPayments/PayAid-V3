'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { FileCheck, Landmark, Wallet, PieChart, AlertTriangle, Receipt, ExternalLink } from 'lucide-react'

const TABS = [
  { id: 'gst', label: 'GST Automation', icon: Landmark, description: 'GSTR-2B match, GSTR-1/3B preview' },
  { id: 'bank', label: 'Bank Reconciliation AI', icon: Wallet, description: 'Auto-match bank transactions' },
  { id: 'expense', label: 'Expense Classification AI', icon: PieChart, description: 'Smart categorisation' },
  { id: 'compliance', label: 'Compliance Alerts', icon: AlertTriangle, description: 'TDS, input credit expiry' },
  { id: 'tax', label: 'Tax Filing', icon: Receipt, description: 'ITR-4 preview' },
]

export default function FinanceCAAssistantPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const { token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('gst')
  const moduleConfig = getModuleConfig('finance')

  const { data: tdsReminders } = useQuery({
    queryKey: ['finance-tds-reminders', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/finance/tds/reminders?days=30', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { reminders: [] }
      return res.json()
    },
  })
  const reminders = tdsReminders?.reminders ?? []

  const { data: bankReconSummary } = useQuery({
    queryKey: ['finance-bank-reconcile-summary', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/finance/bank-reconcile?limit=1', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { summary: {} }
      const data = await res.json()
      return { summary: data.summary ?? {} }
    },
  })
  const unreconciledCount = bankReconSummary?.summary?.unreconciledCount ?? 0

  const heroMetrics = [
    { label: 'CA Assistant', value: 'AI Virtual CA', icon: <FileCheck className="w-5 h-5" />, href: '#', color: 'purple' as const },
  ]

  if (!moduleConfig) {
    return <div>Module configuration not found</div>
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative min-h-screen">
      <UniversalModuleHero
        moduleName="CA Assistant"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-sm text-muted-foreground mb-6">
          AI-assisted view for your CA. BusinessAdmin and Accountant roles can access this page. AI does 80% → send to human CA for review → merchant approves.
        </p>

        <div className="flex flex-wrap gap-2 border-b border-border pb-4 mb-6">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{TABS.find((t) => t.id === activeTab)?.label}</CardTitle>
            <CardDescription>{TABS.find((t) => t.id === activeTab)?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {activeTab === 'gst' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  View GSTR-1 and GSTR-3B from GST reports. E-Invoicing (IRN) and E-Way from the E-Invoicing page. GSTR-2B matching with supplier data will be available in a future update.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/finance/${tenantId}/GST`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      GST Reports
                    </Button>
                  </Link>
                  <Link href={`/finance/${tenantId}/E-Invoicing`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      E-Invoicing & E-Way
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            {activeTab === 'bank' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Reconcile bank statements with ledger transactions. Import CSV/OFX and match statement lines to ledger. Unreconciled count below.
                </p>
                <p className="text-sm font-medium">
                  Unreconciled ledger transactions: <span className="text-amber-600 dark:text-amber-400">{unreconciledCount}</span>
                </p>
                <Link href={`/finance/${tenantId}/Bank-Reconciliation`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Bank Reconciliation
                  </Button>
                </Link>
              </div>
            )}
            {activeTab === 'expense' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Expense classification AI will suggest Chart of Accounts categories from description. For now, record expenses in Accounting → Expenses and assign categories; AI suggestions coming in a future update.
                </p>
                <Link href={`/finance/${tenantId}/Accounting/Expenses`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Expenses
                  </Button>
                </Link>
              </div>
            )}
            {activeTab === 'compliance' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  TDS return due dates (26Q, 24Q). File on TRACES. Upcoming due dates in the next 30 days:
                </p>
                {reminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No TDS returns due in the next 30 days.</p>
                ) : (
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {reminders.map((r: { form: string; period: string; dueDate: string; daysLeft: number }, i: number) => (
                      <li key={i}>
                        {r.form} ({r.period}) – {r.daysLeft} days left – {new Date(r.dueDate).toLocaleDateString('en-IN')}
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/finance/${tenantId}/TDS`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    TDS Management
                  </Button>
                </Link>
              </div>
            )}
            {activeTab === 'tax' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ITR-4 preview and tax filing summary will appear here. Use P&L and Balance Sheet reports for the period when preparing returns.
                </p>
                <Link href={`/finance/${tenantId}/Accounting/Reports`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Financial Reports
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-2">
          <Link href={`/finance/${tenantId}/Home`}>
            <Button variant="ghost" size="sm">Back to Finance dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

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
  { id: 'gst', label: 'GST', icon: Landmark, description: 'GSTR-1/3B, E-Invoicing, E-Way' },
  { id: 'bank', label: 'Bank Recon', icon: Wallet, description: 'Match statements to ledger' },
  { id: 'expense', label: 'Expenses', icon: PieChart, description: 'Categories & CoA mapping' },
  { id: 'compliance', label: 'Compliance', icon: AlertTriangle, description: 'TDS due dates & TRACES' },
  { id: 'tax', label: 'Tax', icon: Receipt, description: 'P&L & BS for returns' },
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
    <div className="w-full bg-slate-50 dark:bg-slate-950 relative min-h-screen">
      <UniversalModuleHero
        moduleName="CA Assistant"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          One place for GST, bank recon, expenses, TDS, and tax. Your CA reviews; you approve. BusinessAdmin & Accountant only.
        </p>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? '' : 'text-slate-600 dark:text-slate-400'}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">{TABS.find((t) => t.id === activeTab)?.label}</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">{TABS.find((t) => t.id === activeTab)?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {activeTab === 'gst' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  GSTR-1 & GSTR-3B in GST Reports; IRN and E-Way on E-Invoicing. GSTR-2B matching coming later.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/finance/${tenantId}/GST`}>
                    <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      GST Reports
                    </Button>
                  </Link>
                  <Link href={`/finance/${tenantId}/E-Invoicing`}>
                    <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      E-Invoicing & E-Way
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            {activeTab === 'bank' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Import CSV/OFX and match statement lines to ledger. Clear unreconciled items below.
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Unreconciled: <span className="text-amber-600 dark:text-amber-400">{unreconciledCount}</span>
                </p>
                <Link href={`/finance/${tenantId}/Bank-Reconciliation`}>
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Bank Reconciliation
                  </Button>
                </Link>
              </div>
            )}
            {activeTab === 'expense' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Record and categorise in Accounting → Expenses. AI category suggestions planned.
                </p>
                <Link href={`/finance/${tenantId}/Accounting/Expenses`}>
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Expenses
                  </Button>
                </Link>
              </div>
            )}
            {activeTab === 'compliance' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  TDS 26Q/24Q due dates — file on TRACES. Next 30 days:
                </p>
                {reminders.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nothing due in the next 30 days.</p>
                ) : (
                  <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                    {reminders.map((r: { form: string; period: string; dueDate: string; daysLeft: number }, i: number) => (
                      <li key={i}>
                        {r.form} ({r.period}) – {r.daysLeft} days left – {new Date(r.dueDate).toLocaleDateString('en-IN')}
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/finance/${tenantId}/TDS`}>
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    TDS Management
                  </Button>
                </Link>
              </div>
            )}
            {activeTab === 'tax' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Use P&L and Balance Sheet for the period when preparing returns. ITR-4 preview coming later.
                </p>
                <Link href={`/finance/${tenantId}/Accounting/Reports`}>
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Financial Reports
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link href={`/finance/${tenantId}/Home`}>
            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">Back to Finance dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

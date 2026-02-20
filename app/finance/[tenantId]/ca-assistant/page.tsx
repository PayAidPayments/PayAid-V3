'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { FileCheck, Landmark, Wallet, PieChart, AlertTriangle, Receipt } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('gst')
  const moduleConfig = getModuleConfig('finance')

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
                <p className="text-sm text-muted-foreground">GSTR-2B match and GSTR-1/3B preview will appear here. Use backend stubs: POST /api/finance/ai/gst-reconcile</p>
                <Button variant="outline" size="sm" disabled>Run GSTR-2B match (coming soon)</Button>
              </div>
            )}
            {activeTab === 'bank' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Bank reconciliation AI: auto-match transactions. Stub: POST /api/finance/ai/bank-match</p>
                <Button variant="outline" size="sm" disabled>Run bank match (coming soon)</Button>
              </div>
            )}
            {activeTab === 'expense' && (
              <p className="text-sm text-muted-foreground">Expense classification AI will suggest categories for uncategorised expenses.</p>
            )}
            {activeTab === 'compliance' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Compliance alerts: TDS, input credit expiry. Stub: GET /api/finance/ai/compliance-alerts</p>
                <Button variant="outline" size="sm" disabled>Fetch compliance alerts (coming soon)</Button>
              </div>
            )}
            {activeTab === 'tax' && (
              <p className="text-sm text-muted-foreground">ITR-4 preview and tax filing summary will appear here.</p>
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

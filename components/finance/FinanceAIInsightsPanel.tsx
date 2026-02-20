'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import type { FinanceSummary } from '@/lib/hooks/finance/useFinanceSummary'

interface FinanceAIInsightsPanelProps {
  tenantId: string
  stats: FinanceSummary | null
}

export function FinanceAIInsightsPanel({ tenantId, stats }: FinanceAIInsightsPanelProps) {
  const insights = useMemo(() => {
    const list: { text: string; href: string; icon: 'alert' | 'trend' | 'info' }[] = []
    const overdueAmount = stats?.overdueAmount ?? 0
    const overdueInvoices = stats?.overdueInvoices ?? 0
    const revenueGrowth = stats?.revenueGrowth ?? 0
    const profit = stats?.profit ?? 0
    const vendorsDueAmount = stats?.vendorsDueAmount ?? 0
    const cashRunwayDays = stats?.cashRunwayDays ?? 0

    if (overdueInvoices > 0) {
      list.push({
        text: `Collect ${formatINRForDisplay(overdueAmount)} from ${overdueInvoices} overdue invoice${overdueInvoices !== 1 ? 's' : ''} to improve cash flow`,
        href: `/finance/${tenantId}/Invoices?status=overdue`,
        icon: 'alert',
      })
    }
    if (vendorsDueAmount > 0) {
      list.push({
        text: `Vendor payments due: ${formatINRForDisplay(vendorsDueAmount)} – review purchase orders`,
        href: `/finance/${tenantId}/Purchase-Orders`,
        icon: 'info',
      })
    }
    if (revenueGrowth < 0 && revenueGrowth !== 0) {
      list.push({
        text: `Revenue down ${Math.abs(Math.round(revenueGrowth))}% vs last period – check collections and pipeline`,
        href: `/finance/${tenantId}/Accounting/Reports/Revenue`,
        icon: 'trend',
      })
    }
    if (profit < 0) {
      list.push({
        text: `Net profit negative this period – review expenses and revenue`,
        href: `/finance/${tenantId}/Accounting/Reports`,
        icon: 'alert',
      })
    }
    if (cashRunwayDays > 0 && cashRunwayDays < 45) {
      list.push({
        text: `Cash runway at ${cashRunwayDays} days – focus on collections from top customers`,
        href: `/finance/${tenantId}/Accounting`,
        icon: 'alert',
      })
    }
    if (list.length === 0) {
      list.push({
        text: 'Finance looks on track. Keep monitoring overdue invoices and GST filing dates.',
        href: `/finance/${tenantId}/Invoices`,
        icon: 'info',
      })
    }
    return list.slice(0, 5)
  }, [tenantId, stats])

  return (
    <Card className="border-0 rounded-2xl shadow-md bg-gradient-to-br from-purple-50/50 to-amber-50/30 dark:from-gray-800 dark:to-gray-900 border border-purple-100 dark:border-purple-900 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-purple-900 dark:text-purple-100">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          AI Insights & Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-2">
          {insights.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
              >
                {item.icon === 'alert' && <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />}
                {item.icon === 'trend' && <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                {item.icon === 'info' && <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />}
                <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                  {item.text}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

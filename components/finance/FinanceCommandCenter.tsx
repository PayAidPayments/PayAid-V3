'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Zap, Target, ChevronRight } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import type { FinanceSummary } from '@/lib/hooks/finance/useFinanceSummary'

interface FinanceCommandCenterProps {
  tenantId: string
  stats: FinanceSummary | null
  userName?: string
}

export function FinanceCommandCenter({ tenantId, stats, userName }: FinanceCommandCenterProps) {
  const monthLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }, [])

  const nextActions = useMemo(() => {
    const actions: { text: string; href: string }[] = []
    const overdueAmount = stats?.overdueAmount ?? 0
    const overdueInvoices = stats?.overdueInvoices ?? 0
    const vendorsDueAmount = stats?.vendorsDueAmount ?? 0
    const cashRunwayDays = stats?.cashRunwayDays ?? 0

    if (overdueInvoices > 0 && overdueAmount > 0) {
      actions.push({
        text: `Collect overdue invoices worth ${formatINRForDisplay(overdueAmount)} (${overdueInvoices} invoice${overdueInvoices !== 1 ? 's' : ''})`,
        href: `/finance/${tenantId}/Invoices?status=overdue`,
      })
    }
    if (vendorsDueAmount > 0) {
      actions.push({
        text: `Review vendors with delayed payments (${formatINRForDisplay(vendorsDueAmount)} due)`,
        href: `/finance/${tenantId}/Purchase-Orders`,
      })
    }
    if (cashRunwayDays > 0 && cashRunwayDays < 60) {
      actions.push({
        text: `Watch cash runway: ${cashRunwayDays} days at current burn rate`,
        href: `/finance/${tenantId}/Accounting`,
      })
    }
    if (stats?.gstReconciliationPct !== undefined && stats.gstReconciliationPct < 90 && actions.length < 3) {
      actions.push({
        text: 'Improve GST credit match to 90%',
        href: `/finance/${tenantId}/GST`,
      })
    }
    if (stats?.gstReports !== undefined && stats.gstReports < 3 && actions.length < 3) {
      actions.push({
        text: 'Complete GST reports for compliance',
        href: `/finance/${tenantId}/GST`,
      })
    }
    if (actions.length === 0) {
      actions.push({ text: 'Create invoices to track revenue', href: `/finance/${tenantId}/Invoices/new` })
      actions.push({ text: 'Review purchase orders', href: `/finance/${tenantId}/Purchase-Orders` })
    }
    return actions.slice(0, 3)
  }, [tenantId, stats])

  const revenueThisMonth = stats?.revenueThisMonth ?? 0
  const targetRevenue = revenueThisMonth > 0 ? Math.max(1000000, revenueThisMonth * 2) : 1000000
  const collectionProgress = Math.min(100, Math.round((revenueThisMonth / targetRevenue) * 100))

  return (
    <Card
      className="border shadow-lg bg-white dark:bg-slate-900 dark:border-slate-700 border-l-4 border-l-amber-500 dark:border-l-amber-500"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-purple-900 dark:text-purple-100">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Finance Command Center
            <span className="text-sm font-normal text-muted-foreground">
              – {monthLabel}
            </span>
          </CardTitle>
          <Link
            href={`/finance/${tenantId}/Invoices?status=overdue`}
            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            View all tasks
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto px-5 pb-5" style={{ maxHeight: 'calc(100% - 72px)' }}>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {userName ? `Hi ${userName},` : ''} Here are your next best actions.
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Next Best Actions</h3>
          </div>
          <ul className="space-y-2">
            {nextActions.map((action, index) => (
              <li key={index}>
                <Link
                  href={action.href}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all cursor-pointer group min-w-0"
                >
                  <ChevronRight className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 break-words min-w-0">{action.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 pt-4 border-t border-amber-100 dark:border-amber-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Collection target vs actual</span>
            </div>
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{collectionProgress}%</span>
          </div>
          <Progress value={collectionProgress} className="h-3" />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 min-w-0">
            <span className="break-words min-w-0">Actual: {formatINRForDisplay(revenueThisMonth)}</span>
            <span className="break-words min-w-0 flex-shrink-0">Target: {formatINRForDisplay(targetRevenue)}</span>
          </div>
        </div>

        {stats && stats.cashRunwayDays > 0 && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-amber-100 dark:border-amber-900">
            Cash runway: <strong>{stats.cashRunwayDays} days</strong>
            {stats.cashRunwayDays >= 60 ? ' (healthy)' : ' – consider improving collections.'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

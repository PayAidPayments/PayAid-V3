'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ShoppingCart, Landmark, TrendingUp, TrendingDown, IndianRupee, Database, AlertCircle, Wallet, Building2, ArrowLeftRight, ArrowRightLeft, Zap } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import {
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart
} from 'recharts'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useFinanceSummary } from '@/lib/hooks/finance/useFinanceSummary'
import { FinanceCommandCenter } from '@/components/finance/FinanceCommandCenter'
import { FinanceAIInsightsPanel } from '@/components/finance/FinanceAIInsightsPanel'
import { QuickActionsPanel } from '@/components/finance/QuickActionsPanel'
import { FinanceCard } from '@/components/ui/FinanceCard'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils/cn'

const FinancialAlerts = dynamic(
  () => import('@/components/finance/FinancialAlerts').then(mod => ({ default: mod.FinancialAlerts })),
  { ssr: false, loading: () => null }
)

const PURPLE_PRIMARY = '#53328A'
const GOLD_ACCENT = '#F5C700'
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, '#059669', '#0284C7', '#8B5CF6', '#FCD34D']

export default function FinanceDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const { user } = useAuthStore()
  const { data: stats, isLoading, error: fetchError, refetch } = useFinanceSummary({ tenantId })
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedBannerDismissed, setSeedBannerDismissed] = useState(false)

  const seedDemoData = async () => {
    try {
      setSeedLoading(true)
      const token = useAuthStore.getState().token
      if (!token) return
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3 * 60 * 1000)
      const res = await fetch(`/api/finance/ensure-demo-data?quick=true`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setSeedBannerDismissed(true)
        refetch()
      }
    } catch (_) {}
    finally {
      setSeedLoading(false)
    }
  }

  const isEmptyDashboard =
    stats &&
    (stats.totalInvoices ?? 0) === 0 &&
    (stats.purchaseOrders ?? 0) === 0 &&
    (stats.totalRevenue ?? 0) === 0
  const showSeedBanner =
    !isLoading && !!isEmptyDashboard && !seedBannerDismissed
  const showEmptyCta = !isLoading && !!isEmptyDashboard && seedBannerDismissed

  if (!tenantId) {
    return <PageLoading message="Loading..." fullScreen={true} />
  }
  if (isLoading || stats === undefined) {
    return <PageLoading message="Loading Finance dashboard..." fullScreen={true} />
  }

  const safeStats = stats ?? {
    totalInvoices: 0, invoicesThisMonth: 0, invoicesLastMonth: 0, invoiceGrowth: 0,
    paidInvoices: 0, overdueInvoices: 0, overdueAmount: 0, pendingInvoices: 0,
    totalRevenue: 0, revenueThisMonth: 0, revenueLastMonth: 0, revenueGrowth: 0,
    totalExpenses: 0, expensesThisMonth: 0, profit: 0, profitMargin: 0,
    purchaseOrders: 0, purchaseOrdersThisMonth: 0, gstReports: 0,
    vendorsCount: 0, vendorsDueAmount: 0, gstInputCreditAvailable: 0,
    gstOutputDueThisMonth: 0, gstReconciliationPct: 0, cashPosition: 0, cashRunwayDays: 0,
    bankRecPct: 0, creditNotesCount: 0, debitNotesCount: 0,
    recentInvoices: [], recentPurchaseOrders: [], monthlyRevenue: [],
    invoicesByStatus: [], arAging: { bucket0_30: 0, bucket31_60: 0, bucket60Plus: 0 },
    apAging: { dueToday: 0, due7d: 0, due30d: 0 },
  }

  const invoicesByStatusData = Array.isArray(safeStats.invoicesByStatus)
    ? safeStats.invoicesByStatus.map((item, idx) => ({
        name: item?.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown',
        value: item?.count || 0,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      }))
    : []
  const monthlyRevenueData = Array.isArray(safeStats.monthlyRevenue)
    ? safeStats.monthlyRevenue.map((item) => ({ month: item?.month ?? '', revenue: item?.revenue ?? 0 }))
    : []
  const isProfit = (safeStats.profit ?? 0) >= 0
  const paidPct = safeStats.totalInvoices > 0
    ? Math.round((safeStats.paidInvoices / safeStats.totalInvoices) * 100)
    : 0

  const revenueGrowth = safeStats.revenueGrowth ?? 0
  const healthScore = (() => {
    const growth = safeStats.revenueGrowth ?? 0
    const margin = safeStats.profitMargin ?? 0
    const runway = safeStats.cashRunwayDays ?? 0
    const overdueRatio = safeStats.totalInvoices > 0 ? (safeStats.overdueInvoices / safeStats.totalInvoices) * 100 : 0
    let score = 70
    if (growth > 0) score += 5
    if (margin > 20) score += 5
    if (runway >= 60) score += 10
    else if (runway >= 30) score += 5
    if (overdueRatio > 30) score -= 15
    else if (overdueRatio > 10) score -= 5
    return Math.max(0, Math.min(100, score))
  })()

  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const gstMatchPct = safeStats.gstReconciliationPct ?? 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Page Title */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 truncate">Finance Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">AI overview for {monthLabel}</p>
          </div>
        </header>

        {fetchError && (
          <div className="rounded-2xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {(fetchError as Error)?.message === 'No authorization token provided'
                ? 'Please log in to view the Finance dashboard'
                : 'Error'}
            </p>
            {(fetchError as Error)?.message !== 'No authorization token provided' && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{(fetchError as Error)?.message}</p>
            )}
            {(fetchError as Error)?.message === 'No authorization token provided' && (
              <Link href="/login" className="mt-2 inline-block text-sm font-medium text-slate-600 dark:text-slate-300 hover:underline">
                Go to login
              </Link>
            )}
          </div>
        )}

        {showSeedBanner && (
          <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">Numbers show 0? Click to load sample invoices, orders & POs (1–2 min).</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="default" size="sm" onClick={seedDemoData} disabled={seedLoading} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Database className="mr-2 h-4 w-4" />
                {seedLoading ? 'Seeding…' : 'Seed demo data'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSeedBannerDismissed(true)} className="text-slate-600 dark:text-slate-400">Dismiss</Button>
            </div>
          </div>
        )}

        {showEmptyCta && (
          <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">Dashboard empty? Load sample data to see revenue, invoices, and charts.</p>
            <Button variant="outline" size="sm" onClick={seedDemoData} disabled={seedLoading} className="border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-300 flex-shrink-0">
              <Database className="mr-2 h-4 w-4" />
              {seedLoading ? 'Loading…' : 'Load sample data'}
            </Button>
          </div>
        )}

        {/* BAND 0 – Top Stat Bar (4 cards) */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link href={`/finance/${tenantId}/Accounting/Reports/Revenue`} className="h-28 min-w-0">
            <FinanceCard title="Revenue" accent="yellow" className="h-28">
              <div className="space-y-0.5 min-w-0">
                <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{formatINRForDisplay(safeStats.revenueThisMonth)}</span>
                <span className={cn('text-xs flex items-center gap-0.5 line-clamp-2', revenueGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                  {revenueGrowth >= 0 ? '▲' : '▼'} vs last period {revenueGrowth >= 0 ? '+' : ''}{Math.round(revenueGrowth)}%
                </span>
              </div>
            </FinanceCard>
          </Link>
          <Link href={`/finance/${tenantId}/Invoices`} className="h-28 min-w-0">
            <FinanceCard title="Invoices" subtitle={`${paidPct}% paid`} accent="blue" className="h-28">
              <div className="space-y-0.5 min-w-0">
                <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{safeStats.totalInvoices}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{paidPct}% paid</span>
              </div>
            </FinanceCard>
          </Link>
          <Link href={`/finance/${tenantId}/Purchase-Orders`} className="h-28 min-w-0">
            <FinanceCard title="Purchase Orders" accent="purple" className="h-28">
              <div className="space-y-0.5 min-w-0">
                <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{safeStats.purchaseOrders}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">Active POs</span>
              </div>
            </FinanceCard>
          </Link>
          <Link href={`/finance/${tenantId}/Accounting/Reports`} className="h-28 min-w-0">
            <FinanceCard title="Net Profit" accent={isProfit ? 'green' : 'red'} className="h-28">
              <div className="space-y-0.5 min-w-0">
                <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{formatINRForDisplay(Math.abs(safeStats.profit))}</span>
                <span className={cn('text-xs flex items-center gap-0.5 line-clamp-2', isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                  {isProfit ? '▲' : '▼'} {Math.round(safeStats.profitMargin)}% margin
                </span>
              </div>
            </FinanceCard>
          </Link>
        </section>

        {/* BAND 1 – Finance Command Center (full width) */}
        <section className="overflow-hidden">
          <FinanceCommandCenter tenantId={tenantId} stats={safeStats} userName={user?.name} />
        </section>

        {/* Quick Actions row */}
        <section className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-shrink-0">
            <Zap className="h-4 w-4" />
            Quick Actions
          </span>
          <Link href={`/finance/${tenantId}/Invoices/new`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2">
              <FileText className="h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
          <Link href={`/finance/${tenantId}/Purchase-Orders/new`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2">
              <ShoppingCart className="h-4 w-4" />
              Create Purchase Order
            </Button>
          </Link>
          <Link href={`/finance/${tenantId}/Credit-Notes/new`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Create Credit Note
            </Button>
          </Link>
          <Link href={`/finance/${tenantId}/Debit-Notes/new`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Create Debit Note
            </Button>
          </Link>
          <Link href={`/finance/${tenantId}/GST`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2">
              <Landmark className="h-4 w-4" />
              Run GST Report
            </Button>
          </Link>
        </section>

        {/* BAND 2 – KPI Stat Grid (6 cards) */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link href={`/finance/${tenantId}/Accounting/Reports/Revenue`} className="h-36 min-w-0">
            <FinanceCard title="Revenue" subtitle={`vs last period: ${revenueGrowth >= 0 ? '+' : ''}${Math.round(revenueGrowth)}%`} statusPill={revenueGrowth >= 0 ? 'On Track' : 'At Risk'} accent="yellow" className="h-36">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{formatINRForDisplay(safeStats.revenueThisMonth)}</span>
            </FinanceCard>
          </Link>
          <Link href={`/finance/${tenantId}/Accounting/Reports`} className="h-36 min-w-0">
            <FinanceCard title="Net Profit" subtitle={`${Math.round(safeStats.profitMargin)}% margin`} statusPill={isProfit ? 'On Track' : 'At Risk'} accent={isProfit ? 'green' : 'red'} className="h-36">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{formatINRForDisplay(Math.abs(safeStats.profit))}</span>
            </FinanceCard>
          </Link>
          <Link href={`/finance/${tenantId}/Invoices`} className="h-36 min-w-0">
            <FinanceCard title="Invoices" subtitle={`${paidPct}% paid`} statusPill="On Track" accent="blue" className="h-36">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{safeStats.totalInvoices}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{paidPct}% paid</span>
            </FinanceCard>
          </Link>
          <Link href={`/finance/${tenantId}/GST`} className="h-36 min-w-0">
            <FinanceCard title="GST Input Credit" subtitle={`${gstMatchPct}% matched`} accent="purple" className="h-36">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{formatINRForDisplay(safeStats.gstInputCreditAvailable)}</span>
            </FinanceCard>
          </Link>
          <Link href={`/finance/${tenantId}/Accounting`} className="h-36 min-w-0">
            <FinanceCard title="Cash Position" subtitle={`Runway ${safeStats.cashRunwayDays} days`} accent="green" className="h-36">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{formatINRForDisplay(safeStats.cashPosition)}</span>
            </FinanceCard>
          </Link>
          <Link href={`/finance/${tenantId}/Purchase-Orders`} className="h-36 min-w-0">
            <FinanceCard title="Vendors" subtitle="Active vendors with outstanding" accent="purple" className="h-36">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate block">{safeStats.vendorsCount} | {formatINRForDisplay(safeStats.vendorsDueAmount)} due</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">View vendor aging</span>
            </FinanceCard>
          </Link>
        </section>

        {/* BAND 3 – Revenue & Invoices Charts */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-5 flex flex-col overflow-hidden min-h-0">
            <div className="mb-3 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Revenue Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Last 12 months</p>
            </div>
            <div className="flex-1 min-h-[220px] min-w-0">
              {monthlyRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyRevenueData}>
                    <defs>
                      <linearGradient id="colorFinanceRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GOLD_ACCENT} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={GOLD_ACCENT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-slate-500 dark:text-slate-400" />
                    <YAxis tickFormatter={(v) => (v >= 100000 ? `${v / 100000}L` : String(v))} tick={{ fontSize: 11 }} className="text-slate-500 dark:text-slate-400" />
                    <Tooltip formatter={(value: number) => [formatINRForDisplay(value), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke={GOLD_ACCENT} fill="url(#colorFinanceRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">No revenue data</div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-5 flex flex-col overflow-hidden min-h-0">
            <div className="mb-3 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Invoices by Status</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Paid / Unpaid / Overdue / Draft</p>
            </div>
            <div className="flex-1 min-h-[220px] min-w-0">
              {invoicesByStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={invoicesByStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {invoicesByStatusData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Invoices']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">No invoice data</div>
              )}
            </div>
          </div>
        </section>

        {/* BAND 4 – Risk, Health, AI Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-5 flex flex-col overflow-hidden min-h-0">
            <div className="mb-2 flex-shrink-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Overdue & Risk Alerts</h3>
              </div>
              <Link href={`/finance/${tenantId}/Invoices?status=overdue`} className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex-shrink-0">View all</Link>
            </div>
            <div className="space-y-2 min-w-0 flex-1">
              <Link href={`/finance/${tenantId}/Invoices?status=overdue`} className="block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-300 truncate">
                Overdue invoices &gt;30 days – {formatINRForDisplay(safeStats.overdueAmount)}
                {safeStats.overdueInvoices > 0 && (
                  <span className="text-slate-500 dark:text-slate-400 ml-1">({safeStats.overdueInvoices} invoice{safeStats.overdueInvoices !== 1 ? 's' : ''})</span>
                )}
              </Link>
              <Link href={`/finance/${tenantId}/Credit-Notes`} className="block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-300 truncate">
                Credit Notes: <span className="font-semibold">{safeStats.creditNotesCount || 0}</span>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-5 flex flex-col overflow-hidden min-h-0">
            <div className="mb-2 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Financial Health Score</h3>
            </div>
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="text-3xl font-semibold text-slate-900 dark:text-slate-50">{healthScore}/100</div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                <li>· Growth</li>
                <li>· Margins</li>
                <li>· Collections</li>
              </ul>
              <span className={cn('text-xs font-medium', healthScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : healthScore >= 60 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400')}>
                {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden min-h-0 min-w-0 flex flex-col">
            <FinanceAIInsightsPanel tenantId={tenantId} stats={safeStats} />
          </div>
        </section>

        {/* BAND 5 – Bottom row (3 cards) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden min-h-0 min-w-0 flex flex-col max-h-40">
            <FinancialAlerts tenantId={tenantId} maxVisible={2} />
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-5 flex flex-col overflow-hidden min-h-0">
            <div className="mb-2 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Key Metrics</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 min-w-0 flex-1">
              <div className="flex flex-col border-r border-slate-200 dark:border-slate-700 pr-3">
                <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Cash</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{formatINRForDisplay(safeStats.cashPosition)}</span>
              </div>
              <div className="flex flex-col border-r border-slate-200 dark:border-slate-700 pr-3">
                <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Runway</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{safeStats.cashRunwayDays} days</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">GST match %</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{gstMatchPct}%</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-5 flex flex-col overflow-hidden min-h-0 h-40">
            <div className="mb-2 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">CA & Compliance</h3>
            </div>
            <div className="space-y-2 min-w-0 flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">GSTR‑3B matched {gstMatchPct}%. Next filing: current month.</p>
              <div className="flex flex-col gap-1.5">
                <Link href={`/finance/${tenantId}/ca-assistant`}>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">Open CA Assistant</Button>
                </Link>
                <Link href="/admin/roles">
                  <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-slate-600 dark:text-slate-400 text-left truncate">Invite your CA (Accountant role)</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <QuickActionsPanel tenantId={tenantId} />
    </div>
  )
}

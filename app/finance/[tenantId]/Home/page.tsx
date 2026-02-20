'use client'

import { useState, cloneElement, isValidElement } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ShoppingCart, Landmark, TrendingUp, TrendingDown, IndianRupee, Database, AlertCircle, Wallet, Building2, ArrowUpRight, ArrowDownRight, ArrowLeftRight, ArrowRightLeft, Zap } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import {
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart
} from 'recharts'
import { motion } from 'framer-motion'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useFinanceSummary } from '@/lib/hooks/finance/useFinanceSummary'
import { FinanceCommandCenter } from '@/components/finance/FinanceCommandCenter'
import { FinanceAIInsightsPanel } from '@/components/finance/FinanceAIInsightsPanel'
import { QuickActionsPanel } from '@/components/finance/QuickActionsPanel'
import dynamic from 'next/dynamic'

const FinancialAlerts = dynamic(
  () => import('@/components/finance/FinancialAlerts').then(mod => ({ default: mod.FinancialAlerts })),
  { ssr: false, loading: () => null }
)
const CashFlowManagement = dynamic(
  () => import('@/components/finance/CashFlowManagement').then(mod => ({ default: mod.CashFlowManagement })),
  { ssr: false, loading: () => null }
)
const FinancialForecasting = dynamic(
  () => import('@/components/finance/FinancialForecasting').then(mod => ({ default: mod.FinancialForecasting })),
  { ssr: false, loading: () => null }
)
const FinancialAnalytics = dynamic(
  () => import('@/components/finance/FinancialAnalytics').then(mod => ({ default: mod.FinancialAnalytics })),
  { ssr: false, loading: () => null }
)

const PURPLE_PRIMARY = '#53328A'
const GOLD_ACCENT = '#F5C700'
const SUCCESS = '#059669'
const INFO = '#0284C7'
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, '#8B5CF6', '#FCD34D']

export default function FinanceDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const { user, tenant } = useAuthStore()
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

  const showSeedBanner =
    !isLoading &&
    stats &&
    !seedBannerDismissed &&
    (stats.totalInvoices ?? 0) === 0 &&
    (stats.purchaseOrders ?? 0) === 0 &&
    (stats.totalRevenue ?? 0) === 0

  if (!tenantId) {
    return <PageLoading message="Loading..." fullScreen={true} />
  }
  if (isLoading) {
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
  const moduleConfig = getModuleConfig('finance') || getModuleConfig('crm')!
  const paidPct = safeStats.totalInvoices > 0
    ? Math.round((safeStats.paidInvoices / safeStats.totalInvoices) * 100)
    : 0

  const heroMetrics = [
    { label: 'Revenue', value: formatINRForDisplay(safeStats.revenueThisMonth), change: safeStats.revenueGrowth, trend: (safeStats.revenueGrowth || 0) > 0 ? 'up' as const : 'down' as const, icon: <IndianRupee className="w-5 h-5" />, color: 'gold' as const, href: `/finance/${tenantId}/Accounting/Reports/Revenue` },
    { label: 'Invoices', value: `${safeStats.totalInvoices} (${paidPct}% paid)`, change: undefined, trend: 'up' as const, icon: <FileText className="w-5 h-5" />, color: 'info' as const, href: `/finance/${tenantId}/Invoices` },
    { label: 'Purchase Orders', value: String(safeStats.purchaseOrders), icon: <ShoppingCart className="w-5 h-5" />, color: 'purple' as const, href: `/finance/${tenantId}/Purchase-Orders` },
    { label: 'Net Profit', value: formatINRForDisplay(Math.abs(safeStats.profit)), change: safeStats.profitMargin, trend: isProfit ? 'up' as const : 'down' as const, icon: isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />, color: isProfit ? 'success' as const : 'error' as const, href: `/finance/${tenantId}/Accounting/Reports` },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Finance"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {fetchError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 font-medium">Error:</p>
          <p className="text-red-600 dark:text-red-400 text-sm truncate">{(fetchError as Error)?.message}</p>
        </div>
      )}

      {showSeedBanner && (
        <div className="mx-6 mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <p className="text-gray-800 dark:text-gray-200 font-medium">No finance data yet. Seed demo data to see the dashboard.</p>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={seedDemoData} disabled={seedLoading}>{seedLoading ? 'Seeding...' : 'Seed demo data'}</Button>
            <Button variant="ghost" size="sm" onClick={() => setSeedBannerDismissed(true)}>Dismiss</Button>
          </div>
        </div>
      )}

      <div className="p-6 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/20 mb-6">
          <p className="text-sm text-muted-foreground truncate">Numbers show 0? Click to load sample invoices, orders & POs (1–2 min).</p>
          <Button variant="default" size="sm" onClick={seedDemoData} disabled={seedLoading} className="shrink-0 bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
            <Database className="mr-2 h-4 w-4" />
            {seedLoading ? 'Seeding…' : 'Seed demo data'}
          </Button>
        </div>

        {/* 5-band layout – same grid as CRM */}
        <div className="dashboard-container">
          <div className="dashboard-grid">
            {/* Band 1: Finance Command Center - Full Width */}
            {safeStats && (
              <motion.div 
                className="ai-command-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <FinanceCommandCenter tenantId={tenantId} stats={safeStats} userName={user?.name} />
              </motion.div>
            )}

            {/* Quick Actions Band - Full Width */}
            <motion.div 
              className="col-span-full mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Zap className="h-4 w-4" />
                    Quick Actions:
                  </div>
                  <Link href={`/finance/${tenantId}/Invoices/new`}>
                    <Button variant="outline" size="sm" className="gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/30">
                      <FileText className="h-4 w-4" />
                      Create Invoice
                    </Button>
                  </Link>
                  <Link href={`/finance/${tenantId}/Purchase-Orders/new`}>
                    <Button variant="outline" size="sm" className="gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                      <ShoppingCart className="h-4 w-4" />
                      Create Purchase Order
                    </Button>
                  </Link>
                  <Link href={`/finance/${tenantId}/Credit-Notes/new`}>
                    <Button variant="outline" size="sm" className="gap-2 hover:bg-green-100 dark:hover:bg-green-900/30">
                      <ArrowLeftRight className="h-4 w-4" />
                      Create Credit Note
                    </Button>
                  </Link>
                  <Link href={`/finance/${tenantId}/Debit-Notes/new`}>
                    <Button variant="outline" size="sm" className="gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                      <ArrowRightLeft className="h-4 w-4" />
                      Create Debit Note
                    </Button>
                  </Link>
                  <Link href={`/finance/${tenantId}/GST`}>
                    <Button variant="outline" size="sm" className="gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30">
                      <Landmark className="h-4 w-4" />
                      Run GST Report
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Band 2: KPI strip – 6 stat cards (Revenue, Net Profit, Invoices, GST Input Credit, Cash Position, Vendors) */}
            <StatCard label="Revenue" value={formatINRForDisplay(safeStats.revenueThisMonth)} subline={`vs last period ${safeStats.revenueGrowth >= 0 ? '+' : ''}${Math.round(safeStats.revenueGrowth)}%`} trend={safeStats.revenueGrowth >= 0 ? 'up' : 'down'} href={`/finance/${tenantId}/Accounting/Reports/Revenue`} icon={<IndianRupee className="h-4 w-4" />} color="amber" tag={safeStats.revenueGrowth >= 0 ? 'On track' : 'At risk'} delay={0.1} />
            <StatCard label="Net Profit" value={formatINRForDisplay(Math.abs(safeStats.profit))} subline={`${Math.round(safeStats.profitMargin)}% margin`} trend={isProfit ? 'up' : 'down'} href={`/finance/${tenantId}/Accounting/Reports`} icon={isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} color={isProfit ? 'emerald' : 'red'} tag={isProfit ? 'On track' : 'At risk'} delay={0.15} />
            <StatCard label="Invoices" value={`${safeStats.totalInvoices} (${paidPct}% paid)`} subline={`vs last period +${Math.round(safeStats.invoiceGrowth ?? 0)}%`} trend="up" href={`/finance/${tenantId}/Invoices`} icon={<FileText className="h-4 w-4" />} color="blue" tag="On track" delay={0.2} />
            <StatCard label="GST Input Credit" value={formatINRForDisplay(safeStats.gstInputCreditAvailable)} subline={`${safeStats.gstReconciliationPct}% matched`} href={`/finance/${tenantId}/GST`} icon={<Landmark className="h-4 w-4" />} color="purple" tag="On track" delay={0.25} />
            <StatCard label="Cash Position" value={formatINRForDisplay(safeStats.cashPosition)} subline={`${safeStats.cashRunwayDays} days runway`} href={`/finance/${tenantId}/Accounting`} icon={<Wallet className="h-4 w-4" />} color="emerald" tag={safeStats.cashRunwayDays >= 60 ? 'Healthy' : 'Watch'} delay={0.3} />
            <StatCard label="Vendors" value={`${safeStats.vendorsCount} | ${formatINRForDisplay(safeStats.vendorsDueAmount)} due`} subline="Active" href={`/finance/${tenantId}/Purchase-Orders`} icon={<Building2 className="h-4 w-4" />} color="indigo" tag="On track" delay={0.35} />

            {/* Band 3: Charts and Analytics - Revenue Trend, Invoices by Status */}
            <motion.div 
              className="chart-panel" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="border-0 rounded-xl h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
                  <CardDescription className="text-sm">Last 12 months</CardDescription>
                </CardHeader>
                <CardContent className="h-[260px] overflow-hidden">
                  {monthlyRevenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={monthlyRevenueData}>
                        <defs>
                          <linearGradient id="colorFinanceRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={GOLD_ACCENT} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={GOLD_ACCENT} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => (v >= 100000 ? `${v / 100000}L` : String(v))} />
                        <Tooltip formatter={(value: number) => [formatINRForDisplay(value), 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke={GOLD_ACCENT} fill="url(#colorFinanceRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No revenue data</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div 
              className="chart-panel" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              <Card className="border-0 rounded-xl h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Invoices by Status</CardTitle>
                  <CardDescription className="text-sm">Paid / Unpaid / Overdue / Draft</CardDescription>
                </CardHeader>
                <CardContent className="h-[260px] overflow-hidden">
                  {invoicesByStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={invoicesByStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                          {invoicesByStatusData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, 'Invoices']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No invoice data</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Band 4: AI Panels - Overdue & Risk, Financial Health, AI Insights */}
            <motion.div 
              className="ai-panel" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card className="border-0 rounded-xl h-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Overdue & Risk Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/finance/${tenantId}/Invoices?status=overdue`} className="block p-2 rounded-lg hover:bg-muted text-sm truncate">
                    Overdue invoices &gt;30 days – {formatINRForDisplay(safeStats.overdueAmount)}
                  </Link>
                  <Link href={`/finance/${tenantId}/Credit-Notes`} className="block p-2 rounded-lg hover:bg-muted text-sm">
                    Credit Notes: <span className="font-semibold">{safeStats.creditNotesCount || 0}</span>
                  </Link>
                  <Link href={`/finance/${tenantId}/Debit-Notes`} className="block p-2 rounded-lg hover:bg-muted text-sm">
                    Debit Notes: <span className="font-semibold">{safeStats.debitNotesCount || 0}</span>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">Vendor credit limit – review in Purchase Orders</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div 
              className="ai-panel" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: 0.55 }}
            >
              <Card className="border-0 rounded-xl h-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Financial Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {safeStats.cashRunwayDays > 0 && safeStats.profit >= 0 ? 75 : 65}/100
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Drivers: growth, margin, collection rate</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div 
              className="ai-panel" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <FinanceAIInsightsPanel tenantId={tenantId} stats={safeStats} />
            </motion.div>

            {/* Band 5: Widgets - Deep-dive Analytics + CA & Compliance */}
            {stats && (
              <motion.div 
                className="widget-card" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: 0.65 }}
              >
                <FinancialAlerts tenantId={tenantId} />
              </motion.div>
            )}
            {stats && (
              <motion.div 
                className="widget-card" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <CashFlowManagement tenantId={tenantId} />
              </motion.div>
            )}
            {stats && (
              <motion.div 
                className="widget-card" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: 0.75 }}
              >
                <FinancialForecasting tenantId={tenantId} />
              </motion.div>
            )}
            {stats && (
              <motion.div 
                className="widget-card" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <FinancialAnalytics tenantId={tenantId} />
              </motion.div>
            )}
            <motion.div 
              className="widget-card" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: 0.85 }}
            >
              <Card className="border-0 rounded-xl h-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">CA & Compliance</CardTitle>
                  <CardDescription className="text-sm">Invite your CA · AI-assisted view</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">AI CA Status: {safeStats.gstReconciliationPct}% GSTR-2B matched</p>
                  <Link href={`/finance/${tenantId}/ca-assistant`}>
                    <Button variant="outline" size="sm" className="w-full">Open CA Assistant</Button>
                  </Link>
                  <Link href={`/admin/roles`}>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground">Invite your CA (Accountant role)</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <QuickActionsPanel tenantId={tenantId} />
    </div>
  )
}

function StatCard({
  label,
  value,
  subline,
  trend = 'up',
  href,
  icon,
  color,
  tag,
  delay = 0.1,
}: {
  label: string
  value: string
  subline?: string
  trend?: 'up' | 'down'
  href: string
  icon: React.ReactNode
  color: string
  tag?: string
  delay?: number
}) {
  const colorStyles: Record<string, { bg: string; iconColor: string }> = {
    amber: { bg: 'from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    emerald: { bg: 'from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    red: { bg: 'from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30', iconColor: 'text-red-600 dark:text-red-400' },
    blue: { bg: 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    purple: { bg: 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30', iconColor: 'text-purple-600 dark:text-purple-400' },
    indigo: { bg: 'from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  }
  const colorStyle = colorStyles[color] || colorStyles.amber
  const sublineClass = trend === 'down' && color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
  const TrendIcon = trend === 'down' ? ArrowDownRight : ArrowUpRight
  
  // Apply icon color classes directly, matching CRM pattern
  const iconWithColor = isValidElement(icon) 
    ? cloneElement(icon as React.ReactElement<any>, { 
        className: `h-4 w-4 ${colorStyle.iconColor}` 
      })
    : icon
  
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <Link href={href} style={{ height: '100%', width: '100%', display: 'flex', textDecoration: 'none', color: 'inherit' }}>
        <Card className="stat-card-uniform" style={{ height: '100%', width: '100%', padding: 0, margin: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
          <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>{label}</CardTitle>
            <div className={`w-8 h-8 bg-gradient-to-br ${colorStyle.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              {iconWithColor}
            </div>
          </div>
          <div className="text-2xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
            {value}
          </div>
          {subline && (
            <p className={`text-xs ${sublineClass} flex items-center gap-1 font-medium mb-0.5`} style={{ lineHeight: '1.2', flexShrink: 0 }}>
              <TrendIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{subline}</span>
            </p>
          )}
          {tag && (
            <div className="flex items-center gap-1" style={{ marginTop: 'auto', flexShrink: 0 }}>
              <span className={`status-badge ${color === 'red' ? 'critical' : color === 'emerald' && tag.includes('Healthy') ? 'ahead' : 'on-track'}`}>{tag}</span>
            </div>
          )}
        </Card>
      </Link>
    </motion.div>
  )
}

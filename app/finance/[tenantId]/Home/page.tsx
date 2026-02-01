'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ShoppingCart, Landmark, TrendingUp, TrendingDown, IndianRupee, Scale } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { QuickActionsPanel } from '@/components/finance/QuickActionsPanel'
import { FinancialAlerts } from '@/components/finance/FinancialAlerts'
import { CashFlowManagement } from '@/components/finance/CashFlowManagement'
import { FinancialForecasting } from '@/components/finance/FinancialForecasting'
import { FinancialAnalytics } from '@/components/finance/FinancialAnalytics'

interface FinanceDashboardStats {
  totalInvoices: number
  invoicesThisMonth: number
  invoicesLastMonth: number
  invoiceGrowth: number
  paidInvoices: number
  overdueInvoices: number
  pendingInvoices: number
  totalRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueGrowth: number
  totalExpenses: number
  expensesThisMonth: number
  profit: number
  profitMargin: number
  purchaseOrders: number
  purchaseOrdersThisMonth: number
  gstReports: number
  recentInvoices: Array<{
    id: string
    invoiceNumber: string
    total: number
    status: string
    createdAt: string
  }>
  recentPurchaseOrders: Array<{
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
  invoicesByStatus: Array<{
    status: string
    count: number
    total: number
  }>
}

// PayAid Brand Colors for charts
const PURPLE_PRIMARY = '#53328A' // PayAid Purple
const GOLD_ACCENT = '#F5C700' // PayAid Gold
const SUCCESS = '#059669' // Success (Emerald)
const INFO = '#0284C7' // Info (Blue)
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, '#8B5CF6', '#FCD34D']

export default function FinanceDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [stats, setStats] = useState<FinanceDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [tenantId])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/finance/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch dashboard stats')
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error)
      setError(error.message || 'An unexpected error occurred while fetching data.')
      // Set default stats
      setStats({
        totalInvoices: 0,
        invoicesThisMonth: 0,
        invoicesLastMonth: 0,
        invoiceGrowth: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        pendingInvoices: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
        revenueLastMonth: 0,
        revenueGrowth: 0,
        totalExpenses: 0,
        expensesThisMonth: 0,
        profit: 0,
        profitMargin: 0,
        purchaseOrders: 0,
        purchaseOrdersThisMonth: 0,
        gstReports: 0,
        recentInvoices: [],
        recentPurchaseOrders: [],
        monthlyRevenue: [],
        invoicesByStatus: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoading message="Loading Finance dashboard..." fullScreen={true} />
  }

  // Prepare chart data
  const invoicesByStatusData = stats?.invoicesByStatus.map((item, idx) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    revenue: item.total,
    fill: CHART_COLORS[idx % CHART_COLORS.length]
  })) || []

  const monthlyRevenueData = stats?.monthlyRevenue.map(item => ({
    month: item.month,
    revenue: item.revenue
  })) || []

  // Profit/Loss indicator
  const isProfit = (stats?.profit || 0) >= 0

  // Get module configuration
  const moduleConfig = getModuleConfig('finance') || getModuleConfig('crm')!

  // Hero metrics with navigation links
  const heroMetrics = [
    {
      label: 'Total Revenue',
      value: stats?.totalRevenue ? formatINRForDisplay(stats.totalRevenue) : '₹0',
      change: stats?.revenueGrowth,
      trend: (stats?.revenueGrowth || 0) > 0 ? 'up' as const : 'down' as const,
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'gold' as const,
      href: `/finance/${tenantId}/Accounting/Reports/Revenue`,
    },
    {
      label: 'Invoices',
      value: stats?.totalInvoices || 0,
      change: stats?.invoiceGrowth,
      trend: (stats?.invoiceGrowth || 0) > 0 ? 'up' as const : 'down' as const,
      icon: <FileText className="w-5 h-5" />,
      color: 'info' as const,
      href: `/finance/${tenantId}/Invoices`,
    },
    {
      label: 'Purchase Orders',
      value: stats?.purchaseOrders || 0,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'purple' as const,
      href: `/finance/${tenantId}/Purchase-Orders`,
    },
    {
      label: 'Net Profit',
      value: stats?.profit ? formatINRForDisplay(Math.abs(stats.profit)) : '₹0',
      change: stats?.profitMargin,
      trend: isProfit ? 'up' as const : 'down' as const,
      icon: isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
      color: isProfit ? 'success' as const : 'error' as const,
      href: `/finance/${tenantId}/Accounting/Reports`,
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Finance"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Content Sections - 32px gap */}
      <div className="p-6 space-y-8 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard delay={0.1}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Paid Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats?.paidInvoices || 0}</div>
            </CardContent>
          </GlassCard>

          <GlassCard delay={0.2}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-error">{stats?.overdueInvoices || 0}</div>
            </CardContent>
          </GlassCard>

          <GlassCard delay={0.3}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">GST Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.gstReports || 0}</div>
            </CardContent>
          </GlassCard>
        </div>

        {/* Charts Row - Modern Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Revenue Trend - Area Chart */}
          <GlassCard delay={0.4}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyRevenueData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenueData}>
                      <defs>
                        <linearGradient id="colorFinanceRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={GOLD_ACCENT} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={GOLD_ACCENT} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: `1px solid ${GOLD_ACCENT}`,
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [formatINRForDisplay(value), 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={GOLD_ACCENT} 
                        fillOpacity={1} 
                        fill="url(#colorFinanceRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No revenue data available</p>
                </div>
              )}
            </CardContent>
          </GlassCard>

          {/* Invoices by Status - Pie Chart */}
          <GlassCard delay={0.5}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Invoices by Status</CardTitle>
              <CardDescription>Distribution of invoices across different statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesByStatusData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoicesByStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      >
                        {invoicesByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value, 'Invoices']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: `1px solid ${GOLD_ACCENT}`,
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No invoice data available</p>
                </div>
              )}
            </CardContent>
          </GlassCard>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Invoices */}
          <GlassCard delay={0.6}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
              <CardDescription>Latest invoices created</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatINRForDisplay(invoice.total)}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No recent invoices</p>
              )}
            </CardContent>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard delay={0.7}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>Get started with Finance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/finance/${tenantId}/Invoices/new`}>
                <Button variant="outline" className="w-full justify-start h-12">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </Link>
              <Link href={`/finance/${tenantId}/Purchase-Orders/new`}>
                <Button variant="outline" className="w-full justify-start h-12">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Create Purchase Order
                </Button>
              </Link>
              <Link href={`/finance/${tenantId}/GST`}>
                <Button variant="outline" className="w-full justify-start h-12">
                  <Landmark className="mr-2 h-4 w-4" />
                  View GST Reports
                </Button>
              </Link>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

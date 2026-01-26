'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ShoppingCart, Landmark, TrendingUp, RefreshCw, ArrowUpRight, ArrowDownRight, TrendingDown } from 'lucide-react'
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

// Design System Colors for charts (PayAid UI/UX Standards)
const TEAL_PRIMARY = '#0F766E' // Deep Teal
const BLUE_SECONDARY = '#0284C7' // Vibrant Blue
const EMERALD_SUCCESS = '#059669' // Success
const GOLD_ACCENT = '#FBBF24' // Accent Gold
const CHART_COLORS = [TEAL_PRIMARY, BLUE_SECONDARY, EMERALD_SUCCESS, GOLD_ACCENT, '#FCD34D', '#FDE68A']

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
    return (
      <div className="flex items-center justify-center w-full py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
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

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Refresh button - moved to page content since ModuleTopBar handles navigation */}
      <div className="absolute top-20 right-6 z-10">
        <button 
          onClick={fetchDashboardStats}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Welcome Banner - Enhanced - Design System Colors */}
      <div className="bg-gradient-to-r from-teal-primary to-blue-secondary text-white px-6 py-6 shadow-lg mt-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Finance Dashboard 💰
            </h1>
            {tenant && (
              <p className="text-yellow-100 flex items-center gap-2">
                <span>🏢</span>
                {tenant.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="p-6 space-y-6 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* KPI Cards - Design System Compliant with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 * 0.1, duration: 0.3 }}
          >
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-150">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Revenue</CardTitle>
                <div className="w-12 h-12 bg-emerald-success/10 rounded-lg flex items-center justify-center">
                  <span className="text-emerald-success font-bold text-lg">₹</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900 mb-1">
                  ₹{stats?.totalRevenue?.toLocaleString('en-IN') || '0'}
                </div>
                <p className="text-sm text-emerald-success flex items-center gap-1">
                  {stats && stats.revenueGrowth > 0 && (
                    <>
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="font-medium">{stats.revenueGrowth.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-gray-600">This month</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * 0.1, duration: 0.3 }}
          >
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-150">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Invoices</CardTitle>
                <div className="w-12 h-12 bg-blue-secondary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900 mb-1">
                  {stats?.totalInvoices || 0}
                </div>
                <p className="text-sm text-emerald-success flex items-center gap-1">
                  {stats && stats.invoiceGrowth > 0 && (
                    <>
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="font-medium">{stats.invoiceGrowth.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-gray-600">This month</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 * 0.1, duration: 0.3 }}
          >
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-150">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Purchase Orders</CardTitle>
                <div className="w-12 h-12 bg-teal-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-teal-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900 mb-1">
                  {stats?.purchaseOrders || 0}
                </div>
                <p className="text-sm text-gray-600">This month: {stats?.purchaseOrdersThisMonth || 0}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 * 0.1, duration: 0.3 }}
          >
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-150">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Net Profit</CardTitle>
                <div className={`w-12 h-12 ${isProfit ? 'bg-emerald-success/10' : 'bg-red-error/10'} rounded-lg flex items-center justify-center`}>
                  {isProfit ? (
                    <TrendingUp className={`h-6 w-6 ${isProfit ? 'text-emerald-success' : 'text-red-error'}`} />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-error" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-semibold mb-1 ${isProfit ? 'text-emerald-success' : 'text-red-error'}`}>
                  {isProfit ? '+' : ''}₹{stats?.profit?.toLocaleString('en-IN') || '0'}
                </div>
                <p className="text-sm text-gray-600">
                  Margin: {stats?.profitMargin?.toFixed(1) || '0'}%
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Paid Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.paidInvoices || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.overdueInvoices || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">GST Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.gstReports || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row - Modern Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Trend - Area Chart */}
          <Card className="border-0 shadow-lg">
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
                          <stop offset="5%" stopColor={TEAL_PRIMARY} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={TEAL_PRIMARY} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: `1px solid ${TEAL_PRIMARY}`,
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={TEAL_PRIMARY} 
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
          </Card>

          {/* Invoices by Status - Pie Chart */}
          <Card className="border-0 shadow-lg">
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
                          border: `1px solid ${TEAL_PRIMARY}`,
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
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <Card className="border-0 shadow-lg">
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
                        <p className="font-semibold text-gray-900">₹{invoice.total.toLocaleString('en-IN')}</p>
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
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
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
          </Card>
        </div>
      </div>
    </div>
  )
}

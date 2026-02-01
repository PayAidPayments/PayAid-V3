'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, CreditCard, ShoppingCart, TrendingUp } from 'lucide-react'
// ModuleTopBar is now in layout.tsx
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
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { IndianRupee, FileText, ShoppingCart, TrendingUp } from 'lucide-react'

interface SalesDashboardStats {
  landingPages: number
  checkoutPages: number
  totalOrders: number
  ordersThisMonth: number
  ordersLastMonth: number
  orderGrowth: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueGrowth: number
  recentOrders: Array<{
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
  ordersByStatus: Array<{
    status: string
    count: number
    total: number
  }>
  landingPageViews: number
  checkoutPageViews: number
}

// PayAid brand colors for charts
const PAYAID_GREEN = '#10B981'
const PAYAID_DARK_GREEN = '#059669'
const CHART_COLORS = [PAYAID_GREEN, '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5']

export default function SalesDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [stats, setStats] = useState<SalesDashboardStats | null>(null)
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

      const response = await fetch('/api/sales/dashboard/stats', {
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
        landingPages: 0,
        checkoutPages: 0,
        totalOrders: 0,
        ordersThisMonth: 0,
        ordersLastMonth: 0,
        orderGrowth: 0,
        revenueThisMonth: 0,
        revenueLastMonth: 0,
        revenueGrowth: 0,
        recentOrders: [],
        monthlyRevenue: [],
        ordersByStatus: [],
        landingPageViews: 0,
        checkoutPageViews: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const ordersByStatusData = stats?.ordersByStatus.map((item, idx) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    revenue: item.total,
    fill: CHART_COLORS[idx % CHART_COLORS.length]
  })) || []

  const monthlyRevenueData = stats?.monthlyRevenue.map(item => ({
    month: item.month,
    revenue: item.revenue
  })) || []

  // Get module configuration
  const moduleConfig = getModuleConfig('sales') || getModuleConfig('crm')!

  // Hero metrics
  const heroMetrics = [
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: stats?.orderGrowth,
      trend: (stats?.orderGrowth || 0) > 0 ? 'up' as const : 'down' as const,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'success' as const,
      href: `/sales/${tenantId}/Orders`,
    },
    {
      label: 'Revenue',
      value: stats?.revenueThisMonth ? formatINRForDisplay(stats.revenueThisMonth) : '₹0',
      change: stats?.revenueGrowth,
      trend: (stats?.revenueGrowth || 0) > 0 ? 'up' as const : 'down' as const,
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'gold' as const,
    },
    {
      label: 'Landing Pages',
      value: stats?.landingPages || 0,
      icon: <FileText className="w-5 h-5" />,
      color: 'info' as const,
      href: `/sales/${tenantId}/Landing-Pages`,
    },
    {
      label: 'Checkout Pages',
      value: stats?.checkoutPages || 0,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'purple' as const,
      href: `/sales/${tenantId}/Checkout-Pages`,
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Sales"
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

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Content Sections - 32px gap */}
      <div className="p-6 space-y-8 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard delay={0.1}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Landing Pages</CardTitle>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.landingPageViews || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Total views</p>
            </CardContent>
          </GlassCard>

          <GlassCard delay={0.2}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Checkout Page Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.checkoutPageViews || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Total views</p>
            </CardContent>
          </GlassCard>

          <GlassCard delay={0.3}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Orders This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.ordersThisMonth || 0}</div>
              <p className="text-xs text-gray-600 mt-1">
                {stats && stats.orderGrowth > 0 && (
                  <span className="text-success">{stats.orderGrowth.toFixed(1)}% growth</span>
                )}
              </p>
            </CardContent>
          </GlassCard>

          <GlassCard delay={0.4}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats && stats.revenueGrowth > 0 ? `+${stats.revenueGrowth.toFixed(1)}%` : '0%'}
              </div>
              <p className="text-xs text-gray-600 mt-1">Month over month</p>
            </CardContent>
          </GlassCard>
        </div>

        {/* Charts Row - Modern Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Revenue Trend - Area Chart */}
          <GlassCard delay={0.5}>
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
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PAYAID_GREEN} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={PAYAID_GREEN} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: `1px solid ${PAYAID_GREEN}`,
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [formatINRForDisplay(value), 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={PAYAID_GREEN} 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
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

          {/* Orders by Status - Pie Chart */}
          <GlassCard delay={0.6}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Orders by Status</CardTitle>
              <CardDescription>Distribution of orders across different statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersByStatusData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ordersByStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      >
                        {ordersByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value, 'Orders']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: `1px solid ${PAYAID_GREEN}`,
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No order data available</p>
                </div>
              )}
            </CardContent>
          </GlassCard>
        </div>

        {/* Recent Orders & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <GlassCard delay={0.7}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              <CardDescription>Latest orders from your sales channels</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatINRForDisplay(order.total)}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.status === 'confirmed' || order.status === 'delivered' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No recent orders</p>
              )}
            </CardContent>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard delay={0.8}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>Get started with Sales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/sales/${tenantId}/Landing-Pages/new`}>
                <Button variant="outline" className="w-full justify-start h-12">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Landing Page
                </Button>
              </Link>
              <Link href={`/sales/${tenantId}/Checkout-Pages/new`}>
                <Button variant="outline" className="w-full justify-start h-12">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Create Checkout Page
                </Button>
              </Link>
              <Link href={`/sales/${tenantId}/Orders`}>
                <Button variant="outline" className="w-full justify-start h-12">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View All Orders
                </Button>
              </Link>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

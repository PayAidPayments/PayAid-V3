'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, CreditCard, ShoppingCart, TrendingUp, RefreshCw, ArrowUpRight, Eye, Users, Settings, LogOut, ChevronDown } from 'lucide-react'
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
import { ModuleSwitcher } from '@/components/ModuleSwitcher'

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
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { user, tenant, logout } = useAuthStore()
  const [stats, setStats] = useState<SalesDashboardStats | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])
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

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar - Modern Style */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Sales</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/sales/${tenantId}/Home/`} className="text-green-600 font-medium border-b-2 border-green-600 pb-2">Home</Link>
              <Link href={`/sales/${tenantId}/Landing-Pages`} className="text-gray-600 hover:text-gray-900 transition-colors">Landing Pages</Link>
              <Link href={`/sales/${tenantId}/Checkout-Pages`} className="text-gray-600 hover:text-gray-900 transition-colors">Checkout Pages</Link>
              <Link href={`/sales/${tenantId}/Orders`} className="text-gray-600 hover:text-gray-900 transition-colors">Orders</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboardStats}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            {/* Module Switcher for Decoupled Architecture */}
            <ModuleSwitcher currentModule="sales" />
            
            {/* User Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        router.push(tenantId ? `/dashboard/${tenantId}/settings/profile` : '/dashboard/settings/profile')
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Profile Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner - Enhanced */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-6 shadow-lg mt-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Sales Dashboard 🚀
            </h1>
            {tenant && (
              <p className="text-green-100 flex items-center gap-2">
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
        {/* KPI Cards - Modern Design with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Landing Pages</CardTitle>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.landingPages || 0}
              </div>
              <p className="text-xs text-gray-600">Active pages</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Checkout Pages</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.checkoutPages || 0}
              </div>
              <p className="text-xs text-gray-600">Active pages</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Orders</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.totalOrders || 0}
              </div>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                {stats && stats.orderGrowth > 0 && (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-medium">{stats.orderGrowth.toFixed(1)}%</span>
                  </>
                )}
                <span>This month</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Revenue</CardTitle>
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                ₹{stats?.revenueThisMonth?.toLocaleString('en-IN') || '0'}
              </div>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                {stats && stats.revenueGrowth > 0 && (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-medium">{stats.revenueGrowth.toFixed(1)}%</span>
                  </>
                )}
                <span>This month</span>
              </p>
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
                        formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
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
          </Card>

          {/* Orders by Status - Pie Chart */}
          <Card className="border-0 shadow-lg">
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
          </Card>
        </div>

        {/* Recent Orders & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="border-0 shadow-lg">
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
                        <p className="font-semibold text-gray-900">₹{order.total.toLocaleString('en-IN')}</p>
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
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
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
          </Card>
        </div>
      </div>
    </div>
  )
}

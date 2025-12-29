'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

// PayAid brand colors
const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'
const PAYAID_DARK_PURPLE = '#2D1B47'
const PAYAID_LIGHT_PURPLE = '#6B4BA1'

function HealthScoreWidget() {
  const { token } = useAuthStore()
  const { data: healthScore } = useQuery({
    queryKey: ['health-score'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/health-score', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch health score')
      return response.json()
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const score = healthScore?.healthScore || 0
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  return (
    <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Business Health</CardTitle>
        <span className="text-2xl">💚</span>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}/100</div>
        <CardDescription>{getScoreLabel(score)}</CardDescription>
        {healthScore?.factors && (
          <div className="mt-3 space-y-1">
            {healthScore.factors.slice(0, 3).map((factor: any, idx: number) => (
              <div key={idx} className="text-xs text-gray-600">
                • {factor.name}: {factor.score}/100
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function DashboardPage() {
  const { user, tenant, token } = useAuthStore()
  const [stats, setStats] = useState({
    contacts: 0,
    deals: 0,
    orders: 0,
    invoices: 0,
    tasks: 0,
  })

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 403 && errorData.code === 'MODULE_NOT_LICENSED') {
          const error = new Error(errorData.error || 'Analytics module required')
          ;(error as any).isLicenseError = true
          ;(error as any).moduleId = errorData.moduleId
          throw error
        }
        if (response.status === 503 && errorData.error?.includes('Database')) {
          const error = new Error(
            errorData.error + (errorData.details ? `: ${errorData.details}` : '')
          )
          ;(error as any).isDatabaseError = true
          throw error
        }
        if (response.status === 401) {
          const error = new Error(errorData.error || 'Authentication required')
          ;(error as any).isAuthError = true
          throw error
        }
        throw new Error(
          errorData.error || 'Failed to fetch dashboard stats' + 
          (errorData.details ? `: ${errorData.details}` : '')
        )
      }
      return response.json()
    },
    enabled: !!token,
    retry: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (dashboardStats) {
      setStats({
        contacts: dashboardStats.counts?.contacts || 0,
        deals: dashboardStats.counts?.deals || 0,
        orders: dashboardStats.counts?.orders || 0,
        invoices: dashboardStats.counts?.invoices || 0,
        tasks: dashboardStats.counts?.tasks || 0,
      })
    }
  }, [dashboardStats])

  // Sample data for charts (replace with actual data from API)
  const salesTrendData = [
    { name: 'Jan', value: 15000, target: 20000 },
    { name: 'Feb', value: 30000, target: 25000 },
    { name: 'Mar', value: 28000, target: 30000 },
    { name: 'Apr', value: 55000, target: 35000 },
    { name: 'May', value: 55000, target: 40000 },
    { name: 'Jun', value: 75000, target: 45000 },
  ]

  const revenueData = [
    { month: 'Month 1', revenue: 20000, expenses: 16000 },
    { month: 'Month 2', revenue: 29000, expenses: 24000 },
    { month: 'Month 3', revenue: 35000, expenses: 25000 },
    { month: 'Month 4', revenue: 30000, expenses: 23000 },
    { month: 'Month 5', revenue: 27000, expenses: 18000 },
  ]

  const marketShareData = [
    { name: 'Product A', value: 70, fill: PAYAID_PURPLE },
    { name: 'Product B', value: 20, fill: PAYAID_GOLD },
    { name: 'Product C', value: 10, fill: PAYAID_LIGHT_PURPLE },
  ]

  const kpiData = [
    { name: 'Conversion Rate', value: 8.2, unit: '%' },
    { name: 'Churn Rate', value: 3.1, unit: '%' },
    { name: 'Avg Revenue/User', value: 2800, unit: '₹' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F8F7F3 0%, #FFFFFF 100%)' }}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: PAYAID_PURPLE }}>
              Welcome back, {user?.name || user?.email}!
            </h1>
            <p className="mt-2 text-gray-600">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>#{PAYAID_PURPLE.replace('#', '')}</span>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium">{user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Link href="/dashboard/contacts" className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Contacts</CardTitle>
                <span className="text-2xl">👥</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>{stats.contacts}</div>
                <CardDescription>Total contacts</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/deals" className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_GOLD }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Deals</CardTitle>
                <span className="text-2xl">💼</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PAYAID_GOLD }}>{stats.deals}</div>
                <CardDescription>Active deals</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/orders" className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Orders</CardTitle>
                <span className="text-2xl">🛒</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>{stats.orders}</div>
                <CardDescription>Total orders</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/invoices" className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_GOLD }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Invoices</CardTitle>
                <span className="text-2xl">🧾</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PAYAID_GOLD }}>{stats.invoices}</div>
                <CardDescription>Total invoices</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/tasks" className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Tasks</CardTitle>
                <span className="text-2xl">✅</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>{stats.tasks}</div>
                <CardDescription>Total tasks</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/analytics" className="block">
            <HealthScoreWidget />
          </Link>
        </div>

        {/* Error Message */}
        {statsError && (
          <div className={`p-4 text-sm border rounded-md ${
            (statsError as any)?.isLicenseError 
              ? "bg-yellow-50 border-yellow-200"
              : (statsError as any)?.isDatabaseError
              ? "bg-red-50 border-red-200"
              : (statsError as any)?.isAuthError
              ? "bg-orange-50 border-orange-200"
              : "bg-yellow-50 border-yellow-200"
          }`}>
            {(statsError as any)?.isLicenseError ? (
              <div>
                <p className="font-semibold text-yellow-800 mb-2">
                  🔒 Analytics Module Required
                </p>
                <p className="text-yellow-700 mb-3">
                  Dashboard statistics require the Analytics module. Please contact your administrator to activate this module.
                </p>
                <Link href="/dashboard/admin/modules">
                  <Button variant="outline" size="sm" className="text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                    Manage Modules
                  </Button>
                </Link>
              </div>
            ) : (statsError as any)?.isDatabaseError ? (
              <div>
                <p className="font-semibold text-red-800 mb-2">
                  🗄️ Database Connection Error
                </p>
                <p className="text-red-700 mb-3">
                  {statsError.message || 'Failed to connect to database. Please check your DATABASE_URL configuration.'}
                </p>
                <p className="text-red-600 text-xs mb-2">
                  Make sure:
                </p>
                <ul className="text-red-600 text-xs list-disc list-inside mb-3">
                  <li>Your database server is running</li>
                  <li>Database connection is properly configured</li>
                  <li>Database migrations have been completed</li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-800 border-red-300 hover:bg-red-100"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            ) : (statsError as any)?.isAuthError ? (
              <div>
                <p className="font-semibold text-orange-800 mb-2">
                  🔐 Authentication Required
                </p>
                <p className="text-orange-700 mb-3">
                  {statsError.message || 'Please log in to view dashboard statistics.'}
                </p>
                <Link href="/login">
                  <Button variant="outline" size="sm" className="text-orange-800 border-orange-300 hover:bg-orange-100">
                    Go to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-yellow-800 mb-2">
                  ⚠️ Error Loading Dashboard Stats
                </p>
                <p className="text-yellow-700 mb-3">
                  {statsError.message || 'Failed to load dashboard stats. Please refresh the page.'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Performance Line Chart */}
          <Card className="border-2 hover:shadow-xl transition-shadow" style={{ borderColor: PAYAID_PURPLE }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Sales Performance</CardTitle>
              <CardDescription>Revenue trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PAYAID_PURPLE} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={PAYAID_PURPLE} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E3" />
                  <XAxis dataKey="name" stroke={PAYAID_PURPLE} />
                  <YAxis stroke={PAYAID_PURPLE} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: `1px solid ${PAYAID_PURPLE}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={PAYAID_PURPLE} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Market Share Donut Chart */}
          <Card className="border-2 hover:shadow-xl transition-shadow" style={{ borderColor: PAYAID_GOLD }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Market Share Distribution</CardTitle>
              <CardDescription>Product market share</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={marketShareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {marketShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: `1px solid ${PAYAID_PURPLE}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Trend Bar Chart */}
          <Card className="border-2 hover:shadow-xl transition-shadow" style={{ borderColor: PAYAID_PURPLE }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E3" />
                  <XAxis dataKey="month" stroke={PAYAID_PURPLE} />
                  <YAxis stroke={PAYAID_PURPLE} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: `1px solid ${PAYAID_PURPLE}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill={PAYAID_PURPLE} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill={PAYAID_GOLD} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 text-center" style={{ borderColor: PAYAID_PURPLE }}>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold mb-2" style={{ 
                background: `linear-gradient(135deg, ${PAYAID_PURPLE} 0%, ${PAYAID_GOLD} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>30M+</div>
              <CardDescription className="text-sm uppercase tracking-wide">SMBs in India</CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 text-center" style={{ borderColor: PAYAID_GOLD }}>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold mb-2" style={{ 
                background: `linear-gradient(135deg, ${PAYAID_PURPLE} 0%, ${PAYAID_GOLD} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>50%</div>
              <CardDescription className="text-sm uppercase tracking-wide">Cost Savings</CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 text-center" style={{ borderColor: PAYAID_PURPLE }}>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold mb-2" style={{ 
                background: `linear-gradient(135deg, ${PAYAID_PURPLE} 0%, ${PAYAID_GOLD} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>8</div>
              <CardDescription className="text-sm uppercase tracking-wide">Complete Modules</CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 text-center" style={{ borderColor: PAYAID_GOLD }}>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold mb-2" style={{ 
                background: `linear-gradient(135deg, ${PAYAID_PURPLE} 0%, ${PAYAID_GOLD} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>₹7,999</div>
              <CardDescription className="text-sm uppercase tracking-wide">All-in-One Price</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Pipeline Row */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-lg transition-shadow" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Revenue (30 Days)</CardTitle>
                <span className="text-2xl">💰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
                  ₹{dashboardStats.revenue?.last30Days?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <CardDescription>Last 30 days revenue</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow" style={{ borderColor: PAYAID_GOLD }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Pipeline Value</CardTitle>
                <span className="text-2xl">📈</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PAYAID_GOLD }}>
                  ₹{dashboardStats.pipeline?.value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <CardDescription>{dashboardStats.pipeline?.activeDeals || 0} active deals</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Alerts</CardTitle>
                <span className="text-2xl">⚠️</span>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overdue Invoices</span>
                    <span className="text-lg font-bold text-red-600">{dashboardStats.alerts?.overdueInvoices || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Tasks</span>
                    <span className="text-lg font-bold text-yellow-600">{dashboardStats.alerts?.pendingTasks || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KPI Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-2" style={{ borderColor: PAYAID_PURPLE }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Monthly KPI Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpiData.map((kpi, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F8F7F3' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">✓</span>
                      <span className="font-medium">{kpi.name}</span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>
                      {kpi.value}{kpi.unit}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Engagement */}
          <Card className="border-2" style={{ borderColor: PAYAID_GOLD }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Customer Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-3xl font-bold mb-2" style={{ color: PAYAID_GOLD }}>+15%</div>
                <CardDescription className="text-base">Customer Growth QoQ</CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="border-2" style={{ borderColor: PAYAID_PURPLE }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-3xl font-bold mb-2" style={{ color: PAYAID_PURPLE }}>45,000</div>
                <CardDescription className="text-base">Active Users</CardDescription>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {dashboardStats?.recentActivity && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardStats.recentActivity.contacts && dashboardStats.recentActivity.contacts.length > 0 && (
              <Card className="border-2" style={{ borderColor: PAYAID_PURPLE }}>
                <CardHeader>
                  <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Recent Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardStats.recentActivity.contacts.slice(0, 5).map((contact: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                        <span className="text-sm">{contact.name || contact.email}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(contact.createdAt), 'MMM dd')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {dashboardStats.recentActivity.deals && dashboardStats.recentActivity.deals.length > 0 && (
              <Card className="border-2" style={{ borderColor: PAYAID_GOLD }}>
                <CardHeader>
                  <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Recent Deals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardStats.recentActivity.deals.slice(0, 5).map((deal: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                        <span className="text-sm">{deal.name}</span>
                        <span className="text-sm font-bold" style={{ color: PAYAID_GOLD }}>
                          ₹{deal.value?.toLocaleString('en-IN') || '0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {dashboardStats.recentActivity.orders && dashboardStats.recentActivity.orders.length > 0 && (
              <Card className="border-2" style={{ borderColor: PAYAID_PURPLE }}>
                <CardHeader>
                  <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardStats.recentActivity.orders.slice(0, 5).map((order: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                        <span className="text-sm">{order.orderNumber || `Order #${order.id}`}</span>
                        <span className="text-sm font-bold" style={{ color: PAYAID_PURPLE }}>
                          ₹{order.total?.toLocaleString('en-IN') || '0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

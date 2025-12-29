'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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

function HealthScoreWidget({ getDashboardLink }: { getDashboardLink: (path: string) => string }) {
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
    <Link href={getDashboardLink('/analytics')} className="block">
      <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Business Health</CardTitle>
          <span className="text-2xl">💚</span>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}/100</div>
          <CardDescription>{getScoreLabel(score)} - Click to see details</CardDescription>
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
    </Link>
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
  const params = useParams()
  const { user, tenant, token } = useAuthStore()
  const [stats, setStats] = useState({
    contacts: 0,
    deals: 0,
    orders: 0,
    invoices: 0,
    tasks: 0,
  })

  // Get tenantId from URL params (if accessed via /dashboard/[tenantId]) or from auth store
  const tenantIdFromUrl = params?.tenantId as string | undefined
  
  // ALWAYS prioritize tenant ID from URL if present - this ensures consistency
  // Only fall back to auth store if URL doesn't have tenant ID
  const currentTenantId = tenantIdFromUrl || tenant?.id || null

  // Helper function to generate tenant-aware dashboard URLs
  const getDashboardLink = (path: string) => {
    // If we have a tenant ID in the URL, ALWAYS use it (don't fall back to auth store)
    // This ensures all links maintain the same tenant ID as the current URL
    const tenantIdToUse = tenantIdFromUrl || currentTenantId
    
    if (!tenantIdToUse) {
      // Fallback to generic path (for demo/admin access)
      return `/dashboard${path.startsWith('/') ? path : '/' + path}`
    }
    // Remove leading /dashboard if present
    const cleanPath = path.replace(/^\/dashboard\/?/, '')
    return `/dashboard/${tenantIdToUse}${cleanPath ? '/' + cleanPath : ''}`
  }

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

  // Use real chart data from API, fallback to empty data if not available
  const salesTrendData = dashboardStats?.charts?.salesTrend || [
    { name: 'No Data', value: 0, target: 0 },
  ]

  const revenueData = dashboardStats?.charts?.revenueTrend || [
    { month: 'No Data', revenue: 0, expenses: 0 },
  ]

  const marketShareData = dashboardStats?.charts?.marketShare || [
    { name: 'No Data', value: 100, fill: PAYAID_PURPLE },
  ]

  const kpiData = dashboardStats?.charts?.kpis || [
    { name: 'Conversion Rate', value: 0, unit: '%' },
    { name: 'Churn Rate', value: 0, unit: '%' },
    { name: 'Avg Revenue/User', value: 0, unit: '₹' },
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
          <Link href={getDashboardLink('/contacts')} className="block">
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

          <Link href={getDashboardLink('/deals')} className="block">
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

          <Link href={getDashboardLink('/orders')} className="block">
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

          <Link href={getDashboardLink('/invoices')} className="block">
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

          <Link href={getDashboardLink('/tasks')} className="block">
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

          <HealthScoreWidget getDashboardLink={getDashboardLink} />
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
          <Link href={getDashboardLink('/deals')} className="block">
            <Card className="border-2 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader>
                <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Sales Performance</CardTitle>
                <CardDescription>Sales trends over time - Click to see deals</CardDescription>
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
          </Link>

          {/* Market Share Donut Chart */}
          <Link href={getDashboardLink('/stats/pipeline')} className="block">
            <Card className="border-2 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]" style={{ borderColor: PAYAID_GOLD }}>
              <CardHeader>
                <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Market Share Distribution</CardTitle>
                <CardDescription>Deal stage distribution - Click to see pipeline details</CardDescription>
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
                      {marketShareData.map((entry: any, index: number) => (
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
          </Link>

          {/* Revenue Trend Bar Chart */}
          <Link href={getDashboardLink('/accounting/reports/revenue')} className="block">
            <Card className="border-2 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader>
                <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue comparison - Click to see revenue dashboard</CardDescription>
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
          </Link>
        </div>

        {/* Revenue & Pipeline Row */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href={getDashboardLink('/stats/revenue')} className="block">
              <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Revenue (30 Days)</CardTitle>
                  <span className="text-2xl">💰</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
                    ₹{dashboardStats.revenue?.last30Days?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <CardDescription>Last 30 days revenue - Click to see breakdown</CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href={getDashboardLink('/stats/pipeline')} className="block">
              <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_GOLD }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: PAYAID_PURPLE }}>Pipeline Value</CardTitle>
                  <span className="text-2xl">📈</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: PAYAID_GOLD }}>
                    ₹{dashboardStats.pipeline?.value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <CardDescription>{dashboardStats.pipeline?.activeDeals || 0} active deals - Click to see details</CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href={getDashboardLink('/stats/alerts')} className="block">
              <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
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
                  <CardDescription className="mt-2">Click to see all alerts</CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* KPI Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link href={getDashboardLink('/accounting/reports/revenue')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader>
                <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Monthly KPI Metrics</CardTitle>
                <CardDescription>Click to see revenue dashboard with KPIs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                {kpiData.map((kpi: any, idx: number) => (
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
          </Link>

          {/* Customer Engagement */}
          <Link href={getDashboardLink('/contacts')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_GOLD }}>
              <CardHeader>
                <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Customer Engagement</CardTitle>
                <CardDescription>Click to see all contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-3xl font-bold mb-2" style={{ color: PAYAID_GOLD }}>+15%</div>
                  <CardDescription className="text-base">Customer Growth QoQ</CardDescription>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Active Users */}
          <Link href={getDashboardLink('/contacts')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader>
                <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Active Users</CardTitle>
                <CardDescription>Click to see all contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-3xl font-bold mb-2" style={{ color: PAYAID_PURPLE }}>45,000</div>
                  <CardDescription className="text-base">Active Users</CardDescription>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        {dashboardStats?.recentActivity && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardStats.recentActivity.contacts && dashboardStats.recentActivity.contacts.length > 0 && (
              <Link href={getDashboardLink('/contacts')} className="block">
                <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Recent Contacts</CardTitle>
                    <CardDescription>Click to see all contacts</CardDescription>
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
              </Link>
            )}

            {dashboardStats.recentActivity.deals && dashboardStats.recentActivity.deals.length > 0 && (
              <Link href={getDashboardLink('/deals')} className="block">
                <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_GOLD }}>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Recent Deals</CardTitle>
                    <CardDescription>Click to see all deals</CardDescription>
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
              </Link>
            )}

            {dashboardStats.recentActivity.orders && dashboardStats.recentActivity.orders.length > 0 && (
              <Link href={getDashboardLink('/orders')} className="block">
                <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105" style={{ borderColor: PAYAID_PURPLE }}>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>Recent Orders</CardTitle>
                    <CardDescription>Click to see all orders</CardDescription>
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
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

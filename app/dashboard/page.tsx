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
      <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium truncate flex-1" style={{ color: PAYAID_PURPLE }}>Business Health</CardTitle>
          <span className="text-xl sm:text-2xl shrink-0 ml-1">💚</span>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className={`text-2xl sm:text-3xl font-bold truncate ${getScoreColor(score)}`}>{score}/100</div>
          <CardDescription className="text-xs truncate">{getScoreLabel(score)} - Click to see details</CardDescription>
          {healthScore?.factors && (
            <div className="mt-2 sm:mt-3 space-y-1">
              {healthScore.factors.slice(0, 3).map((factor: any, idx: number) => (
                <div key={idx} className="text-xs text-gray-600 truncate">
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
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate" style={{ color: PAYAID_PURPLE }}>
              Welcome back, {user?.name || user?.email}!
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="text-xs sm:text-sm font-medium hidden sm:inline" style={{ color: PAYAID_PURPLE }}>#{PAYAID_PURPLE.replace('#', '')}</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-medium">{user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Modern Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <Link href={getDashboardLink('/contacts')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate flex-1" style={{ color: PAYAID_PURPLE }}>Contacts</CardTitle>
                <span className="text-xl sm:text-2xl shrink-0 ml-1">👥</span>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold truncate" style={{ color: PAYAID_PURPLE }}>{stats.contacts}</div>
                <CardDescription className="text-xs truncate">Total contacts</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href={getDashboardLink('/deals')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_GOLD }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate flex-1" style={{ color: PAYAID_PURPLE }}>Deals</CardTitle>
                <span className="text-xl sm:text-2xl shrink-0 ml-1">💼</span>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold truncate" style={{ color: PAYAID_GOLD }}>{stats.deals}</div>
                <CardDescription className="text-xs truncate">Active deals</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href={getDashboardLink('/orders')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate flex-1" style={{ color: PAYAID_PURPLE }}>Orders</CardTitle>
                <span className="text-xl sm:text-2xl shrink-0 ml-1">🛒</span>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold truncate" style={{ color: PAYAID_PURPLE }}>{stats.orders}</div>
                <CardDescription className="text-xs truncate">Total orders</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href={getDashboardLink('/invoices')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_GOLD }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate flex-1" style={{ color: PAYAID_PURPLE }}>Invoices</CardTitle>
                <span className="text-xl sm:text-2xl shrink-0 ml-1">🧾</span>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold truncate" style={{ color: PAYAID_GOLD }}>{stats.invoices}</div>
                <CardDescription className="text-xs truncate">Total invoices</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href={getDashboardLink('/tasks')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate flex-1" style={{ color: PAYAID_PURPLE }}>Tasks</CardTitle>
                <span className="text-xl sm:text-2xl shrink-0 ml-1">✅</span>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold truncate" style={{ color: PAYAID_PURPLE }}>{stats.tasks}</div>
                <CardDescription className="text-xs truncate">Total tasks</CardDescription>
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
                  Troubleshooting steps:
                </p>
                <ul className="text-red-600 text-xs list-disc list-inside mb-3 space-y-1">
                  <li>Check if your database server is running</li>
                  <li>Verify DATABASE_URL is configured correctly in environment variables</li>
                  <li>If using Supabase, check if your project is paused (free tier auto-pauses after 7 days)</li>
                  <li>Resume your Supabase project from the dashboard if paused</li>
                  <li>Try using a direct connection URL instead of a pooler URL</li>
                  <li>Verify database migrations have been completed</li>
                  <li>Check firewall settings if using a remote database</li>
                </ul>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-800 border-red-300 hover:bg-red-100"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-800 border-red-300 hover:bg-red-100"
                    onClick={() => {
                      window.open('/api/health/db', '_blank')
                    }}
                  >
                    Check Database Health
                  </Button>
                </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Sales Performance Line Chart */}
          <Link href={getDashboardLink('/deals')} className="block">
            <Card className="border-2 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-bold truncate" style={{ color: PAYAID_PURPLE }}>Sales Performance</CardTitle>
                <CardDescription className="text-xs sm:text-sm line-clamp-2">Sales trends over time - Click to see deals</CardDescription>
              </CardHeader>
              <CardContent className="overflow-visible">
                <div className="w-full" style={{ minHeight: '200px', height: '200px', minWidth: '0' }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <AreaChart data={salesTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PAYAID_PURPLE} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={PAYAID_PURPLE} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E3" />
                      <XAxis 
                        dataKey="name" 
                        stroke={PAYAID_PURPLE} 
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis 
                        stroke={PAYAID_PURPLE} 
                        tick={{ fontSize: 11 }}
                        width={60}
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                          return value.toString()
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: `1px solid ${PAYAID_PURPLE}`,
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
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
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Market Share Donut Chart */}
          <Link href={getDashboardLink('/stats/pipeline')} className="block">
            <Card className="border-2 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] overflow-hidden" style={{ borderColor: PAYAID_GOLD }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-bold truncate" style={{ color: PAYAID_PURPLE }}>Market Share Distribution</CardTitle>
                <CardDescription className="text-xs sm:text-sm line-clamp-2">Deal stage distribution - Click to see pipeline details</CardDescription>
              </CardHeader>
              <CardContent className="overflow-visible">
                <div className="w-full" style={{ minHeight: '200px', height: '200px', minWidth: '0' }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <PieChart>
                      <Pie
                        data={marketShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {marketShareData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: `1px solid ${PAYAID_PURPLE}`,
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: any) => [`${value} (${((value / marketShareData.reduce((sum: number, item: any) => sum + item.value, 0)) * 100).toFixed(1)}%)`, name]}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                        iconSize={10}
                        verticalAlign="bottom"
                        height={36}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Revenue Trend Bar Chart */}
          <Link href={getDashboardLink('/accounting/reports/revenue')} className="block">
            <Card className="border-2 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-bold truncate" style={{ color: PAYAID_PURPLE }}>Revenue Trend</CardTitle>
                <CardDescription className="text-xs sm:text-sm line-clamp-2">Monthly revenue comparison - Click to see revenue dashboard</CardDescription>
              </CardHeader>
              <CardContent className="overflow-visible">
                <div className="w-full" style={{ minHeight: '200px', height: '200px', minWidth: '0' }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E3" />
                      <XAxis 
                        dataKey="month" 
                        stroke={PAYAID_PURPLE} 
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis 
                        stroke={PAYAID_PURPLE} 
                        tick={{ fontSize: 11 }}
                        width={60}
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                          return value.toString()
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: `1px solid ${PAYAID_PURPLE}`,
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                        iconSize={10}
                        verticalAlign="bottom"
                        height={36}
                      />
                      <Bar dataKey="revenue" fill={PAYAID_PURPLE} radius={[8, 8, 0, 0]} />
                      <Bar dataKey="expenses" fill={PAYAID_GOLD} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Revenue & Pipeline Row */}
        {dashboardStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link href={getDashboardLink('/stats/revenue')} className="block">
              <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate flex-1" style={{ color: PAYAID_PURPLE }}>Revenue (30 Days)</CardTitle>
                  <span className="text-xl sm:text-2xl shrink-0 ml-1">💰</span>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-2xl font-bold truncate" style={{ color: PAYAID_PURPLE }}>
                    ₹{dashboardStats.revenue?.last30Days?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <CardDescription className="text-xs truncate">Last 30 days revenue - Click to see breakdown</CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href={getDashboardLink('/stats/pipeline')} className="block">
              <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_GOLD }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate flex-1" style={{ color: PAYAID_PURPLE }}>Pipeline Value</CardTitle>
                  <span className="text-xl sm:text-2xl shrink-0 ml-1">📈</span>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-2xl font-bold truncate" style={{ color: PAYAID_GOLD }}>
                    ₹{dashboardStats.pipeline?.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <CardDescription className="text-xs truncate">{dashboardStats.pipeline?.activeDeals || 0} active deals - Click to see details</CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href={getDashboardLink('/stats/alerts')} className="block">
              <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate flex-1" style={{ color: PAYAID_PURPLE }}>Alerts</CardTitle>
                  <span className="text-xl sm:text-2xl shrink-0 ml-1">⚠️</span>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm truncate flex-1">Overdue Invoices</span>
                      <span className="text-base sm:text-lg font-bold text-red-600 shrink-0 ml-2">{dashboardStats.alerts?.overdueInvoices || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm truncate flex-1">Pending Tasks</span>
                      <span className="text-base sm:text-lg font-bold text-yellow-600 shrink-0 ml-2">{dashboardStats.alerts?.pendingTasks || 0}</span>
                    </div>
                  </div>
                  <CardDescription className="mt-2 text-xs truncate">Click to see all alerts</CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* KPI Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link href={getDashboardLink('/accounting/reports/revenue')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-bold truncate" style={{ color: PAYAID_PURPLE }}>Monthly KPI Metrics</CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">Click to see revenue dashboard with KPIs</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                {kpiData.map((kpi: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#F8F7F3' }}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <span className="text-lg sm:text-xl shrink-0">✓</span>
                      <span className="font-medium text-xs sm:text-sm truncate">{kpi.name}</span>
                    </div>
                    <span className="text-base sm:text-lg font-bold shrink-0 ml-2" style={{ color: PAYAID_PURPLE }}>
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
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_GOLD }}>
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-bold truncate" style={{ color: PAYAID_PURPLE }}>Customer Engagement</CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">Click to see all contacts</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-center py-6 sm:py-8">
                  <div className="text-2xl sm:text-3xl font-bold mb-2 truncate" style={{ color: PAYAID_GOLD }}>+15%</div>
                  <CardDescription className="text-sm sm:text-base truncate">Customer Growth QoQ</CardDescription>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Active Users */}
          <Link href={getDashboardLink('/contacts')} className="block">
            <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-bold truncate" style={{ color: PAYAID_PURPLE }}>Active Users</CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">Click to see all contacts</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-center py-6 sm:py-8">
                  <div className="text-2xl sm:text-3xl font-bold mb-2 truncate" style={{ color: PAYAID_PURPLE }}>45,000</div>
                  <CardDescription className="text-sm sm:text-base truncate">Active Users</CardDescription>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        {dashboardStats?.recentActivity && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {dashboardStats.recentActivity.contacts && dashboardStats.recentActivity.contacts.length > 0 && (
              <Link href={getDashboardLink('/contacts')} className="block">
                <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
                  <CardHeader className="px-3 sm:px-6">
                    <CardTitle className="text-base sm:text-lg font-bold truncate" style={{ color: PAYAID_PURPLE }}>Recent Contacts</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">Click to see all contacts</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="space-y-2">
                      {dashboardStats.recentActivity.contacts.slice(0, 5).map((contact: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                          <span className="text-xs sm:text-sm truncate flex-1 min-w-0">{contact.name || contact.email}</span>
                          <span className="text-xs text-gray-500 shrink-0 ml-2">
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
                <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_GOLD }}>
                  <CardHeader className="px-3 sm:px-6">
                    <CardTitle className="text-base sm:text-lg font-bold truncate" style={{ color: PAYAID_PURPLE }}>Recent Deals</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">Click to see all deals</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="space-y-2">
                      {dashboardStats.recentActivity.deals.slice(0, 5).map((deal: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                          <span className="text-xs sm:text-sm truncate flex-1 min-w-0">{deal.name}</span>
                          <span className="text-xs sm:text-sm font-bold shrink-0 ml-2" style={{ color: PAYAID_GOLD }}>
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
                <Card className="border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 overflow-hidden" style={{ borderColor: PAYAID_PURPLE }}>
                  <CardHeader className="px-3 sm:px-6">
                    <CardTitle className="text-base sm:text-lg font-bold truncate" style={{ color: PAYAID_PURPLE }}>Recent Orders</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">Click to see all orders</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="space-y-2">
                      {dashboardStats.recentActivity.orders.slice(0, 5).map((order: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                          <span className="text-xs sm:text-sm truncate flex-1 min-w-0">{order.orderNumber || `Order #${order.id}`}</span>
                          <span className="text-xs sm:text-sm font-bold shrink-0 ml-2" style={{ color: PAYAID_PURPLE }}>
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

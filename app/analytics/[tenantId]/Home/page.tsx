'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, TrendingUp, TrendingDown, Users, IndianRupee, 
  Heart, Target, TrendingUp as TrendingUpIcon, Activity,
  FileText, LayoutDashboard, ArrowRight
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
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

// PayAid Brand Colors for charts
const PURPLE_PRIMARY = '#53328A'
const GOLD_ACCENT = '#F5C700'
const SUCCESS = '#059669'
const INFO = '#0284C7'
const ERROR = '#DC2626'
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, '#8B5CF6', '#FCD34D']

interface HealthScore {
  healthScore: number
  components: {
    sales: number
    revenue: number
    customers: number
    collections: number
    operations: number
  }
  metrics: {
    totalContacts: number
    totalDeals: number
    totalRevenue: number
    pendingTasks: number
  }
}

interface LeadSource {
  id: string
  name: string
  type: string
  leadsCount: number
  conversionsCount: number
  conversionRate: string
  avgDealValue: number
  totalValue: number
  roi: string
}

interface TeamPerformance {
  period: string
  teamTotals: {
    callsMade: number
    emailsSent: number
    meetingsScheduled: number
    dealsClosed: number
    revenue: number
    avgConversionRate: string
  }
  leaderboard: Array<{
    rank: number
    name: string
    email: string
    metrics: {
      callsMade: number
      dealsClosed: number
      revenue: number
      conversionRate: string
    }
  }>
}

interface FinancialAnalytics {
  pnl: {
    revenue: { total: number; net: number; tax: number; discount: number }
    costs: { total: number; cogs: number; expenses: number }
    profit: { gross: number; net: number; margin: number }
  }
  cashflow: { inflow: number; outflow: number; net: number }
  trends: {
    revenue: Array<{ period: string; value: number }>
    expenses: Array<{ period: string; value: number }>
    profit: Array<{ period: string; value: number }>
  }
  growth: { revenue: number; profit: number }
}

interface SalesAnalytics {
  summary: {
    totalRevenue: number
    totalOrders: number
    totalDeals: number
    avgOrderValue: number
    revenueGrowth: number
  }
  trends: {
    revenue: Array<{ period: string; value: number }>
    orders: Array<{ period: string; count: number }>
  }
  topCustomers: Array<{ name: string; revenue: number }>
}

interface CustomerAnalytics {
  summary: {
    totalCustomers: number
    activeCustomers: number
    churnedCustomers: number
    churnRate: number
    avgLTV: number
    avgRevenuePerCustomer: number
  }
  segments: {
    vip: number
    regular: number
    occasional: number
    inactive: number
  }
  topCustomersByLTV: Array<{ name: string; ltv: number; totalRevenue: number; orderCount: number }>
}

export default function AnalyticsDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance | null>(null)
  const [financialAnalytics, setFinancialAnalytics] = useState<FinancialAnalytics | null>(null)
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null)
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null)

  useEffect(() => {
    fetchAllAnalytics()
  }, [tenantId])

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      }

      // Fetch all analytics in parallel
      const [
        healthScoreRes,
        leadSourcesRes,
        teamPerformanceRes,
        financialRes,
        salesRes,
        customerRes,
      ] = await Promise.allSettled([
        fetch('/api/analytics/health-score', { headers }),
        fetch('/api/analytics/lead-sources', { headers }),
        fetch('/api/analytics/team-performance?period=month', { headers }),
        fetch('/api/analytics/advanced/financial?period=month', { headers }),
        fetch('/api/analytics/advanced/sales?period=month', { headers }),
        fetch('/api/analytics/advanced/customers', { headers }),
      ])

      // Process health score
      if (healthScoreRes.status === 'fulfilled' && healthScoreRes.value.ok) {
        const data = await healthScoreRes.value.json()
        setHealthScore(data)
      }

      // Process lead sources
      if (leadSourcesRes.status === 'fulfilled' && leadSourcesRes.value.ok) {
        const data = await leadSourcesRes.value.json()
        setLeadSources(data.sources || [])
      }

      // Process team performance
      if (teamPerformanceRes.status === 'fulfilled' && teamPerformanceRes.value.ok) {
        const data = await teamPerformanceRes.value.json()
        setTeamPerformance(data)
      }

      // Process financial analytics
      if (financialRes.status === 'fulfilled' && financialRes.value.ok) {
        const data = await financialRes.value.json()
        setFinancialAnalytics(data)
      }

      // Process sales analytics
      if (salesRes.status === 'fulfilled' && salesRes.value.ok) {
        const data = await salesRes.value.json()
        setSalesAnalytics(data)
      }

      // Process customer analytics
      if (customerRes.status === 'fulfilled' && customerRes.value.ok) {
        const data = await customerRes.value.json()
        setCustomerAnalytics(data)
      }

    } catch (error: any) {
      console.error('Failed to fetch analytics:', error)
      setError(error.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoading message="Loading Analytics dashboard..." fullScreen={true} />
  }

  const moduleConfig = getModuleConfig('analytics') || getModuleConfig('crm')!

  // Calculate hero metrics from available data
  const totalRevenue = financialAnalytics?.pnl.revenue.net || salesAnalytics?.summary.totalRevenue || 0
  const revenueGrowth = financialAnalytics?.growth.revenue || salesAnalytics?.summary.revenueGrowth || 0
  const healthScoreValue = healthScore?.healthScore || 0
  const totalCustomers = customerAnalytics?.summary.totalCustomers || healthScore?.metrics.totalContacts || 0
  const activeCustomers = customerAnalytics?.summary.activeCustomers || 0

  const heroMetrics = [
    {
      label: 'Health Score',
      value: `${healthScoreValue}`,
      icon: <Heart className="w-5 h-5" />,
      color: healthScoreValue >= 70 ? 'success' as const : healthScoreValue >= 50 ? 'warning' as const : 'error' as const,
    },
    {
      label: 'Total Revenue',
      value: formatINRForDisplay(totalRevenue),
      change: revenueGrowth,
      trend: revenueGrowth > 0 ? 'up' as const : 'down' as const,
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'gold' as const,
    },
    {
      label: 'Total Customers',
      value: totalCustomers.toLocaleString('en-IN'),
      icon: <Users className="w-5 h-5" />,
      color: 'info' as const,
    },
    {
      label: 'Active Customers',
      value: activeCustomers.toLocaleString('en-IN'),
      icon: <Activity className="w-5 h-5" />,
      color: 'success' as const,
    },
  ]

  // Prepare chart data
  const healthScoreComponents = healthScore ? [
    { name: 'Sales', value: healthScore.components.sales, fill: PURPLE_PRIMARY },
    { name: 'Revenue', value: healthScore.components.revenue, fill: GOLD_ACCENT },
    { name: 'Customers', value: healthScore.components.customers, fill: SUCCESS },
    { name: 'Collections', value: healthScore.components.collections, fill: INFO },
    { name: 'Operations', value: healthScore.components.operations, fill: '#8B5CF6' },
  ] : []

  const leadSourcesChartData = leadSources.slice(0, 5).map((source, idx) => ({
    name: source.name,
    roi: parseFloat(source.roi.replace('%', '')),
    conversionRate: parseFloat(source.conversionRate.replace('%', '')),
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }))

  const financialTrendsData = financialAnalytics?.trends.revenue.map((item, idx) => ({
    period: item.period,
    revenue: item.value,
    expenses: financialAnalytics.trends.expenses[idx]?.value || 0,
    profit: financialAnalytics.trends.profit[idx]?.value || 0,
  })) || []

  const salesTrendsData = salesAnalytics?.trends.revenue.map((item, idx) => ({
    period: item.period,
    revenue: item.value,
    orders: salesAnalytics.trends.orders[idx]?.count || 0,
  })) || []

  const customerSegmentsData = customerAnalytics ? [
    { name: 'VIP', value: customerAnalytics.segments.vip, fill: GOLD_ACCENT },
    { name: 'Regular', value: customerAnalytics.segments.regular, fill: SUCCESS },
    { name: 'Occasional', value: customerAnalytics.segments.occasional, fill: INFO },
    { name: 'Inactive', value: customerAnalytics.segments.inactive, fill: '#9CA3AF' },
  ] : []

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Analytics"
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

      <div className="p-6 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`/analytics/${tenantId}/Reports`}>
            <GlassCard delay={0} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Custom Reports</CardTitle>
                      <CardDescription>Create and manage custom reports</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </GlassCard>
          </Link>

          <Link href={`/analytics/${tenantId}/Dashboards`}>
            <GlassCard delay={0.1} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gold-100 rounded-lg">
                      <LayoutDashboard className="h-6 w-6 text-gold-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Custom Dashboards</CardTitle>
                      <CardDescription>Build and customize dashboards</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </GlassCard>
          </Link>
        </div>

        {/* Health Score Section */}
        {healthScore && (
          <GlassCard delay={0.2}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Business Health Score</CardTitle>
                  <CardDescription>Overall business performance metrics</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold" style={{ color: healthScore.healthScore >= 70 ? SUCCESS : healthScore.healthScore >= 50 ? GOLD_ACCENT : ERROR }}>
                    {healthScore.healthScore}
                  </div>
                  <div className="text-sm text-gray-500">out of 100</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Component Scores</h4>
                  <div className="space-y-3">
                    {Object.entries(healthScore.components).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-gray-600">{key}</span>
                          <span className="font-medium">{value.toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${value}%`,
                              backgroundColor: value >= 70 ? SUCCESS : value >= 50 ? GOLD_ACCENT : ERROR,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Key Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Total Contacts</span>
                      <span className="font-bold">{healthScore.metrics.totalContacts.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Total Deals</span>
                      <span className="font-bold">{healthScore.metrics.totalDeals.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Total Revenue</span>
                      <span className="font-bold">{formatINRForDisplay(healthScore.metrics.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Pending Tasks</span>
                      <span className="font-bold">{healthScore.metrics.pendingTasks.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        )}

        {/* Lead Sources Section */}
        {leadSources.length > 0 && (
          <GlassCard delay={0.3}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Lead Source Performance</CardTitle>
              <CardDescription>ROI and conversion metrics by source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadSourcesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip />
                      <Bar dataKey="roi" fill={PURPLE_PRIMARY} name="ROI %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {leadSources.slice(0, 5).map((source, idx) => (
                    <div key={source.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{source.name}</p>
                          <p className="text-xs text-gray-500">{source.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-purple-600">{source.roi}</p>
                          <p className="text-xs text-gray-500">ROI</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Leads</p>
                          <p className="font-medium">{source.leadsCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Conversion</p>
                          <p className="font-medium">{source.conversionRate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Value</p>
                          <p className="font-medium">{formatINRForDisplay(source.totalValue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </GlassCard>
        )}

        {/* Financial Analytics Section */}
        {financialAnalytics && (
          <GlassCard delay={0.4}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Financial Analytics</CardTitle>
              <CardDescription>Profit & Loss, Cashflow, and Trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Net Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatINRForDisplay(financialAnalytics.pnl.revenue.net)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Costs</p>
                  <p className="text-2xl font-bold text-gray-900">{formatINRForDisplay(financialAnalytics.pnl.costs.total)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Net Profit</p>
                  <p className="text-2xl font-bold text-gray-900">{formatINRForDisplay(financialAnalytics.pnl.profit.net)}</p>
                  <p className="text-xs text-gray-500 mt-1">Margin: {financialAnalytics.pnl.profit.margin.toFixed(1)}%</p>
                </div>
              </div>
              {financialTrendsData.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialTrendsData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={GOLD_ACCENT} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={GOLD_ACCENT} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={ERROR} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={ERROR} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="period" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip formatter={(value: any) => formatINRForDisplay(value)} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke={GOLD_ACCENT} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                      <Area type="monotone" dataKey="expenses" stroke={ERROR} fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
                      <Line type="monotone" dataKey="profit" stroke={SUCCESS} strokeWidth={2} name="Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </GlassCard>
        )}

        {/* Sales Analytics Section */}
        {salesAnalytics && (
          <GlassCard delay={0.5}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Sales Analytics</CardTitle>
              <CardDescription>Revenue trends and top customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {salesTrendsData.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="period" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip formatter={(value: any) => typeof value === 'number' ? formatINRForDisplay(value) : value} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke={GOLD_ACCENT} strokeWidth={2} name="Revenue" />
                        <Line type="monotone" dataKey="orders" stroke={PURPLE_PRIMARY} strokeWidth={2} name="Orders" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Top Customers</h4>
                  <div className="space-y-2">
                    {salesAnalytics.topCustomers.slice(0, 5).map((customer, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{customer.name}</span>
                        <span className="font-medium text-gray-900">{formatINRForDisplay(customer.revenue)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Avg Order Value</span>
                      <span className="font-bold">{formatINRForDisplay(salesAnalytics.summary.avgOrderValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Revenue Growth</span>
                      <span className={`font-bold ${salesAnalytics.summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {salesAnalytics.summary.revenueGrowth >= 0 ? '+' : ''}{salesAnalytics.summary.revenueGrowth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        )}

        {/* Customer Analytics Section */}
        {customerAnalytics && (
          <GlassCard delay={0.6}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Customer Analytics</CardTitle>
              <CardDescription>Lifetime value, churn rate, and segmentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Customer Segments</h4>
                  {customerSegmentsData.length > 0 && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={customerSegmentsData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {customerSegmentsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Key Metrics</h4>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Total Customers</span>
                      <span className="font-bold">{customerAnalytics.summary.totalCustomers.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Active Customers</span>
                      <span className="font-bold text-green-600">{customerAnalytics.summary.activeCustomers.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Churn Rate</span>
                      <span className="font-bold text-red-600">{customerAnalytics.summary.churnRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Avg LTV</span>
                      <span className="font-bold">{formatINRForDisplay(customerAnalytics.summary.avgLTV)}</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-gray-600 mb-2">Top Customers by LTV</h5>
                    <div className="space-y-2">
                      {customerAnalytics.topCustomersByLTV.slice(0, 3).map((customer, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <span className="text-gray-700">{customer.name}</span>
                          <span className="font-medium">{formatINRForDisplay(customer.ltv)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        )}

        {/* Team Performance Section */}
        {teamPerformance && (
          <GlassCard delay={0.7}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Team Performance</CardTitle>
              <CardDescription>Sales team metrics and leaderboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Calls Made</p>
                  <p className="text-xl font-bold text-gray-900">{teamPerformance.teamTotals.callsMade}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Emails Sent</p>
                  <p className="text-xl font-bold text-gray-900">{teamPerformance.teamTotals.emailsSent}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Deals Closed</p>
                  <p className="text-xl font-bold text-gray-900">{teamPerformance.teamTotals.dealsClosed}</p>
                </div>
                <div className="p-3 bg-gold-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{formatINRForDisplay(teamPerformance.teamTotals.revenue)}</p>
                </div>
              </div>
              {teamPerformance.leaderboard.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Top Performers</h4>
                  <div className="space-y-2">
                    {teamPerformance.leaderboard.slice(0, 5).map((rep) => (
                      <div key={rep.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-600">#{rep.rank}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{rep.name}</p>
                            <p className="text-xs text-gray-500">{rep.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatINRForDisplay(rep.metrics.revenue)}</p>
                          <p className="text-xs text-gray-500">{rep.metrics.dealsClosed} deals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

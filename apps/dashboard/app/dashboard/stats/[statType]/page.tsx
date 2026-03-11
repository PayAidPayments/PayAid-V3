'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Users, FileText, ShoppingCart, Briefcase, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function StatDrillDownPage() {
  const params = useParams()
  const router = useRouter()
  const { tenant } = useAuthStore()
  
  // Get statType from params (works for /dashboard/stats/[statType])
  const statType = params?.statType as string | undefined

  // Get tenantId from URL or auth store
  const tenantIdFromUrl = params?.tenantId as string | undefined
  const currentTenantId = tenantIdFromUrl || tenant?.id || null

  // Fetch detailed stats
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', statType],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    enabled: !!tenant,
  })

  // Fetch detailed data based on stat type
  const { data: detailedData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['stat-details', statType],
    queryFn: async () => {
      const endpoints: Record<string, string> = {
        contacts: '/api/contacts',
        deals: '/api/deals',
        orders: '/api/orders',
        invoices: '/api/invoices',
        tasks: '/api/tasks',
        revenue: '/api/invoices?status=paid',
        pipeline: '/api/deals?status=active',
        alerts: '/api/alerts',
      }
      const endpoint = statType && endpoints[statType] ? endpoints[statType] : '/api/dashboard/stats'
      const response = await fetch(endpoint, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch details')
      return response.json()
    },
    enabled: !!tenant && !!statType,
  })

  const getStatInfo = () => {
    const info: Record<string, { title: string; icon: any; description: string; calculation: string; data: any }> = {
      contacts: {
        title: 'Contacts',
        icon: Users,
        description: 'Total number of contacts in your CRM',
        calculation: 'Count of all contacts (leads, customers, vendors) in the database',
        data: dashboardStats?.counts?.contacts || 0,
      },
      deals: {
        title: 'Deals',
        icon: Briefcase,
        description: 'Active deals in your sales pipeline',
        calculation: 'Count of all deals with status: "prospecting", "qualification", "proposal", "negotiation", "closed-won"',
        data: dashboardStats?.counts?.deals || 0,
      },
      orders: {
        title: 'Orders',
        icon: ShoppingCart,
        description: 'Total orders placed',
        calculation: 'Count of all orders regardless of status (pending, confirmed, shipped, delivered)',
        data: dashboardStats?.counts?.orders || 0,
      },
      invoices: {
        title: 'Invoices',
        icon: FileText,
        description: 'Total invoices created',
        calculation: 'Count of all invoices regardless of status (draft, sent, paid, overdue)',
        data: dashboardStats?.counts?.invoices || 0,
      },
      tasks: {
        title: 'Tasks',
        icon: CheckCircle,
        description: 'Total tasks in your system',
        calculation: 'Count of all tasks regardless of status (pending, in-progress, completed)',
        data: dashboardStats?.counts?.tasks || 0,
      },
      revenue: {
        title: 'Revenue (30 Days)',
        icon: DollarSign,
        description: 'Total revenue from paid invoices in the last 30 days',
        calculation: 'Sum of all invoices with status="paid" and paidAt date within last 30 days',
        data: dashboardStats?.revenue?.last30Days || 0,
      },
      pipeline: {
        title: 'Pipeline Value',
        icon: TrendingUp,
        description: 'Total value of active deals in your pipeline',
        calculation: 'Sum of deal.value for all deals with status not equal to "closed-lost" or "closed-won"',
        data: dashboardStats?.pipeline?.value || 0,
      },
      alerts: {
        title: 'Alerts',
        icon: AlertCircle,
        description: 'Active alerts requiring attention',
        calculation: 'Count of overdue invoices + count of pending high-priority tasks',
        data: (dashboardStats?.alerts?.overdueInvoices || 0) + (dashboardStats?.alerts?.pendingTasks || 0),
      },
    }
    return statType ? (info[statType] || null) : null
  }

  const statInfo = getStatInfo()
  const Icon = statInfo?.icon || AlertCircle

  const goBack = () => {
    // Always use tenant ID from URL if present, otherwise use currentTenantId
    const tenantIdToUse = tenantIdFromUrl || currentTenantId
    if (tenantIdToUse) {
      router.push(`/dashboard/${tenantIdToUse}`)
    } else {
      router.push('/dashboard')
    }
  }

  if (!statInfo) {
    return (
      <div className="min-h-screen p-6 dark:bg-gray-900">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Stat Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="dark:text-gray-300">The requested stat type &quot;{statType}&quot; is not available.</p>
            <Button onClick={goBack} className="mt-4 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 dark:bg-gray-900" style={{ background: 'linear-gradient(135deg, #F8F7F3 0%, #FFFFFF 100%)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={goBack} style={{ borderColor: PAYAID_PURPLE }} className="dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
                <Icon className="w-8 h-8" />
                {statInfo.title}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{statInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Main Stat Card */}
        <Card className="border-2 dark:bg-gray-800 dark:border-gray-700" style={{ borderColor: PAYAID_PURPLE }}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
              Current Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-4 dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
              {typeof statInfo.data === 'number'
                ? `₹${statInfo.data.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : statInfo.data}
            </div>
            <CardDescription className="text-base dark:text-gray-400">{statInfo.description}</CardDescription>
          </CardContent>
        </Card>

        {/* Calculation Explanation */}
        <Card className="border-2 dark:bg-gray-800 dark:border-gray-700" style={{ borderColor: PAYAID_GOLD }}>
          <CardHeader>
            <CardTitle className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
              How This Number is Calculated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg dark:bg-gray-700" style={{ backgroundColor: '#F8F7F3' }}>
                <p className="text-gray-700 dark:text-gray-300 font-medium">{statInfo.calculation}</p>
              </div>
              
              {statType === 'revenue' && dashboardStats?.revenue && (
                <div className="space-y-2">
                  <h4 className="font-semibold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>Breakdown:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded border dark:border-gray-600 dark:bg-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Last 7 Days</div>
                      <div className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
                        ₹{dashboardStats.revenue.last7Days?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </div>
                    <div className="p-3 rounded border dark:border-gray-600 dark:bg-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Last 30 Days</div>
                      <div className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
                        ₹{dashboardStats.revenue.last30Days?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </div>
                    <div className="p-3 rounded border dark:border-gray-600 dark:bg-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Last 90 Days</div>
                      <div className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
                        ₹{dashboardStats.revenue.last90Days?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </div>
                    <div className="p-3 rounded border dark:border-gray-600 dark:bg-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">All Time</div>
                      <div className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
                        ₹{dashboardStats.revenue.allTime?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {statType === 'pipeline' && dashboardStats?.pipeline && (
                <div className="space-y-2">
                  <h4 className="font-semibold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>Breakdown:</h4>
                  <div className="p-3 rounded border dark:border-gray-600 dark:bg-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Deals</div>
                    <div className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_GOLD }}>
                      {dashboardStats.pipeline.activeDeals || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded border dark:border-gray-600 dark:bg-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Pipeline Value</div>
                    <div className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
                      ₹{dashboardStats.pipeline.value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </div>
                </div>
              )}

              {statType === 'alerts' && dashboardStats?.alerts && (
                <div className="space-y-2">
                  <h4 className="font-semibold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>Breakdown:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                      <div className="text-sm text-red-700 dark:text-red-400">Overdue Invoices</div>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        {dashboardStats.alerts.overdueInvoices || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                      <div className="text-sm text-yellow-700 dark:text-yellow-400">Pending Tasks</div>
                      <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {dashboardStats.alerts.pendingTasks || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Items */}
        {detailedData && Array.isArray(detailedData) && detailedData.length > 0 && (
          <Card className="border-2 dark:bg-gray-800 dark:border-gray-700" style={{ borderColor: PAYAID_PURPLE }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
                Recent {statInfo.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {detailedData.slice(0, 10).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-700 border dark:border-gray-600">
                    <div>
                      <div className="font-medium dark:text-gray-100">{item.name || item.title || item.orderNumber || `#${item.id}`}</div>
                      {item.createdAt && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                    {item.value && (
                      <div className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
                        ₹{item.value.toLocaleString('en-IN')}
                      </div>
                    )}
                    {item.total && (
                      <div className="text-lg font-bold dark:text-gray-100" style={{ color: PAYAID_PURPLE }}>
                        ₹{item.total.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {(isLoading || isLoadingDetails) && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-8">
              <div className="text-center text-gray-500 dark:text-gray-400">Loading details...</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


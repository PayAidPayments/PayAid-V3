'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Target,
  RefreshCw
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface CustomerHealth {
  id: string
  name: string
  email: string
  healthScore: number
  status: 'healthy' | 'at-risk' | 'critical'
  mrr: number
  lastActivity: string
  renewalDate: string
  churnRisk: number
  lifetimeValue: number
}

interface CustomerSuccessStats {
  totalCustomers: number
  healthyCustomers: number
  atRiskCustomers: number
  criticalCustomers: number
  totalMRR: number
  renewalRate: number
  churnRate: number
  averageHealthScore: number
}

export default function CustomerSuccessPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CustomerSuccessStats | null>(null)
  const [customers, setCustomers] = useState<CustomerHealth[]>([])
  const [filter, setFilter] = useState<'all' | 'healthy' | 'at-risk' | 'critical'>('all')

  useEffect(() => {
    fetchCustomerSuccessData()
  }, [tenantId, token])

  const fetchCustomerSuccessData = async () => {
    try {
      setLoading(true)
      if (!token) return

      const response = await fetch('/api/crm/customer-success', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setCustomers(data.customers || [])
      } else {
        console.error('Failed to fetch customer success data')
        // Set mock data for now
        setStats({
          totalCustomers: 0,
          healthyCustomers: 0,
          atRiskCustomers: 0,
          criticalCustomers: 0,
          totalMRR: 0,
          renewalRate: 0,
          churnRate: 0,
          averageHealthScore: 0,
        })
        setCustomers([])
      }
    } catch (error) {
      console.error('Error fetching customer success data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    if (filter === 'all') return true
    return customer.status === filter
  })

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400'
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getHealthBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'at-risk':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return <PageLoading message="Loading customer success data..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customer Success</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor customer health, identify risks, and drive renewals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomerSuccessData}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.totalCustomers || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Healthy</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.healthyCustomers || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stats?.totalCustomers ? Math.round((stats.healthyCustomers / stats.totalCustomers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">At Risk</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.atRiskCustomers || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Critical</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.criticalCustomers || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Immediate action needed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              ₹{stats?.totalMRR?.toLocaleString('en-IN') || '0'}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total MRR from all customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Renewal Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.renewalRate?.toFixed(1) || '0'}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Customers renewing subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.averageHealthScore?.toFixed(0) || '0'}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Out of 100</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Health List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Customer Health Overview</CardTitle>
              <CardDescription>Monitor customer health scores and identify at-risk accounts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('healthy')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'healthy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Healthy
              </button>
              <button
                onClick={() => setFilter('at-risk')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'at-risk'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                At Risk
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'critical'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Critical
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length > 0 ? (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/crm/${tenantId}/Contacts/${customer.id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{customer.name}</h3>
                        <Badge className={getHealthBgColor(customer.status)}>
                          {customer.status === 'healthy' ? 'Healthy' : customer.status === 'at-risk' ? 'At Risk' : 'Critical'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Health Score</p>
                        <p className={`text-2xl font-bold ${getHealthColor(customer.healthScore)}`}>
                          {customer.healthScore}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">MRR</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          ₹{customer.mrr.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Churn Risk</p>
                        <p className={`text-lg font-semibold ${
                          customer.churnRisk > 50 ? 'text-red-600 dark:text-red-400' : 
                          customer.churnRisk > 25 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {customer.churnRisk}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Renewal</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {customer.renewalDate ? format(new Date(customer.renewalDate), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'all' 
                  ? 'No customer data available. Customer success tracking will appear here once you have customers with subscription data.'
                  : `No ${filter === 'healthy' ? 'healthy' : filter === 'at-risk' ? 'at-risk' : 'critical'} customers found.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

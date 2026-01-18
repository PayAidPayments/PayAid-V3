'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { ThemeToggle } from '@/components/ui/theme-toggle'
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
  ResponsiveContainer
} from 'recharts'

const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'

export default function AdvancedAnalyticsPage() {
  const { token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('sales')
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<any>(null)
  const [customerData, setCustomerData] = useState<any>(null)
  const [financialData, setFinancialData] = useState<any>(null)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchData()
  }, [activeTab, period])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      
      if (activeTab === 'sales' || !salesData) {
        const salesRes = await fetch(`/api/analytics/advanced/sales?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (salesRes.ok) {
          setSalesData(await salesRes.json())
        }
      }

      if (activeTab === 'customers' || !customerData) {
        const customersRes = await fetch(`/api/analytics/advanced/customers?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (customersRes.ok) {
          setCustomerData(await customersRes.json())
        }
      }

      if (activeTab === 'financial' || !financialData) {
        const financialRes = await fetch(`/api/analytics/advanced/financial?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (financialRes.ok) {
          setFinancialData(await financialRes.json())
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardLoading message="Loading advanced analytics..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Advanced Analytics</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Comprehensive business intelligence and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
            <Button
              variant="outline"
              onClick={fetchData}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
            <TabsTrigger value="sales" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Sales Analytics
            </TabsTrigger>
            <TabsTrigger value="customers" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Customer Analytics
            </TabsTrigger>
            <TabsTrigger value="financial" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Financial Analytics
            </TabsTrigger>
          </TabsList>

          {/* Sales Analytics */}
          <TabsContent value="sales" className="space-y-6">
            {salesData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ₹{salesData.summary.totalRevenue.toLocaleString()}
                      </div>
                      {salesData.summary.revenueGrowth !== 0 && (
                        <div className={`text-xs mt-1 flex items-center ${salesData.summary.revenueGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {salesData.summary.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {Math.abs(salesData.summary.revenueGrowth).toFixed(1)}%
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{salesData.summary.totalOrders}</div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ₹{salesData.summary.avgOrderValue.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Won Deals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{salesData.summary.totalDeals}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ₹{salesData.summary.totalDealValue.toLocaleString()} value
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Trend Chart */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesData.trends.revenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="period" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke={PAYAID_PURPLE} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Customers */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Top Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {salesData.topCustomers.map((customer: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
                          </div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            ₹{customer.revenue.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Customer Analytics */}
          <TabsContent value="customers" className="space-y-6">
            {customerData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customerData.summary.totalCustomers}</div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{customerData.summary.activeCustomers}</div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Churn Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{customerData.summary.churnRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {customerData.summary.churnedCustomers} churned
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg LTV</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ₹{customerData.summary.avgLTV.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Segments */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Customer Segments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'VIP', value: customerData.segments.vip },
                            { name: 'Regular', value: customerData.segments.regular },
                            { name: 'Occasional', value: customerData.segments.occasional },
                            { name: 'Inactive', value: customerData.segments.inactive },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill={PAYAID_PURPLE} />
                          <Cell fill={PAYAID_GOLD} />
                          <Cell fill="#8B5CF6" />
                          <Cell fill="#EC4899" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Customers by LTV */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Top Customers by LTV</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customerData.topCustomersByLTV.map((customer: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.orderCount} orders • ₹{customer.totalRevenue.toLocaleString()} revenue
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            ₹{customer.ltv.toLocaleString()} LTV
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Financial Analytics */}
          <TabsContent value="financial" className="space-y-6">
            {financialData && (
              <>
                {/* P&L Summary */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Profit & Loss Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Revenue</span>
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ₹{financialData.pnl.revenue.net.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Cost of Goods Sold</span>
                        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                          -₹{financialData.pnl.costs.cogs.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Operating Expenses</span>
                        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                          -₹{financialData.pnl.costs.expenses.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Net Profit</span>
                          <span className={`text-2xl font-bold ${financialData.pnl.profit.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            ₹{financialData.pnl.profit.net.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Profit Margin: {financialData.pnl.profit.margin.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cashflow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Cash Inflow</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ₹{financialData.cashflow.inflow.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Cash Outflow</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        ₹{financialData.cashflow.outflow.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Cashflow</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${financialData.cashflow.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ₹{financialData.cashflow.net.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Profit Trend */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Profit Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={financialData.trends.profit}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="period" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke={PAYAID_PURPLE} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Expenses by Category */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={financialData.expensesByCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="category" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip />
                        <Bar dataKey="amount" fill={PAYAID_GOLD} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

